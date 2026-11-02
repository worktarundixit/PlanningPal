import { pace } from './limiter.ts'
import { CampaignEngineError, type CampaignEvent, type CampaignProvider, type WebhookHealth } from './types.ts'

const BASE = 'https://api.instantly.ai/api/v2'
const LEAD_BATCH = 1000

type FetchLike = typeof fetch

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function text(value: unknown) {
  return typeof value === 'string' ? value : ''
}

export function readProviderEvent(body: unknown): CampaignEvent | null {
  const record = asRecord(body)
  const eventType = text(record.event_type || record.eventType || record.type).toLowerCase()
  const kind = eventType.includes('reply')
    ? 'reply'
    : eventType.includes('bounce')
      ? 'bounce'
      : eventType.includes('click')
        ? 'click'
        : eventType.includes('open')
          ? 'open'
          : null
  if (!kind) return null
  const lead = asRecord(record.lead)
  const email = text(record.lead_email || record.email || lead.email).toLowerCase()
  const workspaceId = text(record.workspace || record.workspace_id || record.organization_id)
  const campaignId = text(record.campaign_id || record.campaign || asRecord(record.campaign_object).id)
  if (!email || !workspaceId) return null
  return { workspaceId, campaignId, email, kind }
}

export function createInstantlyProvider(apiKey: string, fetchImpl: FetchLike = fetch): CampaignProvider {
  async function call(workspaceId: string | null, path: string, init?: RequestInit, attempt = 0): Promise<unknown> {
    await pace(workspaceId || 'agency')
    const headers = new Headers(init?.headers)
    headers.set('Authorization', `Bearer ${apiKey}`)
    headers.set('Content-Type', 'application/json')
    if (workspaceId) headers.set('x-as-workspace', workspaceId)
    const response = await fetchImpl(`${BASE}${path}`, { ...init, headers })
    if (response.status === 429 && attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, 200 * 2 ** attempt))
      return call(workspaceId, path, init, attempt + 1)
    }
    const payload = await response.json().catch(() => ({}))
    if (response.status === 402) throw new CampaignEngineError('plan', { planRequired: true })
    if (!response.ok) throw new CampaignEngineError('request')
    return payload
  }

  return {
    mode: 'live',
    async listWorkspaces() {
      const found: { id: string; name: string; status: string }[] = []
      let startingAfter = ''
      for (let page = 0; page < 10; page += 1) {
        const query = new URLSearchParams({ limit: '100' })
        if (startingAfter) query.set('starting_after', startingAfter)
        const body = asRecord(await call(null, `/workspace-group-members?${query}`))
        const items = Array.isArray(body.items) ? body.items : []
        for (const item of items) {
          const row = asRecord(item)
          const id = text(row.sub_workspace_id)
          if (!id) continue
          found.push({ id, name: text(row.sub_workspace_name) || id, status: text(row.status) || 'pending' })
        }
        startingAfter = text(body.next_starting_after)
        if (!startingAfter) break
      }
      return found
    },
    async createCampaign(workspaceId, name) {
      const body = asRecord(
        await call(workspaceId, '/campaigns', {
          method: 'POST',
          body: JSON.stringify({
            name,
            campaign_schedule: {
              schedules: [
                {
                  name: 'Weekdays',
                  timing: { from: '09:00', to: '17:00' },
                  days: { 1: true, 2: true, 3: true, 4: true, 5: true },
                  timezone: 'Europe/London',
                },
              ],
            },
          }),
        }),
      )
      const id = text(body.id)
      if (!id) throw new CampaignEngineError('request')
      return { id }
    },
    async listCampaigns(workspaceId) {
      const body = asRecord(await call(workspaceId, '/campaigns?limit=100'))
      const items = Array.isArray(body.items) ? body.items : []
      return items.map((item) => {
        const row = asRecord(item)
        const statusValue = row.status
        const status = statusValue === 1 || statusValue === 'active' ? 'live' : statusValue === 2 || statusValue === 'paused' ? 'paused' : 'draft'
        return { id: text(row.id), name: text(row.name), status }
      })
    },
    async pauseCampaign(workspaceId, campaignId) {
      await call(workspaceId, `/campaigns/${campaignId}/pause`, { method: 'POST' })
    },
    async resumeCampaign(workspaceId, campaignId) {
      await call(workspaceId, `/campaigns/${campaignId}/activate`, { method: 'POST' })
    },
    async addLeads(workspaceId, campaignId, leads) {
      let added = 0
      for (let index = 0; index < leads.length; index += LEAD_BATCH) {
        const chunk = leads.slice(index, index + LEAD_BATCH)
        const body = asRecord(
          await call(workspaceId, '/leads/add', {
            method: 'POST',
            body: JSON.stringify({
              campaign_id: campaignId,
              skip_if_in_workspace: true,
              leads: chunk.map((lead) => ({
                email: lead.email,
                first_name: lead.firstName,
                last_name: lead.lastName,
                company_name: lead.company,
                job_title: lead.title,
              })),
            }),
          }),
        )
        const uploaded = Number(body.leads_uploaded ?? body.created_leads ?? chunk.length)
        added += Number.isFinite(uploaded) ? uploaded : chunk.length
      }
      return { added }
    },
    async analytics(workspaceId, campaignId) {
      const body = asRecord(await call(workspaceId, `/campaigns/analytics?id=${encodeURIComponent(campaignId)}`))
      const row = Array.isArray(body.items) ? asRecord(body.items[0]) : body
      const sent = Number(row.emails_sent_count ?? row.sent ?? 0)
      const opens = Number(row.open_count_unique ?? row.unique_open_count ?? row.open_count ?? 0)
      const replies = Number(row.reply_count_unique ?? row.reply_count ?? 0)
      const rate = (part: number) => (sent > 0 && Number.isFinite(part) ? `${((part / sent) * 100).toFixed(1)}%` : '—')
      return { sent: Number.isFinite(sent) ? sent : 0, openRate: rate(opens), replyRate: rate(replies) }
    },
    async registerWebhook(workspaceId, targetUrl): Promise<WebhookHealth> {
      try {
        const existing = asRecord(await call(workspaceId, '/webhooks?limit=100'))
        const items = Array.isArray(existing.items) ? existing.items : []
        const already = items.some((item) => text(asRecord(item).target_hook_url).includes('/api/v1/campaign-events/'))
        if (!already) {
          await call(workspaceId, '/webhooks', {
            method: 'POST',
            body: JSON.stringify({ target_hook_url: targetUrl, event_type: 'all_events', name: 'PlanningPal campaign events' }),
          })
        }
        return 'registered'
      } catch (error) {
        if (error instanceof CampaignEngineError && error.planRequired) return 'unavailable'
        return 'error'
      }
    },
  }
}

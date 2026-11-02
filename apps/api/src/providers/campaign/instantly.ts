import { pace } from './limiter.ts'
import { CampaignEngineError, type CampaignCreateOptions, type CampaignEvent, type CampaignProvider, type WebhookHealth } from './types.ts'

const BASE = 'https://api.instantly.ai/api/v2'
const LEAD_BATCH = 1000
// Instantly only accepts its own timezone list, which has no Europe/London. Isle of Man keeps the same GMT/BST clock.
const UK_TIMEZONE = 'Europe/Isle_of_Man'
const MAX_PAGES = 20

/** Instantly campaign status codes: 0 draft, 1 active, 2 paused, 3 completed, 4 running subsequences, negatives are blocked. */
export function readCampaignStatus(value: unknown): 'draft' | 'live' | 'paused' {
  const code = typeof value === 'string' ? ({ active: 1, paused: 2, draft: 0, completed: 3 } as Record<string, number>)[value.toLowerCase()] : value
  if (code === 1 || code === 4) return 'live'
  if (code === 0 || code === undefined || code === null) return 'draft'
  return 'paused'
}

/** Instantly v2 requires `<br/>` tags for line breaks in delivered email HTML bodies. */
export function formatEmailBodyHtml(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (/<br\s*\/?>/i.test(trimmed)) return trimmed
  return trimmed.replace(/\r?\n/g, '<br/>')
}

function buildCampaignOptionFields(options?: CampaignCreateOptions): Record<string, unknown> {
  if (!options) return {}
  const extra: Record<string, unknown> = {}
  const subject = options.subject?.trim() ?? ''
  const body = formatEmailBodyHtml(options.body ?? '')
  if (subject || body) {
    const delay = typeof options.delayDays === 'number' && Number.isFinite(options.delayDays) ? Math.max(0, Math.min(365, Math.round(options.delayDays))) : 2
    extra.sequences = [
      {
        steps: [
          {
            type: 'email',
            delay,
            delay_unit: 'days',
            variants: [{ subject: subject || 'Approved scheme outreach', body: body || subject }],
          },
        ],
      },
    ]
  }
  if (typeof options.dailyLimit === 'number' && Number.isFinite(options.dailyLimit)) extra.daily_limit = options.dailyLimit
  if (typeof options.stopOnReply === 'boolean') extra.stop_on_reply = options.stopOnReply
  if (Array.isArray(options.emailList) && options.emailList.length > 0) extra.email_list = options.emailList
  return extra
}

type FetchLike = typeof fetch

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function text(value: unknown) {
  return typeof value === 'string' ? value : ''
}

export function readProviderEvent(body: unknown): CampaignEvent | null {
  const root = asRecord(body)
  const data = asRecord(root.data)
  const record = Object.keys(data).length > 0 && !root.event_type && !root.eventType && !root.type ? data : root
  const eventType = text(record.event_type || record.eventType || record.type || data.event_type).toLowerCase()
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
  const lead = asRecord(record.lead || data.lead)
  const email = text(record.lead_email || record.email || lead.email || data.lead_email || data.email).toLowerCase()
  const workspaceId = text(record.workspace || record.workspace_id || record.organization_id || data.workspace || data.workspace_id)
  const campaignId = text(record.campaign_id || record.campaign || asRecord(record.campaign_object).id || data.campaign_id)
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
    // Only retry server errors on reads, so a create is never sent twice.
    const retryable = response.status === 429 || (response.status >= 500 && (init?.method ?? 'GET') === 'GET')
    if (retryable && attempt < 3) {
      const retryAfter = Number(response.headers.get('retry-after'))
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000 * 2 ** attempt
      await new Promise((resolve) => setTimeout(resolve, waitMs))
      return call(workspaceId, path, init, attempt + 1)
    }
    const payload = await response.json().catch(() => ({}))
    if (response.status === 402) throw new CampaignEngineError('plan', { planRequired: true })
    if (!response.ok) throw new CampaignEngineError('request')
    return payload
  }

  return {
    mode: 'live',
    async currentWorkspace() {
      const body = asRecord(await call(null, '/workspaces/current'))
      const id = text(body.id)
      if (!id) return null
      return { id, name: text(body.name) || id, status: 'accepted' }
    },
    async listWorkspaces() {
      const found: { id: string; name: string; status: string }[] = []
      const seen = new Set<string>()
      let groupFailed = false
      let startingAfter = ''
      try {
        for (let page = 0; page < 10; page += 1) {
          const query = new URLSearchParams({ limit: '100' })
          if (startingAfter) query.set('starting_after', startingAfter)
          const body = asRecord(await call(null, `/workspace-group-members?${query}`))
          const items = Array.isArray(body.items) ? body.items : []
          for (const item of items) {
            const row = asRecord(item)
            const id = text(row.sub_workspace_id)
            if (!id || seen.has(id)) continue
            seen.add(id)
            found.push({ id, name: text(row.sub_workspace_name) || id, status: text(row.status) || 'pending' })
          }
          startingAfter = text(body.next_starting_after)
          if (!startingAfter) break
        }
      } catch {
        groupFailed = true
      }
      if (found.length === 0) {
        try {
          const current = asRecord(await call(null, '/workspaces/current'))
          const id = text(current.id)
          if (id && !seen.has(id)) {
            seen.add(id)
            found.push({ id, name: text(current.name) || id, status: 'accepted' })
          }
        } catch {
          if (groupFailed) throw new CampaignEngineError('request')
        }
      }
      return found
    },
    async createCampaign(workspaceId, name, options) {
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
                  days: { '0': false, '1': true, '2': true, '3': true, '4': true, '5': true, '6': false },
                  timezone: UK_TIMEZONE,
                },
              ],
            },
            ...buildCampaignOptionFields(options),
          }),
        }),
      )
      const id = text(body.id)
      if (!id) throw new CampaignEngineError('request')
      return { id }
    },
    async updateCampaign(workspaceId, campaignId, options) {
      const patch: Record<string, unknown> = {
        ...(options.name ? { name: options.name } : {}),
        ...buildCampaignOptionFields(options),
      }
      if (Object.keys(patch).length === 0) return
      await call(workspaceId, `/campaigns/${campaignId}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
    },
    async listCampaigns(workspaceId) {
      const found: { id: string; name: string; status: 'draft' | 'live' | 'paused' }[] = []
      let startingAfter = ''
      for (let page = 0; page < MAX_PAGES; page += 1) {
        const query = new URLSearchParams({ limit: '100' })
        if (startingAfter) query.set('starting_after', startingAfter)
        const body = asRecord(await call(workspaceId, `/campaigns?${query}`))
        const items = Array.isArray(body.items) ? body.items : []
        for (const item of items) {
          const row = asRecord(item)
          found.push({ id: text(row.id), name: text(row.name), status: readCampaignStatus(row.status) })
        }
        startingAfter = text(body.next_starting_after)
        if (!startingAfter || items.length === 0) break
      }
      return found
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
      const query = new URLSearchParams({ id: campaignId, exclude_total_leads_count: 'true' })
      const payload = await call(workspaceId, `/campaigns/analytics?${query}`)
      // Instantly returns a bare array of campaign rows here, not { items }.
      const list = Array.isArray(payload) ? payload : Array.isArray(asRecord(payload).items) ? (asRecord(payload).items as unknown[]) : [payload]
      const row = asRecord(list.find((item) => text(asRecord(item).campaign_id) === campaignId) ?? list[0])
      const sent = Number(row.emails_sent_count ?? 0)
      const opens = Number(row.open_count_unique ?? row.open_count ?? 0)
      // reply_count_unique already leaves out automatic replies.
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

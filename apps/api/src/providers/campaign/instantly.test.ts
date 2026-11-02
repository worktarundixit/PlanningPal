import { describe, expect, it } from 'vitest'
import { createInstantlyProvider, readCampaignStatus, readProviderEvent } from './instantly.ts'

describe('campaign provider client', () => {
  it('sends the workspace header and retries a rate limit', async () => {
    let calls = 0
    const fetchImpl: typeof fetch = async (_url, init) => {
      calls += 1
      const headers = new Headers(init?.headers)
      expect(headers.get('x-as-workspace')).toBe('ws-1')
      expect(headers.get('authorization')).toBe('Bearer secret-key')
      if (calls === 1) return new Response(JSON.stringify({ message: 'slow down' }), { status: 429 })
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }
    const provider = createInstantlyProvider('secret-key', fetchImpl)
    await provider.pauseCampaign('ws-1', 'camp-1')
    expect(calls).toBe(2)
  })

  it('reads analytics from the bare array Instantly returns', async () => {
    const fetchImpl: typeof fetch = async (url) => {
      expect(String(url)).toContain('/campaigns/analytics?id=camp-1')
      return new Response(
        JSON.stringify([{ campaign_id: 'camp-1', emails_sent_count: 200, open_count_unique: 50, reply_count_unique: 10, reply_count: 14 }]),
        { status: 200 },
      )
    }
    const stats = await createInstantlyProvider('k', fetchImpl).analytics('ws-1', 'camp-1')
    expect(stats).toEqual({ sent: 200, openRate: '25.0%', replyRate: '5.0%' })
  })

  it('creates campaigns with a timezone Instantly accepts and string day keys', async () => {
    let sent: {
      daily_limit?: number
      stop_on_reply?: boolean
      campaign_schedule?: { schedules: { timezone: string; days: Record<string, boolean> }[] }
      sequences?: { steps: unknown[] }[]
    } = {}
    const fetchImpl: typeof fetch = async (_url, init) => {
      sent = JSON.parse(String(init?.body)) as typeof sent
      return new Response(JSON.stringify({ id: 'camp-9' }), { status: 200 })
    }
    await createInstantlyProvider('k', fetchImpl).createCampaign('ws-1', 'Spring', {
      subject: 'Scheme — {{companyName}}',
      body: 'Hi {{firstName}},\n\nLet us connect.',
      delayDays: 3,
      dailyLimit: 25,
      stopOnReply: true,
    })
    const schedule = sent.campaign_schedule?.schedules[0]
    expect(schedule?.timezone).toBe('Europe/Isle_of_Man')
    expect(schedule?.days).toMatchObject({ '1': true, '5': true, '6': false })
    expect(sent.daily_limit).toBe(25)
    expect(sent.stop_on_reply).toBe(true)
    expect(sent.sequences?.[0]?.steps[0]).toEqual({
      type: 'email',
      delay: 3,
      delay_unit: 'days',
      variants: [{ subject: 'Scheme — {{companyName}}', body: 'Hi {{firstName}},<br/><br/>Let us connect.' }],
    })
  })

  it('falls back to /workspaces/current when a workspace-scoped key has no group members', async () => {
    const fetchImpl: typeof fetch = async (url) => {
      if (String(url).includes('/workspace-group-members')) return new Response(JSON.stringify({ items: [] }), { status: 200 })
      return new Response(JSON.stringify({ id: 'ws-curr', name: 'Primary Workspace' }), { status: 200 })
    }
    const list = await createInstantlyProvider('k', fetchImpl).listWorkspaces()
    expect(list).toEqual([{ id: 'ws-curr', name: 'Primary Workspace', status: 'accepted' }])
  })

  it('maps every Instantly campaign status code', () => {
    expect(readCampaignStatus(0)).toBe('draft')
    expect(readCampaignStatus(1)).toBe('live')
    expect(readCampaignStatus(4)).toBe('live')
    expect(readCampaignStatus(2)).toBe('paused')
    expect(readCampaignStatus(3)).toBe('paused')
    expect(readCampaignStatus(-2)).toBe('paused')
  })

  it('reads reply, open, bounce and click events', () => {
    expect(readProviderEvent({ event_type: 'reply_received', workspace: 'ws-9', lead_email: 'Maya@Studio.co.uk', campaign_id: 'c1' })?.kind).toBe('reply')
    expect(readProviderEvent({ event_type: 'email_opened', workspace_id: 'ws-9', email: 'a@b.co' })?.kind).toBe('open')
    expect(readProviderEvent({ event_type: 'email_bounced', workspace: 'ws-9', email: 'a@b.co' })?.kind).toBe('bounce')
    expect(readProviderEvent({ event_type: 'email_link_clicked', workspace: 'ws-9', email: 'a@b.co' })?.kind).toBe('click')
    expect(readProviderEvent({ event_type: 'email_sent', workspace: 'ws-9', email: 'a@b.co' })).toBeNull()
  })
})

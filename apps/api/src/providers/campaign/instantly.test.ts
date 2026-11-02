import { describe, expect, it } from 'vitest'
import { createInstantlyProvider, readProviderEvent } from './instantly.ts'

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

  it('reads reply, open, bounce and click events', () => {
    expect(readProviderEvent({ event_type: 'reply_received', workspace: 'ws-9', lead_email: 'Maya@Studio.co.uk', campaign_id: 'c1' })?.kind).toBe('reply')
    expect(readProviderEvent({ event_type: 'email_opened', workspace_id: 'ws-9', email: 'a@b.co' })?.kind).toBe('open')
    expect(readProviderEvent({ event_type: 'email_bounced', workspace: 'ws-9', email: 'a@b.co' })?.kind).toBe('bounce')
    expect(readProviderEvent({ event_type: 'email_link_clicked', workspace: 'ws-9', email: 'a@b.co' })?.kind).toBe('click')
    expect(readProviderEvent({ event_type: 'email_sent', workspace: 'ws-9', email: 'a@b.co' })).toBeNull()
  })
})

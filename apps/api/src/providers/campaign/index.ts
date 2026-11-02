import { db } from '../../db/client.ts'
import { campaignProviderSettings } from '../../db/schema.ts'
import { openSecret } from './crypto.ts'
import { createInstantlyProvider, readProviderEvent } from './instantly.ts'
import { createSandboxProvider } from './sandbox.ts'
import { CampaignEngineError, ENGINE_UNAVAILABLE, type CampaignProvider } from './types.ts'

export { ENGINE_UNAVAILABLE, CampaignEngineError, readProviderEvent }
export type { CampaignEvent, CampaignProvider, ProviderLead, WebhookHealth } from './types.ts'

export async function loadCampaignEngine(): Promise<{ mode: 'sandbox' | 'live'; provider: CampaignProvider }> {
  if (process.env.CAMPAIGN_PROVIDER === 'sandbox') return { mode: 'sandbox', provider: createSandboxProvider() }
  const [row] = await db.select().from(campaignProviderSettings).limit(1)
  const secret = process.env.CAMPAIGN_KEY_ENCRYPTION_SECRET
  if (!row || !secret) return { mode: 'sandbox', provider: createSandboxProvider() }
  try {
    const apiKey = openSecret(row.ciphertext, secret)
    if (!apiKey) return { mode: 'sandbox', provider: createSandboxProvider() }
    return { mode: 'live', provider: createInstantlyProvider(apiKey) }
  } catch {
    return { mode: 'sandbox', provider: createSandboxProvider() }
  }
}

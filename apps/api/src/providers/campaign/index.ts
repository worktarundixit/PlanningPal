import { db } from '../../db/client.ts'
import { campaignProviderSettings } from '../../db/schema.ts'
import { openSecret } from './crypto.ts'
import { createInstantlyProvider, readProviderEvent } from './instantly.ts'
import { createSandboxProvider } from './sandbox.ts'
import { CampaignEngineError, ENGINE_UNAVAILABLE, type CampaignProvider } from './types.ts'

export { ENGINE_UNAVAILABLE, CampaignEngineError, createInstantlyProvider, readProviderEvent }
export type { CampaignCreateOptions, CampaignEvent, CampaignProvider, ProviderLead, WebhookHealth } from './types.ts'

export const CLIENT_KEY_PREFIX = 'client:'

export function formatClientKeyHint(organisationId: string, maskedHint: string) {
  return `${CLIENT_KEY_PREFIX}${organisationId}:${maskedHint}`
}

export function parseClientKeyHint(rawHint: string): { organisationId: string; hint: string } | null {
  if (!rawHint.startsWith(CLIENT_KEY_PREFIX)) return null
  const rest = rawHint.slice(CLIENT_KEY_PREFIX.length)
  const sep = rest.indexOf(':')
  if (sep <= 0) return null
  return { organisationId: rest.slice(0, sep), hint: rest.slice(sep + 1) }
}

export async function loadCampaignEngine(
  organisationId?: string,
  overrideApiKey?: string,
): Promise<{ mode: 'sandbox' | 'live'; provider: CampaignProvider }> {
  // No saved agency key stays in sandbox. CAMPAIGN_PROVIDER=sandbox stays there even after a key is saved.
  if (process.env.CAMPAIGN_PROVIDER === 'sandbox') return { mode: 'sandbox', provider: createSandboxProvider() }
  if (overrideApiKey?.trim()) return { mode: 'live', provider: createInstantlyProvider(overrideApiKey.trim()) }
  const rows = await db.select().from(campaignProviderSettings)
  const secret = process.env.CAMPAIGN_KEY_ENCRYPTION_SECRET
  if (!rows.length || !secret) return { mode: 'sandbox', provider: createSandboxProvider() }
  const clientRow = organisationId
    ? rows.find((item) => parseClientKeyHint(item.hint)?.organisationId === organisationId)
    : undefined
  const agencyRow = rows.find((item) => !item.hint.startsWith(CLIENT_KEY_PREFIX))
  const target = clientRow ?? agencyRow
  if (!target) return { mode: 'sandbox', provider: createSandboxProvider() }
  try {
    const apiKey = openSecret(target.ciphertext, secret)
    if (!apiKey) return { mode: 'sandbox', provider: createSandboxProvider() }
    return { mode: 'live', provider: createInstantlyProvider(apiKey) }
  } catch {
    return { mode: 'sandbox', provider: createSandboxProvider() }
  }
}

import { randomUUID } from 'node:crypto'
import type { CampaignProvider, ProviderLead } from './types.ts'

const workspaces = [
  { id: 'sandbox-london', name: 'Sandbox · London', status: 'accepted' },
  { id: 'sandbox-national', name: 'Sandbox · National', status: 'accepted' },
]

/** In-memory campaign engine used when no agency key is stored. */
export function createSandboxProvider(): CampaignProvider {
  const campaigns = new Map<string, { id: string; name: string; status: 'draft' | 'live' | 'paused'; leads: number }>()
  return {
    mode: 'sandbox',
    async listWorkspaces() {
      return workspaces
    },
    async currentWorkspace() {
      return workspaces[0] ?? null
    },
    async createCampaign(_workspaceId, name) {
      const id = `sandbox-${randomUUID()}`
      campaigns.set(id, { id, name, status: 'draft', leads: 0 })
      return { id }
    },
    async updateCampaign(_workspaceId, campaignId, options) {
      const campaign = campaigns.get(campaignId)
      if (campaign && options.name) campaign.name = options.name
    },
    async listCampaigns() {
      return [...campaigns.values()].map(({ id, name, status }) => ({ id, name, status }))
    },
    async pauseCampaign(_workspaceId, campaignId) {
      const campaign = campaigns.get(campaignId)
      if (campaign && campaign.status !== 'draft') campaign.status = 'paused'
    },
    async resumeCampaign(_workspaceId, campaignId) {
      const campaign = campaigns.get(campaignId)
      if (campaign) campaign.status = 'live'
    },
    async addLeads(_workspaceId, campaignId, leads: ProviderLead[]) {
      const campaign = campaigns.get(campaignId)
      if (campaign) campaign.leads += leads.length
      return { added: leads.length }
    },
    async analytics(_workspaceId, campaignId) {
      const campaign = campaigns.get(campaignId)
      return { sent: campaign?.leads ?? 0, openRate: '—', replyRate: '—' }
    },
    async registerWebhook() {
      return 'sandbox'
    },
  }
}

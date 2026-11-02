export type ProviderWorkspace = { id: string; name: string; status: string }

export type ProviderLead = {
  email: string
  firstName?: string
  lastName?: string
  company?: string
  title?: string
}

export type ProviderCampaign = { id: string; name: string; status: 'draft' | 'live' | 'paused' }

export type ProviderAnalytics = { sent: number; openRate: string; replyRate: string }

export type WebhookHealth = 'registered' | 'unavailable' | 'not_configured' | 'error' | 'sandbox'

export type CampaignEventKind = 'open' | 'reply' | 'bounce' | 'click'

export type CampaignEvent = {
  workspaceId: string
  campaignId: string
  email: string
  kind: CampaignEventKind
}

export interface CampaignProvider {
  readonly mode: 'sandbox' | 'live'
  listWorkspaces(): Promise<ProviderWorkspace[]>
  createCampaign(workspaceId: string, name: string): Promise<{ id: string }>
  listCampaigns(workspaceId: string): Promise<ProviderCampaign[]>
  pauseCampaign(workspaceId: string, campaignId: string): Promise<void>
  resumeCampaign(workspaceId: string, campaignId: string): Promise<void>
  addLeads(workspaceId: string, campaignId: string, leads: ProviderLead[]): Promise<{ added: number }>
  analytics(workspaceId: string, campaignId: string): Promise<ProviderAnalytics>
  registerWebhook(workspaceId: string, targetUrl: string): Promise<WebhookHealth>
}

export const ENGINE_UNAVAILABLE = 'The campaign engine could not complete that request. Try again shortly.'

export class CampaignEngineError extends Error {
  planRequired: boolean

  constructor(message: string, options?: { planRequired?: boolean }) {
    super(message)
    this.planRequired = options?.planRequired ?? false
  }
}

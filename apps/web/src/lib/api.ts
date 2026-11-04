import type { PortalDocument, Scheme, UserProfile } from '@planningpal/shared'
import type { Activity, BoardCard, Conversation } from '../types'
import { accessToken } from './auth-client'

const base = import.meta.env.VITE_API_URL ?? ''

const ACTIVE_WORKSPACE_KEY = 'planningpal_active_workspace_id'
const PREVIEW_ROLE_KEY = 'planningpal_preview_role'

export function getActiveWorkspaceId(): string {
  try {
    return localStorage.getItem(ACTIVE_WORKSPACE_KEY) || ''
  } catch {
    return ''
  }
}

type CacheEntry = {
  data: unknown
  timestamp: number
}

const memoryCache = new Map<string, CacheEntry>()
const inFlightPromises = new Map<string, Promise<unknown>>()
const DEFAULT_TTL_MS = 60_000

export function clearApiCache(pathPrefix?: string) {
  if (!pathPrefix) {
    memoryCache.clear()
    inFlightPromises.clear()
    return
  }
  for (const key of memoryCache.keys()) {
    if (key.includes(pathPrefix)) memoryCache.delete(key)
  }
  for (const key of inFlightPromises.keys()) {
    if (key.includes(pathPrefix)) inFlightPromises.delete(key)
  }
}

export function setActiveWorkspaceId(workspaceId: string | null) {
  try {
    if (workspaceId) localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspaceId)
    else localStorage.removeItem(ACTIVE_WORKSPACE_KEY)
    clearApiCache()
  } catch {
    // ignore storage errors
  }
}

export function getPreviewRole(): string {
  try {
    return localStorage.getItem(PREVIEW_ROLE_KEY) || ''
  } catch {
    return ''
  }
}

export function setPreviewRole(role: string | null) {
  try {
    if (role) localStorage.setItem(PREVIEW_ROLE_KEY, role)
    else localStorage.removeItem(PREVIEW_ROLE_KEY)
    clearApiCache()
  } catch {
    // ignore storage errors
  }
}

function safeError(status: number, payload: { error?: string }) {
  if (status === 401) return 'Your session has expired. Sign in again.'
  if (status === 403) return 'You do not have access to this.'
  if (status >= 500) return 'Something went wrong. Please try again.'
  const message = payload.error?.trim() || ''
  if (!message || message.length > 180 || /stack|\\n\s+at\s/i.test(message)) return 'That request could not be completed.'
  return message
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method || 'GET').toUpperCase()
  const isGet = method === 'GET' && !init?.body
  const activeWs = getActiveWorkspaceId()
  const previewRole = getPreviewRole()
  const cacheKey = `${path}::ws=${activeWs}::role=${previewRole}`

  // Return fresh cached data if available (instant 0ms render)
  if (isGet) {
    const cached = memoryCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < DEFAULT_TTL_MS) {
      return cached.data as T
    }
    const inFlight = inFlightPromises.get(cacheKey)
    if (inFlight) {
      return inFlight as Promise<T>
    }
  }

  const fetchPromise = (async () => {
    const headers = new Headers(init?.headers)
    if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
    const token = await accessToken()
    if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`)
    if (activeWs && !headers.has('x-workspace-id')) headers.set('x-workspace-id', activeWs)
    if (previewRole && !headers.has('x-preview-role')) headers.set('x-preview-role', previewRole)
    let response: Response
    try {
      response = await fetch(`${base}${path}`, { ...init, headers, credentials: 'include' })
    } catch {
      window.dispatchEvent(new Event('planningpal-offline'))
      throw new Error('You appear to be offline. Check your connection and try again.')
    }
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string }
      if (response.status === 401 && !path.includes('/team/invites/')) window.location.assign('/sign-in?expired=1')
      throw new Error(safeError(response.status, payload))
    }
    if (response.status === 204) {
      if (!isGet) clearApiCache()
      return undefined as T
    }
    const type = response.headers.get('content-type') || ''
    const result = type.includes('text/csv') ? ((await response.text()) as T) : ((await response.json()) as T)
    if (isGet) {
      memoryCache.set(cacheKey, { data: result, timestamp: Date.now() })
    } else {
      // Mutations clear cached query results so screens receive fresh data
      clearApiCache()
    }
    return result
  })()

  if (isGet) {
    inFlightPromises.set(cacheKey, fetchPromise)
    fetchPromise.finally(() => {
      inFlightPromises.delete(cacheKey)
    })
  }

  return fetchPromise
}

export type Overview = {
  schemes: number
  contactsFound: number
  saved: number
  metrics: {
    priorityActions?: number
    highIntentSignals?: string
    highIntentNew?: string
    meetingsBooked?: string
    meetingsTarget?: string
    pipelineValue?: string
    pipelineDelta?: string
    prospects?: string
    qualified?: string
    negotiating?: string
    pipelineHealth?: number
    inboxesHealthy?: string
    deliveryRate?: string
    pipelineChart?: number[]
    crmSummary?: { value: string; label: string; icon: string; target: string }[]
    reports?: {
      cards: { value: string; label: string; delta: string }[]
      total: string
      chart: number[]
      mix: { name: string; value: number; color: string }[]
    }
  }
  intent: { id: string; initials: string; name: string; action: string; detail: string; time: string; hot: boolean }[]
}

export type Campaign = {
  id: string
  name: string
  status: string
  region: string
  contacts: number
  sent: number
  open: string
  reply: string
  meetings: number
}

export type ContactGroup = {
  id: string
  name: string
  description: string
  memberCount: number
  createdAt: string
  updatedAt: string
}

export type ContactGroupMember = {
  id: string
  email: string
  firstName: string
  lastName: string
  company: string
  title: string
  phone: string
  council: string
  schemeTitle: string
  schemeRef: string
  createdAt: string
}

export type Domain = { id: string; name: string; inboxes: number; health: string; status: string }

export type SessionProfile = UserProfile & {
  organisationId: string | null
  orgRole: string | null
  orgRoleLabel: string
  platformRole: 'super_admin' | null
  permissions: string[]
}

export type DossierContact = {
  id: string
  role: string
  firmName: string
  contactName: string
  email: string
  phone: string
  rawAddress: string
  confidenceLevel: string
}

export type LeadDossierResponse = {
  scheme: Scheme
  summary?: {
    heading: string
    council: string
    value: string
    status: string
    populatedColumns: number
    columnCount: number
  }
  contacts?: DossierContact[]
  documents?: PortalDocument[]
  activities?: Activity[]
}

export const api = {
  leads: () => request<{ data: Scheme[]; total: number }>('/api/v1/planning/leads?limit=1000'),
  leadDossier: (id: string, refresh = false) =>
    request<LeadDossierResponse>(`/api/v1/planning/leads/${encodeURIComponent(id)}${refresh ? '?refresh=1' : ''}`),
  lpas: () => request<{ regions: { region: string; councils: { name: string; gssCode: string; coverage: string }[] }[] }>('/api/v1/lpas'),
  lpaHealth: () => request<LpaHealth>('/api/v1/lpas/health'),
  workspaceLeads: () => request<{ data: Scheme[] }>('/api/v1/workspace-leads'),
  currentLeadFetch: () => request<{ job: LeadFetch | null }>('/api/v1/lead-fetches/current'),
  startLeadFetch: (days: number) => request<{ job: LeadFetch }>('/api/v1/lead-fetches', { method: 'POST', body: JSON.stringify({ days }) }),
  advanceLeadFetch: (id: string) => request<{ job: LeadFetch }>(`/api/v1/lead-fetches/${id}/advance`, { method: 'POST' }),
  retryLeadFetch: (id: string) => request<{ job: LeadFetch }>(`/api/v1/lead-fetches/${id}/retry`, { method: 'POST' }),
  saved: () => request<{ ids: string[] }>('/api/v1/saved-schemes'),
  save: (applicationRef: string) => request('/api/v1/saved-schemes', { method: 'POST', body: JSON.stringify({ applicationRef }) }),
  unsave: (applicationRef: string) => request(`/api/v1/saved-schemes/${encodeURIComponent(applicationRef)}`, { method: 'DELETE' }),
  saveBulk: (applicationRefs: string[]) => request('/api/v1/saved-schemes/bulk', { method: 'POST', body: JSON.stringify({ applicationRefs }) }),
  exportLeads: async (ids?: string[]) => {
    const csv = await request<string>('/api/v1/planning/leads/export', {
      method: 'POST',
      body: JSON.stringify({ format: 'csv', filter_params: ids?.length ? { ids } : {} }),
    })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    link.download = `planningpal-schemes-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  },
  me: () => request<SessionProfile>('/api/v1/me'),
  providers: () => request<{ email: boolean; magicLink: boolean; google: boolean; microsoft: boolean }>('/api/v1/auth/providers'),
  invitation: (token: string) =>
    request<{ email: string; name?: string; firstName?: string; lastName?: string; role: string; organisation: string; expired: boolean }>(
      `/api/v1/team/invites/${token}`,
    ),
  updateMe: (profile: UserProfile) => request<UserProfile>('/api/v1/me', { method: 'PATCH', body: JSON.stringify(profile) }),
  setupTwoFactor: () =>
    request<{ secret: string; otpauthUrl: string; currentCodeHint?: string }>('/api/v1/me/2fa', {
      method: 'POST',
      body: JSON.stringify({ action: 'setup' }),
    }),
  verifyTwoFactor: (code: string) =>
    request<{ twoFactorEnabled: boolean; backupCodes: string[] }>('/api/v1/me/2fa', {
      method: 'POST',
      body: JSON.stringify({ action: 'verify', code }),
    }),
  disableTwoFactor: () =>
    request<{ twoFactorEnabled: boolean }>('/api/v1/me/2fa', {
      method: 'POST',
      body: JSON.stringify({ action: 'disable' }),
    }),
  overview: () => request<Overview>('/api/v1/overview'),
  reports: () => request<NonNullable<Overview['metrics']['reports']>>('/api/v1/reports'),
  delivery: () => request<Record<string, unknown>>('/api/v1/delivery'),
  billing: () => request<Record<string, unknown>>('/api/v1/billing'),
  kanban: () => request<{ cards: BoardCard[] }>('/api/v1/crm/kanban'),
  moveStage: (id: string, stage: number) => request(`/api/v1/crm/leads/${id}/stage`, { method: 'PATCH', body: JSON.stringify({ stage: String(stage) }) }),
  archiveLead: (id: string, archived: boolean) => request(`/api/v1/crm/leads/${id}/archive`, { method: 'POST', body: JSON.stringify({ archived }) }),
  activities: (type?: string) => request<{ data: Activity[] }>(`/api/v1/crm/activities${type ? `?type=${type}` : ''}`),
  createActivity: (body: Record<string, unknown>) => request<Activity>('/api/v1/crm/activities', { method: 'POST', body: JSON.stringify(body) }),
  completeActivity: (id: string, completed: boolean) => request(`/api/v1/crm/activities/${id}`, { method: 'PATCH', body: JSON.stringify({ completed }) }),
  inbox: () => request<{ data: Conversation[]; unreadCount: number }>('/api/v1/inbox/conversations'),
  markRead: (id: string) => request(`/api/v1/inbox/conversations/${id}/read`, { method: 'POST' }),
  markUnread: (id: string) => request(`/api/v1/inbox/conversations/${id}/unread`, { method: 'POST' }),
  markAllRead: () => request('/api/v1/inbox/read-all', { method: 'POST' }),
  reply: (id: string, body: string) => request<Conversation['messages'][number]>(`/api/v1/inbox/conversations/${id}/reply`, { method: 'POST', body: JSON.stringify({ body }) }),
  campaigns: () => request<{ data: Campaign[] }>('/api/v1/campaigns'),
  createCampaign: (body: { name: string; region: string; subject?: string; body?: string; delayDays?: number; stopOnReply?: boolean }) =>
    request<Campaign>('/api/v1/campaigns', { method: 'POST', body: JSON.stringify(body) }),
  updateCampaign: (id: string, body: { name?: string; region?: string; subject?: string; body?: string; delayDays?: number; stopOnReply?: boolean }) =>
    request<Campaign>(`/api/v1/campaigns/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  pauseCampaign: (id: string) => request<Campaign>(`/api/v1/campaigns/${id}/pause`, { method: 'POST' }),
  resumeCampaign: (id: string) => request<Campaign>(`/api/v1/campaigns/${id}/resume`, { method: 'POST' }),
  campaignSettings: () => request<{ dailyLimit: number; warmup: boolean; trackingDomain: string }>('/api/v1/campaign-settings'),
  saveCampaignSettings: (body: { dailyLimit?: number; warmup?: boolean }) => request('/api/v1/campaign-settings', { method: 'PATCH', body: JSON.stringify(body) }),
  domains: () => request<{ data: Domain[] }>('/api/v1/sending-domains'),
  addDomain: (body: { name: string; status: string; health: string; inboxes: number }) => request<Domain>('/api/v1/sending-domains', { method: 'POST', body: JSON.stringify(body) }),
  removeDomain: (id: string) => request(`/api/v1/sending-domains/${id}`, { method: 'DELETE' }),
  workspace: () => request<{ territories: string[]; trades: string[]; radius: number; signalAlerts: boolean }>('/api/v1/workspace'),
  saveWorkspace: (body: { territories?: string[]; trades?: string[]; radius?: number; signalAlerts?: boolean }) =>
    request('/api/v1/workspace', { method: 'PATCH', body: JSON.stringify(body) }),
  team: () => request<{ members: { id: string; name: string; email: string; role: string; status: string }[]; customRoles: { id: string; name: string; permissions: string[] }[] }>('/api/v1/team'),
  invite: (email: string, role: string, name?: string) =>
    request<{ id: string; name: string; email: string; role: string; status: string; inviteUrl: string }>('/api/v1/team/invites', {
      method: 'POST',
      body: JSON.stringify({ email, role, ...(name ? { name } : {}) }),
    }),
  updateMember: (id: string, role: string) => request(`/api/v1/team/${id}`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  removeMember: (id: string) => request(`/api/v1/team/${id}`, { method: 'DELETE' }),
  createRole: (name: string, permissions: string[]) =>
    request<{ id: string; name: string; permissions: string[] }>('/api/v1/roles', {
      method: 'POST',
      body: JSON.stringify({ name, permissions }),
    }),
  updateRole: (id: string, body: { name?: string; permissions?: string[] }) =>
    request<{ id: string; name: string; permissions: string[] }>(`/api/v1/roles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deleteRole: (id: string) => request<{ id: string; deleted: boolean }>(`/api/v1/roles/${id}`, { method: 'DELETE' }),
  persona: () => request<{ stakeholder: string; angle: string; proofPoints: string[] }>('/api/v1/persona'),
  savePersona: (body: { stakeholder: string; angle: string; proofPoints?: string[] }) => request('/api/v1/persona', { method: 'PUT', body: JSON.stringify(body) }),
  bookDemo: (body: { name: string; email: string; company: string; trade: string; note: string }) =>
    request('/api/v1/demo-requests', { method: 'POST', body: JSON.stringify(body) }),
  campaignProvider: () => request<{ configured: boolean; hint: string; mode: 'sandbox' | 'live' }>('/api/v1/campaign-provider'),
  saveCampaignProvider: (apiKey: string) => request<{ configured: boolean; hint: string; mode: 'sandbox' | 'live' }>('/api/v1/campaign-provider', { method: 'PUT', body: JSON.stringify({ apiKey }) }),
  providerWorkspaces: () => request<{ data: ProviderWorkspace[]; canCreate: boolean }>('/api/v1/campaign-provider/workspaces'),
  campaignMappings: () => request<{ data: CampaignMapping[] }>('/api/v1/campaign-provider/mappings'),
  saveCampaignMapping: (body: { organisationId: string; providerWorkspaceId: string; trackingDomain: string; workspaceApiKey?: string }) =>
    request<CampaignMapping>('/api/v1/campaign-provider/mappings', { method: 'PUT', body: JSON.stringify(body) }),
  addCampaignLeads: (id: string, leads: { email: string; firstName?: string; lastName?: string; company?: string; title?: string }[]) =>
    request<{ added: number; synced?: boolean; warning?: string }>(`/api/v1/campaigns/${id}/leads`, { method: 'POST', body: JSON.stringify({ leads }) }),
  contactGroups: () => request<{ data: ContactGroup[] }>('/api/v1/contact-groups'),
  createContactGroup: (body: { name: string; description?: string }) =>
    request<ContactGroup>('/api/v1/contact-groups', { method: 'POST', body: JSON.stringify(body) }),
  deleteContactGroup: (id: string) => request<{ success: boolean }>(`/api/v1/contact-groups/${id}`, { method: 'DELETE' }),
  contactGroupMembers: (id: string) =>
    request<{ group: { id: string; name: string; description: string }; data: ContactGroupMember[] }>(`/api/v1/contact-groups/${id}/members`),
  addContactGroupMembers: (
    id: string,
    members: Array<{
      email: string
      firstName?: string
      lastName?: string
      company?: string
      title?: string
      phone?: string
      council?: string
      schemeTitle?: string
      schemeRef?: string
    }>,
  ) =>
    request<{ added: number; total: number }>(`/api/v1/contact-groups/${id}/members`, { method: 'POST', body: JSON.stringify({ members }) }),
  importGroupToCampaign: (campaignId: string, groupId: string) =>
    request<{ added: number; groupName: string; synced?: boolean; warning?: string }>(`/api/v1/campaigns/${campaignId}/import-group`, {
      method: 'POST',
      body: JSON.stringify({ groupId }),
    }),
  ingestRuns: () => request<{ data: IngestRun[] }>('/api/v1/ingest/runs'),
  startIngest: (body: { recent?: number; from?: string; to?: string; authority?: string; maxPages?: number; source?: 'planit' | 'london-datahub' | 'auto' }) =>
    request<IngestRun>('/api/v1/ingest/runs', { method: 'POST', body: JSON.stringify(body) }),
  enrichContacts: (limit = 25) =>
    request<{ scanned: number; enriched: number }>('/api/v1/ingest/enrich', { method: 'POST', body: JSON.stringify({ limit }) }),
  onboarding: () => request<OnboardingState>('/api/v1/onboarding'),
  saveOnboarding: (body: Record<string, unknown>) => request<OnboardingState>('/api/v1/onboarding', { method: 'PUT', body: JSON.stringify(body) }),
  onboardingClients: () => request<{ data: ClientOnboarding[] }>('/api/v1/onboarding/clients'),
  createOnboardingClient: (body: {
    firstName: string
    lastName?: string
    email: string
    companyName: string
    coverage?: 'ALL_UK' | 'CATEGORY_3' | 'regional' | 'multi_county' | 'nationwide'
    sendEmail?: boolean
  }) =>
    request<
      ClientOnboarding & {
        customerName: string
        inviteToken: string
        token: string
        inviteUrl: string
        emailSent: boolean
      }
    >('/api/v1/onboarding/clients', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  resendClientInvite: (organisationId: string) =>
    request<{ sent: boolean; email: string; inviteUrl: string; token: string; inviteToken: string }>(
      `/api/v1/onboarding/clients/${organisationId}/resend-invite`,
      { method: 'POST' },
    ),
  downloadRunCsv: async (id: string) => {
    const csv = await request<string>(`/api/v1/ingest/runs/${id}/csv`)
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    link.download = `planit-${id}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  },
}

export type LpaHealth = {
  active: number
  abolished: number
  planitCovered: number
  staleDays: number
  unavailable: { name: string; gssCode: string; coverage: string }[]
  stale: { name: string; gssCode: string; latest: string | null }[]
}

export type LeadFetch = {
  id: string
  days: number
  status: 'running' | 'succeeded' | 'empty' | 'partial'
  scanned: number
  total: number
  found: number
  failed: number
  message: string
  suggest: 'widen' | 'icp' | 'retry' | null
}

export type OnboardingState = {
  step: 'workspace' | 'profile' | 'icp' | 'team' | 'alerts' | 'done'
  invited: boolean
  steps: { id: string; label: string; optional: boolean; state: 'complete' | 'current' | 'upcoming' | 'skipped' }[]
  draft: {
    companyName: string
    logoUrl: string
    name: string
    firstName: string
    lastName: string
    email: string
    phone: string
    secondaryEmail: string
    jobTitle: string
    coverage: string
    regions: string[]
    councils: string[]
    projectTypes: string[]
    valueRanges: string[]
    ribaStages: string[]
    alertsEnabled: boolean
    frequency: string
    teamInvites?: { name: string; email: string; role: string; status: string }[]
  }
  checklistDismissed: boolean
  checklist: { id: string; label: string; done: boolean; skipped: boolean }[]
}

export type ClientOnboarding = {
  id: string
  name: string
  ownerName?: string
  inviteUrl?: string
  coverage: string
  planName: string
  step: string
  finished: boolean
}

export type ProviderWorkspace = { id: string; name: string; status: string }

export type CampaignMapping = {
  organisationId: string
  organisationName: string
  providerWorkspaceId: string
  trackingDomain: string
  status: string
  webhookStatus: string
  health: string
  keyHint?: string
}

export type IngestRun = {
  id: string
  source: string
  status: string
  startedAt: string
  finishedAt: string | null
  fetched: number
  filteredOut: number
  inserted: number
  updated: number
  errors: number
  message: string
  csvPath: string
}

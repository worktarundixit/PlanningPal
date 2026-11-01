import type { Scheme, UserProfile } from '@planningpal/shared'
import type { Activity, BoardCard, Conversation } from '../types'

const base = import.meta.env.VITE_API_URL ?? ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const response = await fetch(`${base}${path}`, { ...init, headers })
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error || `Request failed (${response.status})`)
  }
  if (response.status === 204) return undefined as T
  const type = response.headers.get('content-type') || ''
  if (type.includes('text/csv')) return (await response.text()) as T
  return response.json() as Promise<T>
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

export type Domain = { id: string; name: string; inboxes: number; health: string; status: string }

export const api = {
  leads: () => request<{ data: Scheme[]; total: number }>('/api/v1/planning/leads?limit=1000'),
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
    link.download = `aec-pipeline-schemes-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  },
  me: () => request<UserProfile>('/api/v1/me'),
  updateMe: (profile: UserProfile) => request<UserProfile>('/api/v1/me', { method: 'PATCH', body: JSON.stringify(profile) }),
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
  createCampaign: (body: { name: string; region: string }) => request<Campaign>('/api/v1/campaigns', { method: 'POST', body: JSON.stringify(body) }),
  updateCampaign: (id: string, body: { name?: string; region?: string }) => request<Campaign>(`/api/v1/campaigns/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
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
  invite: (email: string, role: string) => request('/api/v1/team/invites', { method: 'POST', body: JSON.stringify({ email, role }) }),
  updateMember: (id: string, role: string) => request(`/api/v1/team/${id}`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  removeMember: (id: string) => request(`/api/v1/team/${id}`, { method: 'DELETE' }),
  createRole: (name: string, permissions: string[]) => request('/api/v1/roles', { method: 'POST', body: JSON.stringify({ name, permissions }) }),
  persona: () => request<{ stakeholder: string; angle: string; proofPoints: string[] }>('/api/v1/persona'),
  savePersona: (body: { stakeholder: string; angle: string; proofPoints?: string[] }) => request('/api/v1/persona', { method: 'PUT', body: JSON.stringify(body) }),
  bookDemo: (body: { name: string; email: string; company: string; trade: string; note: string }) =>
    request('/api/v1/demo-requests', { method: 'POST', body: JSON.stringify(body) }),
}

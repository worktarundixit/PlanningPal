export type CrmTab = 'pipeline' | 'intent' | 'inbox' | 'tasks' | 'opportunities' | 'contacts'
export type ReportsTab = 'reports' | 'delivery'
export type SetupTab = 'persona' | 'settings' | 'team'

export type BoardCard = {
  id: string
  person: string
  firm: string
  scheme: string
  schemeId: string
  value: string
  opens: number
  stage: number
  stageId?: string
  assignee: string
  archived?: boolean
  timeLabel?: string
  preview?: string
}

export type InboxMessage = {
  id: string
  direction: 'inbound' | 'outbound' | string
  senderName: string
  body: string
  deliveryStatus: string
  timeLabel: string
}

export type Conversation = {
  id: string
  crmLeadId: string | null
  subject: string
  preview: string
  unread: boolean
  timeLabel: string
  person: string
  firm: string
  scheme: string
  schemeId: string
  assignee: string
  opens: number
  archived: boolean
  messages: InboxMessage[]
}

export type Activity = {
  id: string
  type: string
  title: string
  body: string
  outcome: string
  dueOn: string | null
  completedAt: string | null
  crmLeadId: string | null
  applicationId: string | null
  applicationRef: string | null
  createdAt: string
}

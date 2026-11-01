import { sql } from 'drizzle-orm'
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}

export const organisations = pgTable('organisations', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyName: text('company_name').notNull(),
  tier: text('tier').notNull().default('CATEGORY_3'),
  planName: text('plan_name').notNull().default('Team Plan'),
  monthlyPrice: text('monthly_price').notNull().default('£2,950'),
  tradeSpecialisms: text('trade_specialisms').array().notNull().default(sql`ARRAY[]::text[]`),
  targetTerritories: text('target_territories').array().notNull().default(sql`ARRAY[]::text[]`),
  operatingRadiusMiles: integer('operating_radius_miles').notNull().default(25),
  signalAlerts: boolean('signal_alerts').notNull().default(true),
  dailySendLimit: integer('daily_send_limit').notNull().default(30),
  warmupEnabled: boolean('warmup_enabled').notNull().default(true),
  trackingDomain: text('tracking_domain').notNull().default('click.micraft-pipeline.co.uk'),
  portalSnapshot: jsonb('portal_snapshot').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  active: boolean('active').notNull().default(true),
  createdAt: timestamps.createdAt,
})

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id').references(() => organisations.id, { onDelete: 'cascade' }),
  /** Supabase Auth user id (`auth.users.id`). No local credential table. */
  authUserId: text('auth_user_id').unique(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  jobTitle: text('job_title').notNull().default('Account owner'),
  orgRole: text('org_role').notNull().default('member'),
  platformRole: text('platform_role'),
  apiToken: text('api_token').notNull().unique(),
  passwordHash: text('password_hash'),
  twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
  emailPreferences: jsonb('email_preferences').$type<Record<string, boolean>>().notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamps.createdAt,
  updatedAt: timestamps.updatedAt,
})

export const teamMembers = pgTable('team_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id')
    .notNull()
    .references(() => organisations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  role: text('role').notNull().default('member'),
  status: text('status').notNull().default('Active'),
  createdAt: timestamps.createdAt,
})

export const customRoles = pgTable('custom_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id')
    .notNull()
    .references(() => organisations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  permissions: text('permissions').array().notNull().default(sql`ARRAY[]::text[]`),
  createdAt: timestamps.createdAt,
})

export const councils = pgTable('councils', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  portalType: text('portal_type').notNull().default('UNKNOWN'),
  baseUrl: text('base_url').notNull().default(''),
  county: text('county').notNull().default(''),
  region: text('region').notNull().default(''),
  active: boolean('active').notNull().default(true),
  createdAt: timestamps.createdAt,
})

export const planningApplications = pgTable(
  'planning_applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    councilId: uuid('council_id').references(() => councils.id, { onDelete: 'set null' }),
    applicationRef: text('application_ref').notNull(),
    compositeHash: text('composite_hash').notNull(),
    projectId: text('project_id').notNull().default(''),
    heading: text('heading').notNull().default(''),
    proposal: text('proposal').notNull().default(''),
    valueFromM: numeric('value_from_m', { precision: 10, scale: 3 }).notNull().default('0'),
    valueToM: numeric('value_to_m', { precision: 10, scale: 3 }).notNull().default('0'),
    estValueFromM: numeric('est_value_from_m', { precision: 10, scale: 3 }).notNull().default('0'),
    estValueToM: numeric('est_value_to_m', { precision: 10, scale: 3 }).notNull().default('0'),
    siteRawAddress: text('site_raw_address').notNull().default(''),
    siteAddress: text('site_address').notNull().default(''),
    siteAddressLine1: text('site_address_line1').notNull().default(''),
    siteTown: text('site_town').notNull().default(''),
    siteCounty: text('site_county').notNull().default(''),
    postcode: text('postcode').notNull().default(''),
    outcode: text('outcode').notNull().default(''),
    localAuthority: text('local_authority').notNull().default(''),
    county: text('county').notNull().default(''),
    region: text('region').notNull().default(''),
    projectStage: text('project_stage').notNull().default(''),
    status: text('status').notNull().default('Approved'),
    primaryCategory: text('primary_category').notNull().default(''),
    propType: text('prop_type').notNull().default(''),
    publicationDate: text('publication_date').notNull().default(''),
    validationDate: date('validation_date'),
    decisionDate: date('decision_date'),
    portalUrl: text('portal_url').notNull().default(''),
    clientApplicantContact: text('client_applicant_contact').notNull().default(''),
    clientApplicant: text('client_applicant').notNull().default(''),
    clientApplicantRawAddress: text('client_applicant_raw_address').notNull().default(''),
    clientApplicantPhone: text('client_applicant_phone').notNull().default(''),
    architectAgentContact: text('architect_agent_contact').notNull().default(''),
    architectAgent: text('architect_agent').notNull().default(''),
    architectAgentRawAddress: text('architect_agent_raw_address').notNull().default(''),
    architectAgentPhone: text('architect_agent_phone').notNull().default(''),
    architectAgentEmail: text('architect_agent_email').notNull().default(''),
    sourceIndex: integer('source_index').notNull().default(0),
    sourceRecord: jsonb('source_record').$type<Record<string, string>>().notNull(),
    latitude: numeric('latitude', { precision: 9, scale: 6 }),
    longitude: numeric('longitude', { precision: 9, scale: 6 }),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (table) => [
    uniqueIndex('planning_applications_authority_ref_idx').on(table.localAuthority, table.applicationRef),
    uniqueIndex('planning_applications_hash_idx').on(table.compositeHash),
    index('planning_applications_outcode_idx').on(table.outcode),
    index('planning_applications_region_idx').on(table.region),
    index('planning_applications_value_idx').on(table.valueToM),
  ],
)

export const decisionMakers = pgTable('decision_makers', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id')
    .notNull()
    .references(() => planningApplications.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  firmName: text('firm_name').notNull().default(''),
  contactName: text('contact_name').notNull().default(''),
  email: text('email').notNull().default(''),
  phone: text('phone').notNull().default(''),
  rawAddress: text('raw_address').notNull().default(''),
  postcode: text('postcode').notNull().default(''),
  companyNumber: text('company_number'),
  confidenceLevel: text('confidence_level').notNull().default('STUDIO_MATCH'),
  createdAt: timestamps.createdAt,
})

export const savedSchemes = pgTable(
  'saved_schemes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => planningApplications.id, { onDelete: 'cascade' }),
    createdAt: timestamps.createdAt,
  },
  (table) => [uniqueIndex('saved_schemes_org_app_idx').on(table.organisationId, table.applicationId)],
)

export const crmLeads = pgTable(
  'crm_leads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => planningApplications.id, { onDelete: 'cascade' }),
    stage: text('stage').notNull().default('STAGE_1_COLD'),
    intentScore: integer('intent_score').notNull().default(0),
    openCount: integer('open_count').notNull().default(0),
    deckDownloaded: boolean('deck_downloaded').notNull().default(false),
    assigneeName: text('assignee_name').notNull().default('Unassigned'),
    archived: boolean('archived').notNull().default(false),
    lastOpenedAt: timestamp('last_opened_at', { withTimezone: true }),
    sdrNotes: text('sdr_notes').notNull().default(''),
    meetingBookedAt: timestamp('meeting_booked_at', { withTimezone: true }),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (table) => [index('crm_leads_client_stage_idx').on(table.organisationId, table.stage)],
)

export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id')
    .notNull()
    .references(() => organisations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  crmLeadId: uuid('crm_lead_id').references(() => crmLeads.id, { onDelete: 'cascade' }),
  applicationId: uuid('application_id').references(() => planningApplications.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull().default(''),
  body: text('body').notNull().default(''),
  outcome: text('outcome').notNull().default(''),
  dueOn: date('due_on'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamps.createdAt,
})

export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id')
    .notNull()
    .references(() => organisations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  status: text('status').notNull().default('draft'),
  region: text('region').notNull().default('London'),
  contacts: integer('contacts').notNull().default(0),
  sent: integer('sent').notNull().default(0),
  openRate: text('open_rate').notNull().default('—'),
  replyRate: text('reply_rate').notNull().default('—'),
  meetings: integer('meetings').notNull().default(0),
  createdAt: timestamps.createdAt,
  updatedAt: timestamps.updatedAt,
})

export const sendingDomains = pgTable('sending_domains', {
  id: uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id')
    .notNull()
    .references(() => organisations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  inboxes: integer('inboxes').notNull().default(0),
  health: text('health').notNull().default('Setup'),
  status: text('status').notNull().default('Verifying'),
  createdAt: timestamps.createdAt,
})

export const inboxConversations = pgTable('inbox_conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id')
    .notNull()
    .references(() => organisations.id, { onDelete: 'cascade' }),
  crmLeadId: uuid('crm_lead_id').references(() => crmLeads.id, { onDelete: 'set null' }),
  subject: text('subject').notNull().default(''),
  preview: text('preview').notNull().default(''),
  unread: boolean('unread').notNull().default(true),
  timeLabel: text('time_label').notNull().default(''),
  createdAt: timestamps.createdAt,
  updatedAt: timestamps.updatedAt,
})

export const inboxMessages = pgTable('inbox_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => inboxConversations.id, { onDelete: 'cascade' }),
  direction: text('direction').notNull(),
  senderName: text('sender_name').notNull().default(''),
  body: text('body').notNull().default(''),
  deliveryStatus: text('delivery_status').notNull().default('delivered'),
  timeLabel: text('time_label').notNull().default(''),
  createdAt: timestamps.createdAt,
})

export const intentEvents = pgTable('intent_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id')
    .notNull()
    .references(() => organisations.id, { onDelete: 'cascade' }),
  crmLeadId: uuid('crm_lead_id').references(() => crmLeads.id, { onDelete: 'set null' }),
  actorName: text('actor_name').notNull(),
  actorInitials: text('actor_initials').notNull().default(''),
  action: text('action').notNull(),
  detail: text('detail').notNull().default(''),
  hot: boolean('hot').notNull().default(false),
  timeLabel: text('time_label').notNull().default(''),
  createdAt: timestamps.createdAt,
})

export const personaTemplates = pgTable('persona_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id')
    .notNull()
    .references(() => organisations.id, { onDelete: 'cascade' }),
  stakeholder: text('stakeholder').notNull().default('Lead architect'),
  angle: text('angle').notNull().default(''),
  proofPoints: jsonb('proof_points').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  updatedAt: timestamps.updatedAt,
})

export const meetings = pgTable('meetings', {
  id: uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id')
    .notNull()
    .references(() => organisations.id, { onDelete: 'cascade' }),
  whenLabel: text('when_label').notNull(),
  firm: text('firm').notNull(),
  scheme: text('scheme').notNull(),
  kind: text('kind').notNull(),
  createdAt: timestamps.createdAt,
})

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id')
    .notNull()
    .references(() => organisations.id, { onDelete: 'cascade' }),
  issuedOn: text('issued_on').notNull(),
  number: text('number').notNull(),
  amount: text('amount').notNull(),
  status: text('status').notNull().default('Paid'),
})

export const demoRequests = pgTable('demo_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  company: text('company').notNull(),
  trade: text('trade').notNull().default(''),
  note: text('note').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const pipelineRuns = pgTable('pipeline_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  source: text('source').notNull(),
  status: text('status').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  fetched: integer('fetched').notNull().default(0),
  filteredOut: integer('filtered_out').notNull().default(0),
  inserted: integer('inserted').notNull().default(0),
  updated: integer('updated').notNull().default(0),
  errors: integer('errors').notNull().default(0),
  csvPath: text('csv_path').notNull().default(''),
  cursorBefore: text('cursor_before').notNull().default(''),
  cursorAfter: text('cursor_after').notNull().default(''),
  message: text('message').notNull().default(''),
  options: jsonb('options').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
})

export const rawPayloads = pgTable('raw_payloads', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').references(() => pipelineRuns.id, { onDelete: 'cascade' }),
  source: text('source').notNull(),
  requestUrl: text('request_url').notNull().default(''),
  body: jsonb('body').$type<unknown>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const ingestCursors = pgTable('ingest_cursors', {
  source: text('source').primaryKey(),
  lastDifferent: text('last_different').notNull().default(''),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const telemetryEvents = pgTable('telemetry_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: text('event_id').notNull().unique(),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
  createdAt: timestamps.createdAt,
})

export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id')
    .notNull()
    .references(() => organisations.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role').notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  invitedBy: uuid('invited_by').references(() => users.id, { onDelete: 'set null' }),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const mailLog = pgTable('mail_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  kind: text('kind').notNull(),
  recipient: text('recipient').notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

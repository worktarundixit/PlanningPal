import { councilCode, mapRecord, parseCsv } from '@planningpal/shared'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { db, sqlClient } from './db/client.ts'
import {
  activities,
  campaigns,
  clients,
  councils,
  crmLeads,
  decisionMakers,
  inboxConversations,
  inboxMessages,
  intentEvents,
  invoices,
  meetings,
  personaTemplates,
  planningApplications,
  savedSchemes,
  sendingDomains,
  teamMembers,
  users,
} from './db/schema.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const csvPath = path.resolve(here, '../data/master-approved-residential.csv')

const portalSnapshot = {
  priorityActions: 8,
  highIntentSignals: '38',
  highIntentNew: '8 new',
  meetingsBooked: '12',
  meetingsTarget: '75%',
  pipelineValue: '£62.4m',
  pipelineDelta: '+16.8%',
  prospects: '24',
  qualified: '9',
  negotiating: '4',
  pipelineHealth: 92,
  inboxesHealthy: '12 inboxes healthy',
  deliveryRate: '98.4% delivery',
  pipelineChart: [34, 45, 38, 57, 49, 68, 61, 79, 71, 88, 82, 100],
  reports: {
    cards: [
      { value: '2,184', label: 'Validated leads', delta: '+12.4%' },
      { value: '66.8%', label: 'Unique open rate', delta: '+3.1%' },
      { value: '7.6%', label: 'Positive reply rate', delta: '+1.4%' },
      { value: '£39.2m', label: 'Attributed pipeline', delta: '+18.2%' },
    ],
    total: '£39.2m total',
    chart: [22, 31, 28, 44, 39, 57, 54, 69, 63, 78, 74, 92],
    mix: [
      { name: 'Housing', value: 38, color: '#2563EB' },
      { name: 'Commercial', value: 27, color: '#38BDF8' },
      { name: 'Industrial', value: 19, color: '#A78BFA' },
      { name: 'Healthcare', value: 10, color: '#F59E0B' },
      { name: 'Education', value: 6, color: '#34D399' },
    ],
  },
  delivery: {
    period: 'June 2025 delivery period',
    headline: 'Your service is on track',
    summary: 'All lead, outreach and meeting SLAs are currently meeting or exceeding your Team Plan.',
    complete: 92,
    kpis: [
      { value: '46 / 50', label: 'Qualified leads delivered', note: 'Weekly target', pct: 92 },
      { value: '2,814 / 4,000', label: 'Decision-makers contacted', note: 'Monthly allowance', pct: 70 },
      { value: '12 / 16', label: 'Meetings booked', note: 'Monthly target', pct: 75 },
    ],
    manager: {
      name: 'Emily Rhodes',
      role: 'Senior AEC Campaign Lead',
      email: 'account@aecpipeline.co.uk',
      nextReview: '03 July 2025 · 11:00 AM',
    },
  },
  billing: {
    nextInvoice: '01 Jul 2025',
    cycle: 'Monthly',
    status: 'Active',
    seats: '3 included',
    card: 'Visa ending in 4821',
    expiry: 'Expires 08/28',
  },
  crmSummary: [
    { value: '38', label: 'High-intent leads', icon: 'signal', target: 'intent' },
    { value: '12', label: 'Positive replies', icon: 'mail', target: 'intent' },
    { value: '6', label: 'Meetings booked', icon: 'calendar', target: 'tasks' },
    { value: '£39.2m', label: 'Attributed pipeline', icon: 'chart', target: 'opportunities' },
  ],
}

const crmBlueprint = [
  { opens: 1, stage: 'STAGE_1_COLD', assignee: 'Emily Rhodes', unread: true, time: '12m' },
  { opens: 2, stage: 'STAGE_2_OUTREACH', assignee: 'James Wilkins', unread: false, time: '12m' },
  { opens: 7, stage: 'STAGE_3_INTENT', assignee: 'Emily Rhodes', unread: true, time: '3h' },
  { opens: 4, stage: 'STAGE_3_INTENT', assignee: 'James Wilkins', unread: false, time: '4h' },
  { opens: 5, stage: 'STAGE_4_WARM', assignee: 'Emily Rhodes', unread: true, time: '5h' },
  { opens: 8, stage: 'STAGE_5_TENDER', assignee: 'Unassigned', unread: false, time: '6h' },
] as const

function money(value: string | undefined) {
  const parsed = Number(value || 0)
  return (Number.isFinite(parsed) ? parsed : 0).toFixed(3)
}

function originOf(url: string) {
  try {
    return new URL(url).origin
  } catch {
    return ''
  }
}

function splitPostcode(address: string, area: string) {
  const match = address.toUpperCase().match(/\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/)
  if (!match) return { postcode: area, outcode: area }
  return { postcode: `${match[1]} ${match[2]}`, outcode: match[1] ?? area }
}

function isoDays(offset: number) {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}

async function main() {
  const records = parseCsv(readFileSync(csvPath, 'utf8'))
  if (records.length < 500) throw new Error(`Expected the residential export, found ${records.length} rows`)

  await sqlClient.unsafe(`
    TRUNCATE TABLE
      demo_requests,
      telemetry_events,
      invoices,
      meetings,
      persona_templates,
      intent_events,
      inbox_messages,
      inbox_conversations,
      sending_domains,
      campaigns,
      activities,
      crm_leads,
      saved_schemes,
      decision_makers,
      planning_applications,
      councils,
      custom_roles,
      team_members,
      users,
      clients
    RESTART IDENTITY CASCADE
  `)

  const [client] = await db
    .insert(clients)
    .values({
      companyName: 'Micraft Design Ltd',
      tier: 'CATEGORY_3',
      planName: 'Team Plan',
      monthlyPrice: '£2,950',
      tradeSpecialisms: ['Groundworks', 'RC Frame', 'Civil Engineering', 'Drainage'],
      targetTerritories: ['Surrey', 'Berkshire', 'Greater London'],
      operatingRadiusMiles: 25,
      signalAlerts: true,
      dailySendLimit: 30,
      warmupEnabled: true,
      trackingDomain: 'click.micraft-pipeline.co.uk',
      portalSnapshot,
    })
    .returning()
  if (!client) throw new Error('Client seed failed')

  const [user] = await db
    .insert(users)
    .values({
      clientId: client.id,
      email: 'james@micraftdesign.co.uk',
      name: 'James Wilkins',
      jobTitle: 'Account owner',
      apiToken: process.env.DEMO_USER_TOKEN || 'dev-token',
      twoFactorEnabled: false,
      emailPreferences: {
        'High-intent alerts': true,
        'Task reminders': true,
        'Weekly planning digest': true,
      },
    })
    .returning()
  if (!user) throw new Error('User seed failed')

  await db.insert(teamMembers).values([
    { clientId: client.id, userId: user.id, name: 'James Wilkins', email: 'james@micraftdesign.co.uk', role: 'Owner', status: 'Active' },
    { clientId: client.id, name: 'Emily Rhodes', email: 'emily@micraftdesign.co.uk', role: 'Admin', status: 'Active' },
    { clientId: client.id, name: 'Daniel Kaur', email: 'daniel@micraftdesign.co.uk', role: 'Member', status: 'Active' },
  ])

  await db.insert(personaTemplates).values({
    clientId: client.id,
    stakeholder: 'Lead architect',
    angle: 'Offer complimentary early technical review, CAD/BIM detailing and compliant NBS specification support.',
    proofPoints: ['Two ready groundworks gangs in Guildford', 'CAT 320 excavator fleet availability', 'CHAS Elite accredited', '£10m public liability cover'],
  })

  await db.insert(campaigns).values([
    { clientId: client.id, name: 'Micraft Design · RIBA 1–2', status: 'live', region: 'South East', contacts: 842, sent: 616, openRate: '66.8%', replyRate: '8.4%', meetings: 7 },
    { clientId: client.id, name: 'Berkshire Commercial New Build', status: 'live', region: 'South East', contacts: 514, sent: 381, openRate: '63.1%', replyRate: '6.9%', meetings: 4 },
    { clientId: client.id, name: 'Greater London RC Frame', status: 'draft', region: 'London', contacts: 1240, sent: 0, openRate: '—', replyRate: '—', meetings: 0 },
  ])

  await db.insert(sendingDomains).values([
    { clientId: client.id, name: 'micraft-projects.co.uk', inboxes: 3, health: '98.1%', status: 'Healthy' },
    { clientId: client.id, name: 'get-micraft.co.uk', inboxes: 3, health: '97.6%', status: 'Healthy' },
    { clientId: client.id, name: 'micraft-commercial.co.uk', inboxes: 3, health: '98.8%', status: 'Healthy' },
    { clientId: client.id, name: 'micraft-pipeline.co.uk', inboxes: 3, health: '99.1%', status: 'Healthy' },
  ])

  await db.insert(intentEvents).values([
    { clientId: client.id, actorName: 'Maya Evans', actorInitials: 'ME', action: 'opened your case study', detail: 'Guildford Innovation District', hot: true, timeLabel: '3m' },
    { clientId: client.id, actorName: 'Daniel Kaur', actorInitials: 'DK', action: 'clicked portfolio link', detail: 'Harrowgate Living Quarter', hot: true, timeLabel: '18m' },
    { clientId: client.id, actorName: 'Alice Morgan', actorInitials: 'AM', action: 'opened introduction', detail: 'Marlow Health Hub', hot: false, timeLabel: '1h' },
    { clientId: client.id, actorName: 'Tom Ridley', actorInitials: 'TR', action: 'replied to campaign', detail: 'Egham Logistics Campus', hot: false, timeLabel: '2h' },
  ])

  await db.insert(meetings).values([
    { clientId: client.id, whenLabel: '20 Jun · 10:30', firm: 'Northbank Studio', scheme: 'Guildford Innovation District', kind: 'Discovery call' },
    { clientId: client.id, whenLabel: '24 Jun · 14:00', firm: 'Fieldwork Architects', scheme: 'Harrowgate Living Quarter', kind: 'Technical review' },
    { clientId: client.id, whenLabel: '27 Jun · 09:30', firm: 'Element Architects', scheme: 'Staines Campus', kind: 'Tender qualification' },
  ])

  await db.insert(invoices).values([
    { clientId: client.id, issuedOn: '01 Jun 2025', number: 'INV-2025-0601', amount: '£2,950', status: 'Paid' },
    { clientId: client.id, issuedOn: '01 May 2025', number: 'INV-2025-0501', amount: '£2,950', status: 'Paid' },
    { clientId: client.id, issuedOn: '01 Apr 2025', number: 'INV-2025-0401', amount: '£2,950', status: 'Paid' },
  ])

  const councilMap = new Map<string, { code: string; name: string; county: string; region: string; baseUrl: string }>()
  for (const record of records) {
    const name = record['Local Authority'] || 'Unknown authority'
    const code = councilCode(name)
    const current = councilMap.get(code)
    councilMap.set(code, {
      code,
      name,
      county: record.County || current?.county || '',
      region: record.Region || current?.region || '',
      baseUrl: current?.baseUrl || originOf(record['URL Link'] || ''),
    })
  }
  const councilRows = await db.insert(councils).values([...councilMap.values()].map((council) => ({ ...council, portalType: 'UNKNOWN' }))).returning()
  const councilIdByCode = new Map(councilRows.map((council) => [council.code, council.id]))

  const applicationValues = records.map((record, sourceIndex) => {
    const authority = record['Local Authority'] || 'Unknown authority'
    const code = councilCode(authority)
    const address = record['Site Address'] || record['Site Raw Address'] || ''
    const located = splitPostcode(address, record['Site Address Postcode Area'] || '')
    const stage = record['Project Stage'] || ''
    const applicationRef = record['Application Reference'] || record['Project ID'] || `record-${sourceIndex}`
    return {
      councilId: councilIdByCode.get(code),
      applicationRef,
      compositeHash: createHash('sha256').update(`${code}|${applicationRef}`).digest('hex'),
      projectId: record['Project ID'] || '',
      heading: record.Heading || '',
      proposal: record.Proposal || '',
      valueFromM: money(record['£m Value From']),
      valueToM: money(record['£m Value To']),
      estValueFromM: money(record['£m Est Prop Val From']),
      estValueToM: money(record['£m Est Prop Val To']),
      siteRawAddress: record['Site Raw Address'] || '',
      siteAddress: record['Site Address'] || '',
      siteAddressLine1: address,
      siteCounty: record.County || '',
      postcode: located.postcode,
      outcode: located.outcode,
      localAuthority: authority,
      county: record.County || '',
      region: record.Region || '',
      projectStage: stage,
      status: stage.includes('APPROVED') ? 'Approved' : stage || 'Under Assessment',
      primaryCategory: (record['Project Category'] || '').replaceAll('_', ' ').toUpperCase(),
      propType: record['Prop Type'] || '',
      publicationDate: record['Publication Date'] || '',
      portalUrl: record['URL Link'] || '',
      clientApplicantContact: record['Client Applicant Contact'] || '',
      clientApplicant: record['Client Applicant'] || '',
      clientApplicantRawAddress: record['Client Applicant Raw Address'] || '',
      clientApplicantPhone: record['Client Applicant Phone'] || '',
      architectAgentContact: record['Architect Agent Contact'] || '',
      architectAgent: record['Architect Agent'] || '',
      architectAgentRawAddress: record['Architect Agent Raw Address'] || '',
      architectAgentPhone: record['Architect Agent Phone'] || '',
      architectAgentEmail: record['Architect Agent Email'] || '',
      sourceIndex,
      sourceRecord: record,
    }
  })

  const insertedApps: Array<{
    id: string
    sourceIndex: number
    sourceRecord: Record<string, string>
    applicationRef: string
  }> = []
  for (let offset = 0; offset < applicationValues.length; offset += 100) {
    const chunk = await db.insert(planningApplications).values(applicationValues.slice(offset, offset + 100)).returning({
      id: planningApplications.id,
      sourceIndex: planningApplications.sourceIndex,
      sourceRecord: planningApplications.sourceRecord,
      applicationRef: planningApplications.applicationRef,
    })
    insertedApps.push(...chunk)
  }
  insertedApps.sort((a, b) => a.sourceIndex - b.sourceIndex)

  const contacts = insertedApps.flatMap((app) => {
    const record = app.sourceRecord
    const architectEmail = record['Architect Agent Email'] || ''
    const architectPhone = record['Architect Agent Phone'] || ''
    const confidence = architectEmail && architectPhone ? 'VERIFIED_DIRECT' : architectEmail || architectPhone ? 'STUDIO_MATCH' : 'MANUAL_REVIEW'
    return [
      {
        applicationId: app.id,
        role: 'ARCHITECT',
        firmName: record['Architect Agent'] || '',
        contactName: record['Architect Agent Contact'] || '',
        email: architectEmail,
        phone: architectPhone,
        rawAddress: record['Architect Agent Raw Address'] || '',
        postcode: record['Architect Agent Postcode'] || record['Architect Agent Postcode Area'] || '',
        confidenceLevel: confidence,
      },
      {
        applicationId: app.id,
        role: 'APPLICANT',
        firmName: record['Client Applicant'] || '',
        contactName: record['Client Applicant Contact'] || '',
        email: '',
        phone: record['Client Applicant Phone'] || '',
        rawAddress: record['Client Applicant Raw Address'] || '',
        postcode: record['Client Applicant Postcode'] || record['Client Applicant Postcode Area'] || '',
        confidenceLevel: record['Client Applicant Phone'] ? 'STUDIO_MATCH' : 'MANUAL_REVIEW',
      },
    ]
  })
  for (let offset = 0; offset < contacts.length; offset += 200) {
    await db.insert(decisionMakers).values(contacts.slice(offset, offset + 200))
  }

  await db.insert(savedSchemes).values(insertedApps.slice(0, 14).map((app) => ({ userId: user.id, applicationId: app.id })))

  const leadRows = await db
    .insert(crmLeads)
    .values(
      crmBlueprint.map((card, index) => ({
        clientId: client.id,
        applicationId: insertedApps[index]?.id ?? insertedApps[0]!.id,
        stage: card.stage,
        openCount: card.opens,
        intentScore: card.opens * 10,
        deckDownloaded: card.opens >= 5,
        assigneeName: card.assignee,
        archived: false,
      })),
    )
    .returning()

  const conversations = await db
    .insert(inboxConversations)
    .values(
      leadRows.map((lead, index) => {
        const app = insertedApps[index]
        const scheme = app ? mapRecord(app.sourceRecord, app.sourceIndex) : undefined
        const blueprint = crmBlueprint[index]
        return {
          clientId: client.id,
          crmLeadId: lead.id,
          subject: `Re: ${scheme?.title ?? 'Scheme'}`,
          preview: (blueprint?.opens ?? 0) >= 3 ? 'Thanks, this looks relevant. Can you send…' : 'I have received your introduction regarding…',
          unread: blueprint?.unread ?? true,
          timeLabel: blueprint?.time ?? '',
        }
      }),
    )
    .returning()

  await db.insert(inboxMessages).values(
    conversations.flatMap((conversation, index) => {
      const app = insertedApps[index]
      const scheme = app ? mapRecord(app.sourceRecord, app.sourceIndex) : undefined
      const blueprint = crmBlueprint[index]
      const first = scheme?.architect.split(' ')[0] || 'there'
      const positive = (blueprint?.opens ?? 0) >= 3
      return [
        {
          conversationId: conversation.id,
          direction: 'outbound',
          senderName: 'Micraft Design Ltd',
          timeLabel: '7 days ago',
          deliveryStatus: 'delivered',
          body: `Hi ${first}, I noticed the approved scheme for ${scheme?.title ?? 'this scheme'}. We would welcome a brief conversation about early technical input before the package progresses.`,
        },
        {
          conversationId: conversation.id,
          direction: 'inbound',
          senderName: scheme?.architect || 'Contact',
          timeLabel: 'Today',
          deliveryStatus: 'delivered',
          body: positive
            ? 'Thanks for getting in touch. This is relevant to the scheme. Could you send over the capability deck and your availability for a short call next week?'
            : 'Thank you for the introduction. I have received this and will review it with the project team.',
        },
      ]
    }),
  )

  const taskLeads = leadRows.filter((lead) => lead.openCount >= 3)
  await db.insert(activities).values(
    taskLeads.map((lead, index) => ({
      clientId: client.id,
      userId: user.id,
      crmLeadId: lead.id,
      applicationId: lead.applicationId,
      type: 'task',
      title: index % 2 ? 'Priority follow-up call' : 'Review engagement and respond',
      body: 'Seeded from the approved command-centre task queue.',
      dueOn: isoDays(index < 2 ? 0 : 3),
    })),
  )

  console.log(`Seeded ${insertedApps.length} planning applications, ${leadRows.length} CRM cards, demo user ${user.email} (token ${user.apiToken})`)
  await sqlClient.end()
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isDirect) {
  main().catch(async (error) => {
    console.error(error)
    await sqlClient.end()
    process.exit(1)
  })
}

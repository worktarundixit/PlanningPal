import { and, asc, eq } from 'drizzle-orm'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { db } from '../db/client.ts'
import { crmLeads, inboxConversations, inboxMessages, planningApplications } from '../db/schema.ts'
import { parseBody, requireUser } from '../lib/http.ts'
import { mapRecord } from '@planningpal/shared'

export async function inboxRoutes(app: FastifyInstance) {
  app.get('/api/v1/inbox/conversations', async (request) => {
    const user = requireUser(request)
    const conversations = await db
      .select()
      .from(inboxConversations)
      .where(eq(inboxConversations.organisationId, user.organisationId))
      .orderBy(asc(inboxConversations.createdAt))
    const messages = conversations.length
      ? await db.select().from(inboxMessages).orderBy(asc(inboxMessages.createdAt))
      : []
    const leads = await db
      .select({ lead: crmLeads, application: planningApplications })
      .from(crmLeads)
      .innerJoin(planningApplications, eq(crmLeads.applicationId, planningApplications.id))
      .where(eq(crmLeads.organisationId, user.organisationId))
    const leadById = new Map(leads.map((row) => [row.lead.id, row]))

    const data = conversations.map((conversation) => {
      const linked = conversation.crmLeadId ? leadById.get(conversation.crmLeadId) : undefined
      const scheme = linked ? mapRecord(linked.application.sourceRecord, linked.application.sourceIndex) : undefined
      return {
        id: conversation.id,
        crmLeadId: conversation.crmLeadId,
        subject: conversation.subject,
        preview: conversation.preview,
        unread: conversation.unread,
        timeLabel: conversation.timeLabel,
        person: scheme?.architect ?? 'Contact',
        firm: scheme?.practice ?? '',
        scheme: scheme?.title ?? conversation.subject,
        schemeId: scheme?.id ?? '',
        assignee: linked?.lead.assigneeName ?? 'Unassigned',
        opens: linked?.lead.openCount ?? 0,
        archived: linked?.lead.archived ?? false,
        messages: messages
          .filter((message) => message.conversationId === conversation.id)
          .map((message) => ({
            id: message.id,
            direction: message.direction,
            senderName: message.senderName,
            body: message.body,
            deliveryStatus: message.deliveryStatus,
            timeLabel: message.timeLabel,
            createdAt: message.createdAt,
          })),
      }
    })
    return {
      data,
      unreadCount: data.filter((item) => item.unread).length,
      inboxCount: 12,
    }
  })

  app.post('/api/v1/inbox/conversations/:id/read', async (request, reply) => setUnread(request, reply, false))

  app.post('/api/v1/inbox/conversations/:id/unread', async (request, reply) => setUnread(request, reply, true))

  app.post('/api/v1/inbox/read-all', async (request) => {
    const user = requireUser(request)
    await db.update(inboxConversations).set({ unread: false, updatedAt: new Date() }).where(eq(inboxConversations.organisationId, user.organisationId))
    return { ok: true }
  })

  app.post('/api/v1/inbox/conversations/:id/reply', async (request, reply) => {
    const user = requireUser(request)
    const { id } = request.params as { id: string }
    const body = parseBody(z.object({ body: z.string().min(1) }), request.body, reply)
    if (!body) return
    const [conversation] = await db
      .select()
      .from(inboxConversations)
      .where(eq(inboxConversations.id, id))
      .limit(1)
    if (!conversation || conversation.organisationId !== user.organisationId) return reply.code(404).send({ error: 'Conversation not found' })
    const [message] = await db
      .insert(inboxMessages)
      .values({
        conversationId: id,
        direction: 'outbound',
        senderName: user.companyName,
        body: body.body,
        deliveryStatus: 'stubbed',
        timeLabel: 'Just now',
      })
      .returning()
    await db
      .update(inboxConversations)
      .set({ preview: body.body.slice(0, 80), unread: false, updatedAt: new Date() })
      .where(eq(inboxConversations.id, id))
    return reply.code(201).send({
      id: message?.id,
      direction: 'outbound',
      senderName: user.companyName,
      body: body.body,
      deliveryStatus: 'stubbed',
      timeLabel: 'Just now',
      note: 'Email sending is stubbed. The reply is stored and was not delivered.',
    })
  })
}

async function setUnread(request: FastifyRequest, reply: FastifyReply, unread: boolean) {
  const user = requireUser(request)
  const { id } = request.params as { id: string }
  const [updated] = await db
    .update(inboxConversations)
    .set({ unread, updatedAt: new Date() })
    .where(and(eq(inboxConversations.id, id), eq(inboxConversations.organisationId, user.organisationId)))
    .returning()
  if (!updated) return reply.code(404).send({ error: 'Conversation not found' })
  return { id: updated.id, unread: updated.unread }
}

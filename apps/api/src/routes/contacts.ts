import { and, desc, eq, sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/client.ts'
import { contactGroupMembers, contactGroups } from '../db/schema.ts'
import { parseBody, requireUser } from '../lib/http.ts'

const createGroupSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
})

const addMembersSchema = z.object({
  members: z
    .array(
      z.object({
        email: z.string().email(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        company: z.string().optional(),
        title: z.string().optional(),
        phone: z.string().optional(),
        council: z.string().optional(),
        schemeTitle: z.string().optional(),
        schemeRef: z.string().optional(),
      }),
    )
    .min(1),
})

let tablesEnsured = false
async function ensureContactGroupTables() {
  if (tablesEnsured) return
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS contact_groups (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id uuid NOT NULL,
        name text NOT NULL,
        description text NOT NULL DEFAULT '',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS contact_groups_org_idx ON contact_groups (organisation_id);

      CREATE TABLE IF NOT EXISTS contact_group_members (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id uuid NOT NULL REFERENCES contact_groups(id) ON DELETE CASCADE,
        organisation_id uuid NOT NULL,
        email text NOT NULL,
        first_name text NOT NULL DEFAULT '',
        last_name text NOT NULL DEFAULT '',
        company text NOT NULL DEFAULT '',
        title text NOT NULL DEFAULT '',
        phone text NOT NULL DEFAULT '',
        council text NOT NULL DEFAULT '',
        scheme_title text NOT NULL DEFAULT '',
        scheme_ref text NOT NULL DEFAULT '',
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS contact_group_members_group_idx ON contact_group_members (group_id);
      CREATE INDEX IF NOT EXISTS contact_group_members_org_idx ON contact_group_members (organisation_id);
      CREATE UNIQUE INDEX IF NOT EXISTS contact_group_members_group_email_idx ON contact_group_members (group_id, email);
    `)
    tablesEnsured = true
  } catch (err) {
    console.warn('ensureContactGroupTables warning:', err)
  }
}

export async function contactRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (request) => {
    if (request.url.includes('/contact-groups')) {
      await ensureContactGroupTables()
    }
  })

  app.get('/api/v1/contact-groups', async (request) => {
    const user = requireUser(request)
    const groups = await db
      .select({
        id: contactGroups.id,
        name: contactGroups.name,
        description: contactGroups.description,
        createdAt: contactGroups.createdAt,
        updatedAt: contactGroups.updatedAt,
        memberCount: sql<number>`cast(count(${contactGroupMembers.id}) as integer)`,
      })
      .from(contactGroups)
      .leftJoin(contactGroupMembers, eq(contactGroupMembers.groupId, contactGroups.id))
      .where(eq(contactGroups.organisationId, user.organisationId))
      .groupBy(contactGroups.id)
      .orderBy(desc(contactGroups.createdAt))

    return {
      data: groups.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        memberCount: Number(g.memberCount) || 0,
        createdAt: g.createdAt.toISOString(),
        updatedAt: g.updatedAt.toISOString(),
      })),
    }
  })

  app.post('/api/v1/contact-groups', async (request, reply) => {
    const user = requireUser(request)
    const body = parseBody(createGroupSchema, request.body, reply)
    if (!body) return

    const [created] = await db
      .insert(contactGroups)
      .values({
        organisationId: user.organisationId,
        name: body.name.trim(),
        description: body.description?.trim() ?? '',
      })
      .returning()

    if (!created) return reply.code(500).send({ error: 'Could not create contact group' })

    return reply.code(201).send({
      id: created.id,
      name: created.name,
      description: created.description,
      memberCount: 0,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    })
  })

  app.delete('/api/v1/contact-groups/:id', async (request, reply) => {
    const user = requireUser(request)
    const { id } = request.params as { id: string }

    const [deleted] = await db
      .delete(contactGroups)
      .where(and(eq(contactGroups.id, id), eq(contactGroups.organisationId, user.organisationId)))
      .returning({ id: contactGroups.id })

    if (!deleted) return reply.code(404).send({ error: 'Contact group not found' })
    return { success: true }
  })

  app.get('/api/v1/contact-groups/:id/members', async (request, reply) => {
    const user = requireUser(request)
    const { id } = request.params as { id: string }

    const [group] = await db
      .select()
      .from(contactGroups)
      .where(and(eq(contactGroups.id, id), eq(contactGroups.organisationId, user.organisationId)))
      .limit(1)

    if (!group) return reply.code(404).send({ error: 'Contact group not found' })

    const members = await db
      .select()
      .from(contactGroupMembers)
      .where(eq(contactGroupMembers.groupId, id))
      .orderBy(desc(contactGroupMembers.createdAt))

    return {
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
      },
      data: members.map((m) => ({
        id: m.id,
        email: m.email,
        firstName: m.firstName,
        lastName: m.lastName,
        company: m.company,
        title: m.title,
        phone: m.phone,
        council: m.council,
        schemeTitle: m.schemeTitle,
        schemeRef: m.schemeRef,
        createdAt: m.createdAt.toISOString(),
      })),
    }
  })

  app.post('/api/v1/contact-groups/:id/members', async (request, reply) => {
    const user = requireUser(request)
    const { id } = request.params as { id: string }
    const body = parseBody(addMembersSchema, request.body, reply)
    if (!body) return

    const [group] = await db
      .select()
      .from(contactGroups)
      .where(and(eq(contactGroups.id, id), eq(contactGroups.organisationId, user.organisationId)))
      .limit(1)

    if (!group) return reply.code(404).send({ error: 'Contact group not found' })

    const existingMembers = await db
      .select({ email: contactGroupMembers.email })
      .from(contactGroupMembers)
      .where(eq(contactGroupMembers.groupId, id))

    const existingEmails = new Set(existingMembers.map((m) => m.email.toLowerCase()))
    const toInsert = body.members
      .filter((m) => !existingEmails.has(m.email.toLowerCase()))
      .map((m) => ({
        groupId: id,
        organisationId: user.organisationId,
        email: m.email.trim().toLowerCase(),
        firstName: m.firstName?.trim() ?? '',
        lastName: m.lastName?.trim() ?? '',
        company: m.company?.trim() ?? '',
        title: m.title?.trim() ?? '',
        phone: m.phone?.trim() ?? '',
        council: m.council?.trim() ?? '',
        schemeTitle: m.schemeTitle?.trim() ?? '',
        schemeRef: m.schemeRef?.trim() ?? '',
      }))

    if (toInsert.length > 0) {
      // Deduplicate by email in the new batch as well
      const seen = new Set<string>()
      const uniqueBatch = toInsert.filter((item) => {
        if (seen.has(item.email)) return false
        seen.add(item.email)
        return true
      })
      await db.insert(contactGroupMembers).values(uniqueBatch).onConflictDoNothing()
    }

    const [totalRow] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(contactGroupMembers)
      .where(eq(contactGroupMembers.groupId, id))

    return {
      added: toInsert.length,
      total: Number(totalRow?.count) || 0,
    }
  })
}


import { and, eq, isNull } from 'drizzle-orm'
import { randomBytes } from 'node:crypto'
import { db } from '../db/client.ts'
import { invitations, teamMembers, users } from '../db/schema.ts'
import { parseOrgRole, type OrgRole } from './permissions.ts'

type CreatedAuthUser = {
  id: string
  email: string
  name: string
}

/** Attach a Supabase Auth user to an organisation membership. */
export async function provisionDomainUser(created: CreatedAuthUser) {
  const email = created.email.toLowerCase()
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.authUserId, created.id)).limit(1)
  if (existing) return existing.id

  const [invite] = await db
    .select()
    .from(invitations)
    .where(and(eq(invitations.email, email), isNull(invitations.acceptedAt)))
    .limit(1)

  if (invite && invite.expiresAt.getTime() > Date.now()) {
    const [member] = await db
      .insert(users)
      .values({
        organisationId: invite.organisationId,
        authUserId: created.id,
        email,
        name: created.name || email,
        jobTitle: '',
        orgRole: parseOrgRole(invite.role) ?? 'member',
        apiToken: randomBytes(24).toString('hex'),
        onboardingStep: 'profile',
        onboardingSkipped: ['workspace'],
        checklistDismissed: false,
        alertsEnabled: true,
        alertFrequency: 'weekly',
      })
      .returning()
    await db.update(invitations).set({ acceptedAt: new Date() }).where(eq(invitations.id, invite.id))
    await db
      .update(teamMembers)
      .set({ userId: member?.id, status: 'Active', name: created.name || email, role: invite.role })
      .where(and(eq(teamMembers.organisationId, invite.organisationId), eq(teamMembers.email, email)))
    return member?.id
  }

  const role: OrgRole = 'owner'
  const [member] = await db
    .insert(users)
    .values({
      organisationId: null,
      authUserId: created.id,
      email,
      name: created.name || email,
      jobTitle: '',
      orgRole: role,
      apiToken: randomBytes(24).toString('hex'),
      onboardingStep: 'workspace',
      onboardingSkipped: [],
      checklistDismissed: false,
      alertsEnabled: true,
      alertFrequency: 'weekly',
    })
    .returning()
  return member?.id
}

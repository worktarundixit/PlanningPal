import { hashPassword } from 'better-auth/crypto'
import { randomUUID } from 'node:crypto'
import { getAuth } from '../auth/auth.ts'
import { db } from '../db/client.ts'
import { authAccount, authUser, teamMembers, users } from '../db/schema.ts'
import type { OrgRole } from '../auth/permissions.ts'

export const TEST_PASSWORD = 'test-password-1'

export async function createActor(input: {
  email: string
  name: string
  organisationId: string | null
  orgRole: OrgRole
  platformRole?: 'super_admin' | null
  jobTitle?: string
}) {
  const now = new Date()
  const authId = randomUUID()
  await db.insert(authUser).values({
    id: authId,
    email: input.email.toLowerCase(),
    name: input.name,
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
  })
  await db.insert(authAccount).values({
    id: randomUUID(),
    accountId: authId,
    providerId: 'credential',
    userId: authId,
    password: await hashPassword(TEST_PASSWORD),
    createdAt: now,
    updatedAt: now,
  })
  const [user] = await db
    .insert(users)
    .values({
      email: input.email.toLowerCase(),
      name: input.name,
      organisationId: input.organisationId,
      authUserId: authId,
      orgRole: input.orgRole,
      platformRole: input.platformRole ?? null,
      jobTitle: input.jobTitle ?? input.orgRole,
      apiToken: randomUUID(),
    })
    .returning()
  if (!user) throw new Error(`Could not create ${input.email}`)
  if (input.organisationId) {
    await db.insert(teamMembers).values({
      organisationId: input.organisationId,
      userId: user.id,
      name: input.name,
      email: input.email.toLowerCase(),
      role: input.orgRole,
      status: 'Active',
    })
  }
  const response = await getAuth().api.signInEmail({
    body: { email: input.email, password: TEST_PASSWORD },
    asResponse: true,
    headers: new Headers({ origin: 'http://127.0.0.1:3001' }),
  })
  if (!response.ok) throw new Error(`Sign-in failed for ${input.email}: ${response.status} ${await response.text()}`)
  const cookie = response.headers.getSetCookie().map((entry) => entry.split(';')[0]).join('; ')
  if (!cookie) throw new Error(`Sign-in for ${input.email} did not set a session cookie`)
  return { user, cookie }
}

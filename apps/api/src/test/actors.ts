import { randomUUID } from 'node:crypto'
import { db } from '../db/client.ts'
import { teamMembers, users } from '../db/schema.ts'
import type { OrgRole } from '../auth/permissions.ts'

export const TEST_PASSWORD = 'test-password-1'

export async function createActor(input: {
  email: string
  name: string
  organisationId: string | null
  orgRole: OrgRole
  platformRole?: 'super_admin' | null
  jobTitle?: string
  onboardingStep?: string
  onboardingSkipped?: string[]
  checklistDismissed?: boolean
}) {
  const email = input.email.toLowerCase()
  const [user] = await db
    .insert(users)
    .values({
      email,
      name: input.name,
      organisationId: input.organisationId,
      authUserId: randomUUID(),
      orgRole: input.orgRole,
      platformRole: input.platformRole ?? null,
      jobTitle: input.jobTitle ?? input.orgRole,
      apiToken: randomUUID(),
      ...(input.onboardingStep ? { onboardingStep: input.onboardingStep } : {}),
      ...(input.onboardingSkipped ? { onboardingSkipped: input.onboardingSkipped } : {}),
      ...(input.checklistDismissed === undefined ? {} : { checklistDismissed: input.checklistDismissed }),
    })
    .returning()
  if (!user) throw new Error(`Could not create ${email}`)
  if (input.organisationId) {
    await db.insert(teamMembers).values({
      organisationId: input.organisationId,
      userId: user.id,
      name: input.name,
      email,
      role: input.orgRole,
      status: 'Active',
    })
  }
  return { user, cookie: `x-test-user=${encodeURIComponent(email)}` }
}

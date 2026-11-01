import type { OrgRole, Permission, PlatformRole } from './auth/permissions.ts'

export type AuthUser = {
  id: string
  authUserId: string
  organisationId: string
  email: string
  name: string
  jobTitle: string
  companyName: string
  twoFactorEnabled: boolean
  orgRole: OrgRole | null
  platformRole: PlatformRole | null
  permissions: Permission[]
}

declare module 'fastify' {
  interface FastifyContextConfig {
    public?: boolean
  }

  interface FastifyRequest {
    user: AuthUser | null
    rawBody?: string
    missingWorkspace?: boolean
  }
}

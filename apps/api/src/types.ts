export type AuthUser = {
  id: string
  clientId: string
  email: string
  name: string
  jobTitle: string
  companyName: string
  twoFactorEnabled: boolean
  apiToken: string
}

declare module 'fastify' {
  interface FastifyContextConfig {
    public?: boolean
  }

  interface FastifyRequest {
    user: AuthUser | null
    rawBody?: string
  }
}

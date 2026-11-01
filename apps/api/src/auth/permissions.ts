export const ORG_ROLES = ['owner', 'admin', 'member', 'viewer'] as const
export type OrgRole = (typeof ORG_ROLES)[number]
export type PlatformRole = 'super_admin'

export const PERMISSIONS = [
  'leads.read',
  'leads.export',
  'saved.read',
  'saved.write',
  'crm.read',
  'crm.write',
  'inbox.read',
  'inbox.write',
  'campaigns.read',
  'campaigns.write',
  'settings.read',
  'settings.write',
  'reports.read',
  'billing.manage',
  'team.read',
  'team.manage',
  'profile.read',
  'profile.write',
  'ingest.admin',
] as const

export type Permission = (typeof PERMISSIONS)[number]

const readAccess: Permission[] = [
  'leads.read',
  'saved.read',
  'crm.read',
  'inbox.read',
  'campaigns.read',
  'settings.read',
  'reports.read',
  'team.read',
  'profile.read',
  'profile.write',
]

export const ROLE_PERMISSIONS: Record<OrgRole, Permission[]> = {
  viewer: readAccess,
  member: [...readAccess, 'leads.export', 'saved.write', 'crm.write', 'inbox.write'],
  admin: [
    ...readAccess,
    'leads.export',
    'saved.write',
    'crm.write',
    'inbox.write',
    'campaigns.write',
    'settings.write',
    'team.manage',
  ],
  owner: [
    ...readAccess,
    'leads.export',
    'saved.write',
    'crm.write',
    'inbox.write',
    'campaigns.write',
    'settings.write',
    'team.manage',
    'billing.manage',
  ],
}

export function permissionsFor(orgRole: string | null | undefined, platformRole: string | null | undefined): Permission[] {
  if (platformRole === 'super_admin') return [...PERMISSIONS]
  if (orgRole && orgRole in ROLE_PERMISSIONS) return ROLE_PERMISSIONS[orgRole as OrgRole]
  return []
}

export function parseOrgRole(value: string): OrgRole | null {
  const key = value.trim().toLowerCase()
  return (ORG_ROLES as readonly string[]).includes(key) ? (key as OrgRole) : null
}

export function roleLabel(role: string): string {
  const parsed = parseOrgRole(role)
  if (!parsed) return role
  return parsed.charAt(0).toUpperCase() + parsed.slice(1)
}

type RouteRule = {
  method: string
  pattern: RegExp
  permission: Permission | 'public'
}

/**
 * First match wins. Every /api/v1 route is listed so a new handler cannot
 * ship without a permission. Unmatched /api/v1 routes are denied.
 */
const ROUTE_RULES: RouteRule[] = [
  { method: 'GET', pattern: /^\/api\/v1\/health$/, permission: 'public' },
  { method: 'GET', pattern: /^\/api\/v1\/auth\/providers$/, permission: 'public' },
  { method: 'POST', pattern: /^\/api\/v1\/demo-requests$/, permission: 'public' },
  { method: 'POST', pattern: /^\/api\/v1\/telemetry\/event$/, permission: 'public' },
  { method: 'GET', pattern: /^\/api\/v1\/team\/invites\/[^/]+$/, permission: 'public' },

  { method: 'GET', pattern: /^\/api\/v1\/planning\/leads$/, permission: 'leads.read' },
  { method: 'GET', pattern: /^\/api\/v1\/planning\/leads\/[^/]+$/, permission: 'leads.read' },
  { method: 'POST', pattern: /^\/api\/v1\/planning\/leads\/export$/, permission: 'leads.export' },
  { method: 'GET', pattern: /^\/api\/v1\/saved-schemes$/, permission: 'saved.read' },
  { method: 'POST', pattern: /^\/api\/v1\/saved-schemes$/, permission: 'saved.write' },
  { method: 'POST', pattern: /^\/api\/v1\/saved-schemes\/bulk$/, permission: 'saved.write' },
  { method: 'DELETE', pattern: /^\/api\/v1\/saved-schemes\/[^/]+$/, permission: 'saved.write' },

  { method: 'GET', pattern: /^\/api\/v1\/crm\/kanban$/, permission: 'crm.read' },
  { method: 'GET', pattern: /^\/api\/v1\/crm\/activities$/, permission: 'crm.read' },
  { method: 'POST', pattern: /^\/api\/v1\/crm\/activities$/, permission: 'crm.write' },
  { method: 'PATCH', pattern: /^\/api\/v1\/crm\/activities\/[^/]+$/, permission: 'crm.write' },
  { method: 'PATCH', pattern: /^\/api\/v1\/crm\/leads\/[^/]+\/stage$/, permission: 'crm.write' },
  { method: 'POST', pattern: /^\/api\/v1\/crm\/leads\/[^/]+\/archive$/, permission: 'crm.write' },

  { method: 'GET', pattern: /^\/api\/v1\/inbox\/conversations$/, permission: 'inbox.read' },
  { method: 'POST', pattern: /^\/api\/v1\/inbox\/conversations\/[^/]+\/read$/, permission: 'inbox.write' },
  { method: 'POST', pattern: /^\/api\/v1\/inbox\/conversations\/[^/]+\/unread$/, permission: 'inbox.write' },
  { method: 'POST', pattern: /^\/api\/v1\/inbox\/read-all$/, permission: 'inbox.write' },
  { method: 'POST', pattern: /^\/api\/v1\/inbox\/conversations\/[^/]+\/reply$/, permission: 'inbox.write' },

  { method: 'GET', pattern: /^\/api\/v1\/campaigns$/, permission: 'campaigns.read' },
  { method: 'POST', pattern: /^\/api\/v1\/campaigns$/, permission: 'campaigns.write' },
  { method: 'PATCH', pattern: /^\/api\/v1\/campaigns\/[^/]+$/, permission: 'campaigns.write' },
  { method: 'POST', pattern: /^\/api\/v1\/campaigns\/[^/]+\/pause$/, permission: 'campaigns.write' },
  { method: 'POST', pattern: /^\/api\/v1\/campaigns\/[^/]+\/resume$/, permission: 'campaigns.write' },
  { method: 'GET', pattern: /^\/api\/v1\/campaign-settings$/, permission: 'campaigns.read' },
  { method: 'PATCH', pattern: /^\/api\/v1\/campaign-settings$/, permission: 'campaigns.write' },
  { method: 'GET', pattern: /^\/api\/v1\/sending-domains$/, permission: 'campaigns.read' },
  { method: 'POST', pattern: /^\/api\/v1\/sending-domains$/, permission: 'campaigns.write' },
  { method: 'DELETE', pattern: /^\/api\/v1\/sending-domains\/[^/]+$/, permission: 'campaigns.write' },

  { method: 'GET', pattern: /^\/api\/v1\/me$/, permission: 'profile.read' },
  { method: 'PATCH', pattern: /^\/api\/v1\/me$/, permission: 'profile.write' },
  { method: 'GET', pattern: /^\/api\/v1\/overview$/, permission: 'reports.read' },
  { method: 'GET', pattern: /^\/api\/v1\/reports$/, permission: 'reports.read' },
  { method: 'GET', pattern: /^\/api\/v1\/delivery$/, permission: 'reports.read' },
  { method: 'GET', pattern: /^\/api\/v1\/billing$/, permission: 'billing.manage' },
  { method: 'GET', pattern: /^\/api\/v1\/workspace$/, permission: 'settings.read' },
  { method: 'PATCH', pattern: /^\/api\/v1\/workspace$/, permission: 'settings.write' },
  { method: 'GET', pattern: /^\/api\/v1\/team$/, permission: 'team.read' },
  { method: 'POST', pattern: /^\/api\/v1\/team\/invites$/, permission: 'team.manage' },
  { method: 'POST', pattern: /^\/api\/v1\/team\/invites\/accept$/, permission: 'profile.write' },
  { method: 'PATCH', pattern: /^\/api\/v1\/team\/[^/]+$/, permission: 'team.manage' },
  { method: 'DELETE', pattern: /^\/api\/v1\/team\/[^/]+$/, permission: 'team.manage' },
  { method: 'POST', pattern: /^\/api\/v1\/roles$/, permission: 'team.manage' },
  { method: 'GET', pattern: /^\/api\/v1\/persona$/, permission: 'settings.read' },
  { method: 'PUT', pattern: /^\/api\/v1\/persona$/, permission: 'settings.write' },

  { method: 'GET', pattern: /^\/api\/v1\/ingest\/runs$/, permission: 'ingest.admin' },
  { method: 'GET', pattern: /^\/api\/v1\/ingest\/runs\/[^/]+\/csv$/, permission: 'ingest.admin' },
  { method: 'POST', pattern: /^\/api\/v1\/ingest\/runs$/, permission: 'ingest.admin' },
]

export function permissionFor(method: string, url: string): Permission | 'public' | 'deny' {
  const path = url.split('?')[0] || url
  if (path.startsWith('/api/auth')) return 'public'
  const rule = ROUTE_RULES.find((entry) => entry.method === method && entry.pattern.test(path))
  return rule?.permission ?? 'deny'
}

import { LPA_REGIONS, feedHealth, type LpaRecord } from '@planningpal/shared'
import { asc } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { db } from '../db/client.ts'
import { localPlanningAuthorities } from '../db/schema.ts'
import { requireUser } from '../lib/http.ts'

function asRecord(row: typeof localPlanningAuthorities.$inferSelect): LpaRecord {
  const coverage = row.coverage === 'shared' || row.coverage === 'legacy' || row.coverage === 'unavailable' ? row.coverage : 'available'
  return {
    name: row.name,
    nation: row.nation,
    region: row.region,
    county: row.county,
    type: row.type,
    gssCode: row.gssCode,
    lpaGssCode: row.lpaGssCode,
    planitAreaName: row.planitAreaName,
    planitAreaId: row.planitAreaId,
    planitCovered: row.planitCovered,
    planitScraperType: row.planitScraperType,
    planitLatestAppDate: row.planitLatestAppDate,
    planitTotalApps: row.planitTotalApps,
    planningPortalUrl: row.planningPortalUrl,
    website: row.website,
    status: row.status === 'abolished' ? 'abolished' : 'active',
    endDate: row.endDate,
    successor: row.successor,
    notes: row.notes,
    coverage,
    planitQueryAreas: row.planitQueryAreas,
  }
}

export async function lpaRoutes(app: FastifyInstance) {
  app.get('/api/v1/lpas/health', async (request) => {
    requireUser(request)
    const rows = await db.select().from(localPlanningAuthorities)
    const staleDays = Number(process.env.FEED_STALE_DAYS || 92)
    return feedHealth(rows.map(asRecord), { staleDays: Number.isFinite(staleDays) ? staleDays : 90 })
  })

  app.get('/api/v1/lpas', async (request) => {
    requireUser(request)
    const rows = await db.select().from(localPlanningAuthorities).orderBy(asc(localPlanningAuthorities.name))
    const grouped = new Map<string, { name: string; gssCode: string; coverage: string }[]>()
    for (const row of rows) {
      if (row.status !== 'active') continue
      const councils = grouped.get(row.region) ?? []
      councils.push({
        name: row.name,
        gssCode: row.gssCode,
        coverage: row.coverage === 'unavailable' ? 'coverage unavailable' : row.coverage,
      })
      grouped.set(row.region, councils)
    }
    const order = new Map<string, number>(LPA_REGIONS.map((region, index) => [region, index]))
    const regions = [...grouped.entries()].sort((a, b) => (order.get(a[0]) ?? 99) - (order.get(b[0]) ?? 99))
    return { regions: regions.map(([region, councils]) => ({ region, councils })) }
  })
}

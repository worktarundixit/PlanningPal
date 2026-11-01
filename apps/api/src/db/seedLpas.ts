import { LPA_RECORDS } from '@planningpal/shared'
import { db } from './client.ts'
import { localPlanningAuthorities } from './schema.ts'

/** Upsert the UK LPA master list. Safe to run on every migrate. */
export async function seedLpas() {
  const rows = LPA_RECORDS.map((row) => ({
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
    status: row.status,
    endDate: row.endDate,
    successor: row.successor,
    notes: row.notes,
    coverage: row.coverage,
    planitQueryAreas: row.planitQueryAreas,
  }))
  await db.delete(localPlanningAuthorities)
  const size = 80
  for (let index = 0; index < rows.length; index += size) {
    await db.insert(localPlanningAuthorities).values(rows.slice(index, index + size))
  }
}

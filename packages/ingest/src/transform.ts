import { toCsv, type SourceRecord } from '@planningpal/shared'
import { rejectionReason } from './filter.ts'
import { mapPlanItRecord } from './map.ts'
import type { FilterConfig, PlanItRecord } from './types.ts'

export type TransformResult = {
  rows: SourceRecord[]
  fetched: number
  filteredOut: number
  errors: number
  cursor: string
}

export function transformRecords(records: PlanItRecord[], config?: FilterConfig, since?: string): TransformResult {
  const kept = new Map<string, SourceRecord>()
  let filteredOut = 0
  let errors = 0
  let cursor = since ?? ''
  for (const record of records) {
    const stamp = record.last_different ?? ''
    if (since && stamp && stamp <= since) {
      filteredOut += 1
      continue
    }
    if (stamp > cursor) cursor = stamp
    try {
      if (rejectionReason(record, config)) {
        filteredOut += 1
        continue
      }
      const cleaned = mapPlanItRecord(record)
      if (!cleaned) {
        errors += 1
        continue
      }
      kept.set(`${cleaned.columns['Local Authority']}|${cleaned.reference}`, cleaned.columns)
    } catch {
      errors += 1
    }
  }
  return { rows: [...kept.values()], fetched: records.length, filteredOut, errors, cursor }
}

export function recordsToCsv(rows: SourceRecord[]) {
  return toCsv(rows.map((row) => {
    const full: SourceRecord = {}
    for (const key of Object.keys(row)) full[key] = row[key] ?? ''
    return full
  }))
}

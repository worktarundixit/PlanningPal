import { describe, expect, it } from 'vitest'
import { isIngestSlot } from './scheduler.ts'

describe('ingest clock', () => {
  it('matches 06:00, 13:00 and 20:00 Europe/London in GMT and BST', () => {
    expect(isIngestSlot(new Date('2026-01-15T06:05:00Z'))).toBe(true)
    expect(isIngestSlot(new Date('2026-01-15T13:00:00Z'))).toBe(true)
    expect(isIngestSlot(new Date('2026-01-15T20:09:00Z'))).toBe(true)
    expect(isIngestSlot(new Date('2026-01-15T05:05:00Z'))).toBe(false)
    expect(isIngestSlot(new Date('2026-07-15T05:05:00Z'))).toBe(true)
    expect(isIngestSlot(new Date('2026-07-15T12:00:00Z'))).toBe(true)
    expect(isIngestSlot(new Date('2026-07-15T19:02:00Z'))).toBe(true)
    expect(isIngestSlot(new Date('2026-07-15T06:05:00Z'))).toBe(false)
  })
})

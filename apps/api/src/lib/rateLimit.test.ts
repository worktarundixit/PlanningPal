import { describe, expect, it } from 'vitest'
import { allowRequest, resetRateLimits } from './rateLimit.ts'
import { csvCell } from '@planningpal/shared'

describe('public rate limit', () => {
  it('blocks the request after the window is full', () => {
    resetRateLimits()
    expect(allowRequest('ip:/api/v1/demo-requests', 2, 60_000, 1_000)).toBe(true)
    expect(allowRequest('ip:/api/v1/demo-requests', 2, 60_000, 1_100)).toBe(true)
    expect(allowRequest('ip:/api/v1/demo-requests', 2, 60_000, 1_200)).toBe(false)
  })
})

describe('csv export cells', () => {
  it('prefixes formula characters so a spreadsheet does not execute them', () => {
    expect(csvCell('=cmd|')).toBe(`"'=cmd|"`)
    expect(csvCell('+1')).toBe(`"'+1"`)
    expect(csvCell('@sum')).toBe(`"'@sum"`)
    expect(csvCell('Guildford')).toBe('"Guildford"')
  })
})

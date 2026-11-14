import { describe, expect, it } from 'vitest'
import { trustedOrigin } from '../app.ts'
import { appOrigin } from '../auth/mailer.ts'
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

describe('trustedOrigin and appOrigin', () => {
  it('allows production planningpal.io and existing origins and comma-separated WEB_ORIGIN', () => {
    const previousWebOrigin = process.env.WEB_ORIGIN
    const previousNodeEnv = process.env.NODE_ENV
    try {
      process.env.WEB_ORIGIN = 'https://planningpal.io, https://app.planningpal.io/, https://preview-test.vercel.app'
      expect(trustedOrigin('https://planningpal.io')).toBe('https://planningpal.io')
      expect(trustedOrigin('https://www.planningpal.io/')).toBe('https://www.planningpal.io')
      expect(trustedOrigin('https://app.planningpal.io')).toBe('https://app.planningpal.io')
      expect(trustedOrigin('https://planningpal.vercel.app')).toBe('https://planningpal.vercel.app')
      expect(trustedOrigin('https://planningpal.co.uk')).toBe('https://planningpal.co.uk')
      expect(trustedOrigin('https://www.planningpal.co.uk')).toBe('https://www.planningpal.co.uk')
      expect(trustedOrigin('https://preview-test.vercel.app/')).toBe('https://preview-test.vercel.app')
      expect(trustedOrigin('https://evil.example.com')).toBeNull()
      expect(appOrigin()).toBe('https://app.planningpal.io')

      delete process.env.WEB_ORIGIN
      process.env.NODE_ENV = 'production'
      expect(appOrigin()).toBe('https://app.planningpal.io')
    } finally {
      if (previousWebOrigin === undefined) delete process.env.WEB_ORIGIN
      else process.env.WEB_ORIGIN = previousWebOrigin
      if (previousNodeEnv === undefined) delete process.env.NODE_ENV
      else process.env.NODE_ENV = previousNodeEnv
    }
  })
})

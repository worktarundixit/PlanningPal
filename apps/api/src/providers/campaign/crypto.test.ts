import { describe, expect, it } from 'vitest'
import { maskSecret, openSecret, sealSecret } from './crypto.ts'

describe('campaign key encryption', () => {
  it('round-trips a key and only shows a mask', () => {
    const secret = 'test-campaign-key-secret'
    const apiKey = 'agency-key-value-9876'
    const sealed = sealSecret(apiKey, secret)
    expect(sealed).not.toContain(apiKey)
    expect(openSecret(sealed, secret)).toBe(apiKey)
    expect(maskSecret(apiKey)).toBe('••••9876')
  })
})

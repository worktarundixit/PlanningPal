import { describe, expect, it } from 'vitest'
import { reserveSlot } from './limiter.ts'

describe('campaign engine rate limit', () => {
  it('waits once a workspace has used its requests for the second', () => {
    const slot = reserveSlot({ secondWindow: 1_000, secondCount: 100, minuteWindow: 1_000, minuteCount: 10 }, 1_400)
    expect(slot.waitMs).toBe(600)
  })

  it('allows a request inside both limits', () => {
    const slot = reserveSlot({ secondWindow: 1_000, secondCount: 2, minuteWindow: 1_000, minuteCount: 2 }, 1_100)
    expect(slot.waitMs).toBe(0)
    expect(slot.bucket.secondCount).toBe(3)
  })
})

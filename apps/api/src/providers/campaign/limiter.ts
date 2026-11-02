export type RateBucket = {
  secondWindow: number
  secondCount: number
  minuteWindow: number
  minuteCount: number
}

export const SECOND_LIMIT = 100
export const MINUTE_LIMIT = 6000

/** How long to wait before another request is allowed for this workspace. */
export function reserveSlot(bucket: RateBucket, now: number): { bucket: RateBucket; waitMs: number } {
  const next = { ...bucket }
  if (now - next.secondWindow >= 1000) {
    next.secondWindow = now
    next.secondCount = 0
  }
  if (now - next.minuteWindow >= 60_000) {
    next.minuteWindow = now
    next.minuteCount = 0
  }
  if (next.secondCount >= SECOND_LIMIT) {
    return { bucket: next, waitMs: Math.max(1, 1000 - (now - next.secondWindow)) }
  }
  if (next.minuteCount >= MINUTE_LIMIT) {
    return { bucket: next, waitMs: Math.max(1, 60_000 - (now - next.minuteWindow)) }
  }
  next.secondCount += 1
  next.minuteCount += 1
  return { bucket: next, waitMs: 0 }
}

const buckets = new Map<string, RateBucket>()

export async function pace(workspaceKey: string, sleep: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms))) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const current = buckets.get(workspaceKey) ?? { secondWindow: 0, secondCount: 0, minuteWindow: 0, minuteCount: 0 }
    const slot = reserveSlot(current, Date.now())
    buckets.set(workspaceKey, slot.bucket)
    if (slot.waitMs === 0) return
    await sleep(slot.waitMs)
  }
}

export function resetRateBuckets() {
  buckets.clear()
}

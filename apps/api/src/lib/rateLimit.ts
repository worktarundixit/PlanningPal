type Bucket = { count: number; reset: number }

const buckets = new Map<string, Bucket>()

/** Fixed window. Returns false when the caller should receive 429. */
export function allowRequest(key: string, limit: number, windowMs: number, now = Date.now()) {
  const current = buckets.get(key)
  if (!current || now >= current.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs })
    return true
  }
  current.count += 1
  return current.count <= limit
}

export function resetRateLimits() {
  buckets.clear()
}

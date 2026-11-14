import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./batch.ts', () => ({
  ingestAuthorityBatch: vi.fn(),
}))

import handler, { statusForIngestResult } from '../../../web/server/cron-ingest.ts'
import { ingestAuthorityBatch } from './batch.ts'

const base = {
  partial: false,
  processed: [] as string[],
  failed: [] as { authority: string; error: string }[],
  nextIndex: 0,
  total: 3,
  requestsToday: 0,
  backfill: null,
}

function response() {
  const state = { statusCode: 0, body: undefined as unknown }
  return {
    state,
    status(code: number) {
      state.statusCode = code
      return this
    },
    json(body: unknown) {
      state.body = body
    },
  }
}

describe('cron ingest handler', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = 'cron-test-secret'
    vi.mocked(ingestAuthorityBatch).mockReset()
  })

  it('returns 200 for a successful batch and for a skip', async () => {
    expect(statusForIngestResult({ ok: true, skipped: false })).toBe(200)
    expect(statusForIngestResult({ ok: true, skipped: 'daily cap' })).toBe(200)
    expect(statusForIngestResult({ ok: true, skipped: 'up to date' })).toBe(200)
    vi.mocked(ingestAuthorityBatch).mockResolvedValueOnce({ ...base, ok: true, skipped: false })
    const ok = response()
    await handler({ headers: { authorization: 'Bearer cron-test-secret' } }, ok)
    expect(ok.state.statusCode).toBe(200)

    vi.mocked(ingestAuthorityBatch).mockResolvedValueOnce({ ...base, ok: true, skipped: 'up to date' })
    const skipped = response()
    await handler({ headers: { authorization: 'Bearer cron-test-secret' } }, skipped)
    expect(skipped.state.statusCode).toBe(200)
    expect(skipped.state.body).toMatchObject({ skipped: 'up to date' })
  })

  it('returns 207 when the sweep recorded a retry and moved on', async () => {
    expect(statusForIngestResult({ ok: false, skipped: false, partial: true })).toBe(207)
    vi.mocked(ingestAuthorityBatch).mockResolvedValueOnce({
      ...base,
      ok: false,
      skipped: false,
      partial: true,
      failed: [{ authority: 'Camden', error: 'PlanIt responded 429' }],
    })
    const partial = response()
    await handler({ headers: { authorization: 'Bearer cron-test-secret' } }, partial)
    expect(partial.state.statusCode).toBe(207)
  })

  it('returns 500 when the batch throws', async () => {
    expect(statusForIngestResult({ ok: false, skipped: false, partial: false })).toBe(500)
    vi.mocked(ingestAuthorityBatch).mockRejectedValueOnce(new Error('database unavailable'))
    const failed = response()
    await handler({ headers: { authorization: 'Bearer cron-test-secret' } }, failed)
    expect(failed.state.statusCode).toBe(500)
    expect(failed.state.body).toMatchObject({ ok: false, failed: [{ error: 'database unavailable' }] })
  })
})

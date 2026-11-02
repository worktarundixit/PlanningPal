import { beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('./run.ts', () => ({
  startIngestRun: vi.fn(),
}))

import { runMigrations } from '../db/migrate.ts'
import { ingestAuthorityBatch } from './batch.ts'
import { startIngestRun } from './run.ts'

describe('authority batch', () => {
  beforeAll(async () => {
    await runMigrations()
  })

  it('records a PlanIt failure and does not crash the sweep', async () => {
    vi.mocked(startIngestRun).mockImplementation(async () => {
      const done = Promise.reject(new Error('PlanIt responded 429'))
      done.catch(() => undefined)
      return { id: 'run', status: 'running', done }
    })
    const result = await ingestAuthorityBatch({ force: true, budgetMs: 5_000 })
    expect(result.ok).toBe(false)
    expect(result.failed).toEqual([{ authority: expect.any(String), error: 'PlanIt responded 429' }])
    expect(result.processed).toEqual([])
  })
})

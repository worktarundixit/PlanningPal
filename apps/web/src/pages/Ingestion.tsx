import { useEffect, useState } from 'react'
import { EmptyState, LoadingBlock } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { PageIntro } from '../components/PageIntro'
import { UploadPlanningDataModal } from '../components/UploadPlanningDataModal'
import { api, type IngestRun, type LpaHealth } from '../lib/api'
import { notify } from '../lib/notify'

type IngestSourceOption = 'auto' | 'planit' | 'london-datahub'

export function Ingestion() {
  const [runs, setRuns] = useState<IngestRun[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [busy, setBusy] = useState(false)
  const [enrichBusy, setEnrichBusy] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [runFilter, setRunFilter] = useState<'all' | 'scrapers' | 'uploads'>('all')
  const [authority, setAuthority] = useState('')
  const [source, setSource] = useState<IngestSourceOption>('auto')
  const [recentDays, setRecentDays] = useState(3)
  const [health, setHealth] = useState<LpaHealth | null>(null)
  const [healthError, setHealthError] = useState(false)

  const load = () => api.ingestRuns().then((result) => { setRuns(result.data); setStatus('ready') }).catch(() => setStatus('error'))

  useEffect(() => {
    void load()
    void api.lpaHealth().then(setHealth).catch(() => setHealthError(true))
    const timer = window.setInterval(() => { void load() }, 3000)
    return () => window.clearInterval(timer)
  }, [])

  const run = () => {
    setBusy(true)
    const maxPages = authority.trim() ? 4 : 8
    void api.startIngest({
      source,
      recent: recentDays,
      maxPages,
      ...(authority.trim() ? { authority: authority.trim() } : {}),
    })
      .then(() => notify(`Ingestion started (${source === 'auto' ? 'Auto hybrid' : source})`))
      .catch((error: unknown) => notify(error instanceof Error ? error.message : 'Could not start a run'))
      .finally(() => { setBusy(false); void load() })
  }

  const runEnrich = () => {
    setEnrichBusy(true)
    void api.enrichContacts(25)
      .then((res) => notify(`Idox enrichment complete: ${res.enriched}/${res.scanned} schemes updated`))
      .catch((error: unknown) => notify(error instanceof Error ? error.message : 'Could not enrich contacts'))
      .finally(() => { setEnrichBusy(false) })
  }

  return (
    <>
      <PageIntro
        eyebrow="Planning data"
        title="Ingestion & Enrichment"
        description="PlanIt imports continuously: one saved page a minute, then contact enrichment only when time remains. A 15-day backfill runs once, then the feed stays inside a 300 request daily cap."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setUploadModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-3.5 py-2.5 text-[10px] font-semibold text-white shadow-xs hover:bg-[#1D4ED8]"
            >
              <Icon name="plus" size={12} /> Upload CSV Data
            </button>
            <button
              disabled={enrichBusy}
              onClick={runEnrich}
              className="rounded-lg border border-[#DCE4F0] bg-white px-3.5 py-2.5 text-[10px] font-semibold text-[#172554] hover:bg-[#F8FAFD] disabled:opacity-50"
            >
              {enrichBusy ? 'Enriching Idox…' : 'Enrich Idox Contacts'}
            </button>
            <button
              disabled={busy}
              onClick={run}
              className="rounded-lg bg-[#172554] px-4 py-2.5 text-[10px] font-semibold text-white disabled:opacity-50"
            >
              {busy ? 'Starting…' : 'Run Ingestion Now'}
            </button>
          </div>
        }
      />
      <section className="mb-5 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[#DCE4F0] bg-white p-4">
          <div className="text-[9px] font-bold uppercase tracking-wider text-[#2563EB]">Rate-limit guard</div>
          <div className="mt-1 font-display text-[18px] font-semibold text-[#172033]">60s + Retry-After</div>
          <div className="mt-0.5 text-[11px] text-[#64748B]">Strict PlanIt pacing & compression</div>
        </div>
        <div className="rounded-xl border border-[#DCE4F0] bg-white p-4">
          <div className="text-[9px] font-bold uppercase tracking-wider text-[#15803D]">Daily cap</div>
          <div className="mt-1 font-display text-[18px] font-semibold text-[#172033]">≤ 300 req / day</div>
          <div className="mt-0.5 text-[11px] text-[#64748B]">Europe/London, one request a minute</div>
        </div>
        <div className="rounded-xl border border-[#DCE4F0] bg-white p-4">
          <div className="text-[9px] font-bold uppercase tracking-wider text-[#2563EB]">Daytime fallback</div>
          <div className="mt-1 font-display text-[18px] font-semibold text-[#172033]">GLA Datahub Live</div>
          <div className="mt-0.5 text-[11px] text-[#64748B]">Zero rate limit when PlanIt throttles</div>
        </div>
        <div className="rounded-xl border border-[#DCE4F0] bg-white p-4">
          <div className="text-[9px] font-bold uppercase tracking-wider text-[#172554]">Contact enrichment</div>
          <div className="mt-1 font-display text-[18px] font-semibold text-[#172033]">Direct Idox + GH Actions</div>
          <div className="mt-0.5 text-[11px] text-[#64748B]">Resolves "See source" architects & clients</div>
        </div>
      </section>
      <section className="mb-5 rounded-xl border border-[#DCE4F0] bg-white p-5">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2563EB]">Feed health</div>
        <h3 className="mt-1 font-display text-[16px] font-semibold">PlanIt authority coverage</h3>
        {healthError && <EmptyState kind="error" title="Feed health could not be loaded." action={{ label: 'Try again', onClick: () => { setHealthError(false); void api.lpaHealth().then(setHealth).catch(() => setHealthError(true)) } }} />}
        {!health && !healthError && <div className="mt-3"><LoadingBlock label="Loading feed health" /></div>}
        {health && (
          <>
            <p className="mt-2 text-[12px] leading-relaxed text-[#52627A]">{health.active} active authorities. {health.planitCovered} are on PlanIt. A feed is stale when its latest application is older than {health.staleDays} days.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-[#F8FAFD] p-3"><div className="font-display text-[22px] font-semibold">{health.stale.length}</div><div className="text-[11px] text-[#64748B]">Stale feeds</div></div>
              <div className="rounded-lg bg-[#F8FAFD] p-3"><div className="font-display text-[22px] font-semibold">{health.unavailable.length}</div><div className="text-[11px] text-[#64748B]">Coverage unavailable</div></div>
              <div className="rounded-lg bg-[#F8FAFD] p-3"><div className="font-display text-[22px] font-semibold">{health.abolished}</div><div className="text-[11px] text-[#64748B]">Abolished, with a successor</div></div>
            </div>
            <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto">
              {health.unavailable.map((row) => <li key={row.gssCode} className="flex items-center justify-between gap-3 text-[12px]"><span>{row.name}</span><span className="shrink-0 rounded-full bg-[#F1F5F9] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#64748B]">coverage unavailable</span></li>)}
              {health.stale.map((row) => <li key={row.gssCode} className="flex items-center justify-between gap-3 text-[12px]"><span>{row.name}</span><span className="shrink-0 text-[11px] font-semibold text-[#92400E]">Latest {row.latest}</span></li>)}
            </ul>
          </>
        )}
      </section>
      <form className="mb-5 flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); run() }}>
        <label className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">Data source
          <select
            value={source}
            onChange={(event) => setSource(event.target.value as IngestSourceOption)}
            className="mt-2 block w-64 rounded-lg border border-[#DCE4F0] bg-white px-3 py-2.5 text-[11px] font-normal normal-case tracking-normal outline-none"
          >
            <option value="auto">Auto (PlanIt + GLA Datahub fallback)</option>
            <option value="london-datahub">GLA London Datahub (Instant / No 429)</option>
            <option value="planit">PlanIt only (Polite 60s pacing)</option>
          </select>
        </label>
        <label className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">Time window
          <select
            value={recentDays}
            onChange={(event) => setRecentDays(Number(event.target.value))}
            className="mt-2 block w-40 rounded-lg border border-[#DCE4F0] bg-white px-3 py-2.5 text-[11px] font-normal normal-case tracking-normal outline-none"
          >
            <option value={1}>Last 24 hours</option>
            <option value={3}>Last 3 days</option>
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
        </label>
        <label className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">Authority, optional
          <input value={authority} onChange={(event) => setAuthority(event.target.value)} placeholder="Camden" className="mt-2 block w-56 rounded-lg border border-[#DCE4F0] px-3 py-2.5 text-[11px] font-normal normal-case tracking-normal outline-none" />
        </label>
      </form>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex rounded-lg border border-[#DCE4F0] bg-white p-0.5 text-[9px] font-semibold">
          <button
            type="button"
            onClick={() => setRunFilter('all')}
            className={`rounded px-3 py-1.5 transition ${runFilter === 'all' ? 'bg-[#172554] text-white' : 'text-[#64748B]'}`}
          >
            All Runs ({runs.length})
          </button>
          <button
            type="button"
            onClick={() => setRunFilter('scrapers')}
            className={`rounded px-3 py-1.5 transition ${runFilter === 'scrapers' ? 'bg-[#172554] text-white' : 'text-[#64748B]'}`}
          >
            Automated Feeds ({runs.filter((r) => r.source !== 'manual_upload').length})
          </button>
          <button
            type="button"
            onClick={() => setRunFilter('uploads')}
            className={`rounded px-3 py-1.5 transition ${runFilter === 'uploads' ? 'bg-[#172554] text-white' : 'text-[#64748B]'}`}
          >
            Manual Uploads ({runs.filter((r) => r.source === 'manual_upload').length})
          </button>
        </div>
        <span className="text-[9px] text-[#94A3B8]">Separate inner datasets & batch logs</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#DCE4F0] bg-white">
        <div className="grid grid-cols-[140px_110px_80px_repeat(5,minmax(65px,.6fr))_120px] bg-[#F8FAFD] px-4 py-3 text-[8px] font-bold uppercase tracking-wider text-[#94A3B8]">
          <span>Started</span><span>Source / Batch</span><span>Status</span><span>Fetched</span><span>Filtered</span><span>New</span><span>Updated</span><span>Errors</span><span></span>
        </div>
        {status === 'loading' && <div className="p-4"><LoadingBlock label="Loading ingestion runs" /></div>}
        {status === 'error' && <div className="p-4"><EmptyState kind="error" title="Ingestion runs could not be loaded." action={{ label: 'Try again', onClick: () => void load() }} /></div>}
        {status === 'ready' && runs.length === 0 && <div className="p-4"><EmptyState icon="download" title="No ingestion runs yet." action={{ label: 'Run Ingestion Now', onClick: run }} /></div>}
        {runs
          .filter((r) => {
            if (runFilter === 'uploads' && r.source !== 'manual_upload') return false
            if (runFilter === 'scrapers' && r.source === 'manual_upload') return false
            if (source !== 'auto' && r.source !== source) return false
            if (authority.trim()) {
              const q = authority.trim().toLowerCase()
              const optAuth = (String(r.options?.authority || '')).toLowerCase()
              const msg = (r.message || '').toLowerCase()
              const src = (r.source || '').toLowerCase()
              if (!optAuth.includes(q) && !msg.includes(q) && !src.includes(q)) return false
            }
            return true
          })
          .map((run) => {
            const batchName = ((run.options as Record<string, string> | undefined)?.authority) || (run.source === 'manual_upload' ? 'Manual Upload' : run.source)
            return (
              <div key={run.id} className="grid grid-cols-[140px_110px_80px_repeat(5,minmax(65px,.6fr))_120px] items-center border-t border-[#EEF2F7] px-4 py-4 text-[10px]">
                <span className="text-[#64748B]">{new Date(run.startedAt).toLocaleString('en-GB', { hour12: false })}</span>
                <span className="font-medium text-[#52627A] truncate" title={batchName}>
                  {run.source === 'manual_upload' ? (
                    <span className="inline-flex items-center gap-1 text-[#2563EB] font-semibold">
                      <Icon name="folder" size={10} /> {batchName}
                    </span>
                  ) : (
                    run.source
                  )}
                </span>
                <span className={`font-semibold ${run.status === 'succeeded' || run.status === 'completed' ? 'text-[#15803D]' : run.status === 'failed' ? 'text-[#B91C1C]' : 'text-[#C2410C]'}`}>{run.status}</span>
                <span>{run.fetched}</span>
                <span>{run.filteredOut}</span>
                <span className="font-semibold text-[#172554]">{run.inserted}</span>
                <span>{run.updated}</span>
                <span>{run.errors}</span>
                <button disabled={!run.csvPath} onClick={() => { void api.downloadRunCsv(run.id).catch(() => notify('Could not download that CSV')) }} className="justify-self-start rounded-md border border-[#DCE4F0] px-2.5 py-1.5 text-[8px] font-semibold text-[#52627A] disabled:opacity-30">Download CSV</button>
              </div>
            )
          })}
      </div>
      {runs.some((run) => run.message) && <p className="mt-3 text-[10px] text-[#B91C1C]">{runs.find((run) => run.message)?.message}</p>}

      <UploadPlanningDataModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => void load()}
      />
    </>
  )
}

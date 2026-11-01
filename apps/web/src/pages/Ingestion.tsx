import { useEffect, useState } from 'react'
import { EmptyState, LoadingBlock } from '../components/EmptyState'
import { PageIntro } from '../components/PageIntro'
import { api, type IngestRun, type LpaHealth } from '../lib/api'
import { notify } from '../lib/notify'

export function Ingestion() {
  const [runs, setRuns] = useState<IngestRun[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [busy, setBusy] = useState(false)
  const [authority, setAuthority] = useState('')
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
    void api.startIngest(authority.trim() ? { authority: authority.trim(), recent: 7, maxPages: 4 } : { recent: 3, maxPages: 8 })
      .then(() => notify('PlanIt run started'))
      .catch((error: unknown) => notify(error instanceof Error ? error.message : 'Could not start a run'))
      .finally(() => { setBusy(false); void load() })
  }

  return (
    <>
      <PageIntro
        eyebrow="Planning data"
        title="Ingestion"
        description="PlanIt is fetched at 06:00, 13:00 and 20:00 Europe/London. Raw responses are kept, noise is filtered, and the Monday-format CSV is written for each run."
        action={<button disabled={busy} onClick={run} className="rounded-lg bg-[#172554] px-4 py-2.5 text-[10px] font-semibold text-white disabled:opacity-50">{busy ? 'Starting…' : 'Run PlanIt now'}</button>}
      />
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
        <label className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">Authority, optional
          <input value={authority} onChange={(event) => setAuthority(event.target.value)} placeholder="Camden" className="mt-2 block w-56 rounded-lg border border-[#DCE4F0] px-3 py-2.5 text-[11px] font-normal normal-case tracking-normal outline-none" />
        </label>
      </form>
      <div className="overflow-hidden rounded-xl border border-[#DCE4F0] bg-white">
        <div className="grid grid-cols-[140px_90px_repeat(5,minmax(70px,.6fr))_120px] bg-[#F8FAFD] px-4 py-3 text-[8px] font-bold uppercase tracking-wider text-[#94A3B8]">
          <span>Started</span><span>Status</span><span>Fetched</span><span>Filtered</span><span>New</span><span>Updated</span><span>Errors</span><span></span>
        </div>
        {status === 'loading' && <div className="p-4"><LoadingBlock label="Loading ingestion runs" /></div>}
        {status === 'error' && <div className="p-4"><EmptyState kind="error" title="Ingestion runs could not be loaded." action={{ label: 'Try again', onClick: () => void load() }} /></div>}
        {status === 'ready' && runs.length === 0 && <div className="p-4"><EmptyState icon="download" title="No ingestion runs yet." action={{ label: 'Run PlanIt now', onClick: run }} /></div>}
        {runs.map((run) => (
          <div key={run.id} className="grid grid-cols-[140px_90px_repeat(5,minmax(70px,.6fr))_120px] items-center border-t border-[#EEF2F7] px-4 py-4 text-[10px]">
            <span className="text-[#64748B]">{new Date(run.startedAt).toLocaleString('en-GB', { hour12: false })}</span>
            <span className={`font-semibold ${run.status === 'succeeded' ? 'text-[#15803D]' : run.status === 'failed' ? 'text-[#B91C1C]' : 'text-[#C2410C]'}`}>{run.status}</span>
            <span>{run.fetched}</span>
            <span>{run.filteredOut}</span>
            <span className="font-semibold text-[#172554]">{run.inserted}</span>
            <span>{run.updated}</span>
            <span>{run.errors}</span>
            <button disabled={!run.csvPath} onClick={() => { void api.downloadRunCsv(run.id).catch(() => notify('Could not download that CSV')) }} className="justify-self-start rounded-md border border-[#DCE4F0] px-2.5 py-1.5 text-[8px] font-semibold text-[#52627A] disabled:opacity-30">Download CSV</button>
          </div>
        ))}
      </div>
      {runs.some((run) => run.message) && <p className="mt-3 text-[10px] text-[#B91C1C]">{runs.find((run) => run.message)?.message}</p>}
    </>
  )
}

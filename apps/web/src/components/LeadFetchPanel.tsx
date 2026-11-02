import { useState } from 'react'
import { LEAD_WINDOWS } from '@planningpal/shared'
import type { LeadFetch } from '../lib/api'

export function LeadWindowPicker({ busy, onConfirm, onClose }: { busy: boolean; onConfirm: (days: number) => void; onClose: () => void }) {
  const [days, setDays] = useState<number>(LEAD_WINDOWS[0].days)
  return (
    <div className="fixed inset-0 z-[60] grid place-items-end bg-[#0F172A]/50 p-4 sm:place-items-center" onMouseDown={onClose}>
      <form
        onSubmit={(event) => { event.preventDefault(); onConfirm(days) }}
        onMouseDown={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2563EB]">Recent applications</div>
        <h2 className="mt-2 font-display text-[24px] font-semibold tracking-[-0.03em]">How far back should we look?</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[#52627A]">We scan the councils from your ICP and add matches as they are found. You can browse while the rest loads.</p>
        <div className="mt-5 grid gap-2">
          {LEAD_WINDOWS.map((window) => (
            <label key={window.days} className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-[14px] font-semibold ${days === window.days ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8]' : 'border-[#E2E8F0]'}`}>
              <span>{window.label}</span>
              <input type="radio" name="window" checked={days === window.days} onChange={() => setDays(window.days)} />
            </label>
          ))}
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-lg border border-[#DCE4F0] px-4 py-3 text-[13px] font-semibold text-[#52627A]">Cancel</button>
          <button type="submit" disabled={busy} className="rounded-lg bg-[#172554] px-4 py-3 text-[13px] font-semibold text-white disabled:opacity-50">Get applications</button>
        </div>
      </form>
    </div>
  )
}

export function LeadFetchProgress({ job }: { job: LeadFetch }) {
  const width = job.total ? Math.round((job.scanned / job.total) * 100) : 0
  return (
    <div className="border-b border-[#E6E9E3] px-5 py-4" role="status">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] font-semibold text-[#172033]">
        <span>Scanning councils {job.scanned}/{job.total} · {job.found} {job.found === 1 ? 'application' : 'applications'} found</span>
        <span className="text-[#64748B]">{width}%</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E2E8F0]">
        <div className="h-full rounded-full bg-[#2563EB] transition-all duration-500" style={{ width: `${width}%` }} />
      </div>
      <p className="mt-2 text-[11px] text-[#64748B]">You can browse the leads already found. The rest keep arriving.</p>
    </div>
  )
}

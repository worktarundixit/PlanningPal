import type { Scheme } from '@planningpal/shared'
import { Icon } from '../components/Icon'
import { PageIntro } from '../components/PageIntro'

export function SavedSchemes({ data, onOpen, onSave, saved, canSave = true }: { data: Scheme[]; onOpen: (scheme: Scheme) => void; onSave: (id: string) => void; saved: string[]; canSave?: boolean }) {
  const items = saved.length ? data.filter((scheme) => saved.includes(scheme.id)) : data.slice(0, 6)
  return (
    <>
      <PageIntro eyebrow="Shortlist" title="Saved schemes" description="Monitor priority applications and keep the most relevant ECI opportunities close to hand." />
      {data.length === 0 && <div className="rounded-xl border border-dashed border-[#DCE4F0] bg-white px-5 py-10 text-center text-[12px] text-[#64748B]">No schemes are loaded yet.</div>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((scheme) => (
          <article key={scheme.id} className="rounded-xl border border-[#DCE4F0] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-start justify-between"><div className={`grid h-10 w-10 place-items-center rounded-lg ${scheme.colour} text-[10px] font-bold`}>{scheme.initials}</div><button disabled={!canSave} onClick={() => onSave(scheme.id)} className="text-[9px] font-semibold text-[#64748B] disabled:cursor-not-allowed disabled:opacity-40">{saved.includes(scheme.id) ? 'Remove' : 'Save'}</button></div>
            <h3 className="mt-5 font-display text-[15px] font-semibold">{scheme.title}</h3>
            <p className="mt-2 text-[9px] text-[#718096]">{scheme.location}</p>
            <div className="mt-5 grid grid-cols-3 border-y border-[#EEF2F7] py-3 text-[9px]"><div><b className="block text-[11px]">{scheme.value}</b><span className="text-[#94A3B8]">Value</span></div><div><b className="block text-[11px]">{scheme.stage}</b><span className="text-[#94A3B8]">Stage</span></div><div><b className="block text-[11px]">{scheme.score}%</b><span className="text-[#94A3B8]">Match</span></div></div>
            <button onClick={() => onOpen(scheme)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#EFF6FF] py-2.5 text-[9px] font-semibold text-[#1D4ED8]">Open dossier <Icon name="arrow" size={12} /></button>
          </article>
        ))}
      </div>
    </>
  )
}

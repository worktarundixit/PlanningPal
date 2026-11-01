import { useEffect, useState } from 'react'
import { PageIntro } from '../components/PageIntro'
import { api } from '../lib/api'

export function Reports() {
  const [report, setReport] = useState<Awaited<ReturnType<typeof api.reports>> | null>(null)
  useEffect(() => { void api.reports().then(setReport).catch(() => setReport(null)) }, [])
  const cards = report?.cards ?? []
  const chart = report?.chart ?? []
  const mix = report?.mix ?? []
  return (
    <>
      <PageIntro eyebrow="Revenue intelligence" title="Performance reports" description="Measure planning data velocity, outreach health and the commercial pipeline attributed to early contractor involvement." action={<select className="rounded-lg border border-[#DCE4F0] bg-white px-3 py-2.5 text-[9px] text-[#52627A]"><option>Last 30 days</option><option>Last quarter</option></select>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <div key={card.label} className="rounded-xl border border-[#DCE4F0] bg-white p-5"><div className="font-display text-[25px] font-semibold">{card.value}</div><div className="mt-2 text-[9px] font-semibold text-[#64748B]">{card.label}</div><div className="mt-3 text-[8px] font-bold text-[#15803D]">{card.delta} <span className="font-normal text-[#94A3B8]">vs prior period</span></div></div>)}</div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border border-[#DCE4F0] bg-white p-5"><div className="flex justify-between"><div><h3 className="font-display text-[14px] font-semibold">Pipeline generated</h3><p className="mt-1 text-[9px] text-[#94A3B8]">Cumulative estimated construction value</p></div><div className="text-[9px] font-semibold text-[#2563EB]">{report?.total ?? ''}</div></div><div className="mt-8 flex h-52 items-end gap-3 border-b border-[#E2E8F0] px-2">{chart.map((h, i) => <div key={i} className="group flex h-full flex-1 items-end"><div className="w-full rounded-t bg-[#BFDBFE] transition group-hover:bg-[#2563EB]" style={{ height: `${h}%` }} /></div>)}</div><div className="mt-3 flex justify-between text-[8px] text-[#94A3B8]"><span>Week 1</span><span>Week 6</span><span>Week 12</span></div></div>
        <div className="rounded-xl border border-[#DCE4F0] bg-white p-5"><h3 className="font-display text-[14px] font-semibold">Lead mix by sector</h3><p className="mt-1 text-[9px] text-[#94A3B8]">Qualified applications</p><div className="mt-7 space-y-5">{mix.map((item) => <div key={item.name}><div className="mb-2 flex justify-between text-[9px]"><span className="font-medium text-[#52627A]">{item.name}</span><span className="font-semibold">{item.value}%</span></div><div className="h-1.5 rounded-full bg-[#EEF2F7]"><div className="h-full rounded-full" style={{ width: `${item.value}%`, backgroundColor: item.color }} /></div></div>)}</div></div>
      </div>
    </>
  )
}

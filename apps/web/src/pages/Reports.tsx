import { useEffect, useState } from 'react'
import { EmptyState, LoadingBlock, SampleBars } from '../components/EmptyState'
import { PageIntro } from '../components/PageIntro'
import { api } from '../lib/api'

const makeReport = {
  cards: [
    { value: '2,184', label: 'Validated leads', delta: '+12.4%' },
    { value: '66.8%', label: 'Unique open rate', delta: '+3.1%' },
    { value: '7.6%', label: 'Positive reply rate', delta: '+1.4%' },
    { value: '£39.2m', label: 'Attributed pipeline', delta: '+18.2%' },
  ],
  total: '£39.2m total',
  chart: [22, 31, 28, 44, 39, 57, 54, 69, 63, 78, 74, 92],
  mix: [
    { name: 'Housing', value: 38, color: '#2563EB' },
    { name: 'Commercial', value: 27, color: '#38BDF8' },
    { name: 'Industrial', value: 19, color: '#A78BFA' },
    { name: 'Healthcare', value: 10, color: '#F59E0B' },
    { name: 'Education', value: 6, color: '#34D399' },
  ],
}

export function Reports({ onNavigate }: { onNavigate?: (screen: string) => void }) {
  const [report, setReport] = useState<Awaited<ReturnType<typeof api.reports>> | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  useEffect(() => { void api.reports().then((next) => { setReport(next); setStatus('ready') }).catch(() => setStatus('error')) }, [])
  const cards = report?.cards ?? []
  const chart = report?.chart ?? []
  const mix = report?.mix ?? []
  const total = report?.total
  const hasReport = cards.length > 0 || chart.length > 0 || mix.length > 0
  return (
    <>
      <PageIntro eyebrow="Revenue intelligence" title="Performance reports" description="Measure planning data velocity, outreach health and the commercial pipeline attributed to early contractor involvement." action={<select className="rounded-lg border border-[#DCE4F0] bg-white px-3 py-2.5 text-[9px] text-[#52627A]"><option>Last 30 days</option><option>Last quarter</option></select>} />
      {status === 'loading' && <LoadingBlock label="Loading reports" />}
      {status === 'error' && <EmptyState kind="error" title="Reports could not be loaded." action={{ label: 'Try again', onClick: () => window.location.reload() }} />}
      {status === 'ready' && !hasReport && <EmptyState icon="chart" title="Reports start once leads and campaigns have activity." action={{ label: 'Run your first planning search', onClick: () => onNavigate?.('Planning search') }} sample={<div><div className="font-display text-[20px] font-semibold text-[#172033]">{makeReport.cards[0]?.value} validated leads</div><SampleBars /></div>} />}
      {status === 'ready' && hasReport && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <div key={card.label} className="rounded-xl border border-[#DCE4F0] bg-white p-5"><div className="font-display text-[25px] font-semibold">{card.value}</div><div className="mt-2 text-[9px] font-semibold text-[#64748B]">{card.label}</div><div className="mt-3 text-[8px] font-bold text-[#15803D]">{card.delta} <span className="font-normal text-[#94A3B8]">vs prior period</span></div></div>)}</div>}
      {status === 'ready' && hasReport && <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border border-[#DCE4F0] bg-white p-5"><div className="flex justify-between"><div><h3 className="font-display text-[14px] font-semibold">Pipeline generated</h3><p className="mt-1 text-[9px] text-[#94A3B8]">Cumulative estimated construction value</p></div><div className="text-[9px] font-semibold text-[#2563EB]">{total}</div></div><div className="mt-8 flex h-52 items-end gap-3 border-b border-[#E2E8F0] px-2">{chart.map((h, i) => <div key={i} className="group flex h-full flex-1 items-end"><div className="w-full rounded-t bg-[#BFDBFE] transition group-hover:bg-[#2563EB]" style={{ height: `${h}%` }} /></div>)}</div><div className="mt-3 flex justify-between text-[8px] text-[#94A3B8]"><span>Week 1</span><span>Week 6</span><span>Week 12</span></div></div>
        <div className="rounded-xl border border-[#DCE4F0] bg-white p-5"><h3 className="font-display text-[14px] font-semibold">Lead mix by sector</h3><p className="mt-1 text-[9px] text-[#94A3B8]">Qualified applications</p><div className="mt-7 space-y-5">{mix.map((item) => <div key={item.name}><div className="mb-2 flex justify-between text-[9px]"><span className="font-medium text-[#52627A]">{item.name}</span><span className="font-semibold">{item.value}%</span></div><div className="h-1.5 rounded-full bg-[#EEF2F7]"><div className="h-full rounded-full" style={{ width: `${item.value}%`, backgroundColor: item.color }} /></div></div>)}</div></div>
      </div>}
    </>
  )
}

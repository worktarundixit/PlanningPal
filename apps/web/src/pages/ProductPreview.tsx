import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon } from '../components/Icon'

const previews = [
  {
    id: 'command',
    title: 'Command Centre',
    copy: 'Real time tracking of outbound email dispatches (4,820+), multi open rates (64.7%), link clicks, and BD phone call attribution.',
  },
  {
    id: 'search',
    title: 'Planning Search',
    copy: '40 to 50 fresh UK planning applications dropped every Monday at 8:00 AM, enriched with applicant and architect phone numbers.',
  },
  {
    id: 'saved',
    title: 'Saved Schemes',
    copy: 'The schemes you choose to pursue, with value, stage, and the named architect kept together on one list.',
  },
  {
    id: 'campaigns',
    title: 'Campaigns',
    copy: 'Define target decision makers (Architects, Developers, Quantity Surveyors, Engineers) and dispatch custom copywriting angles.',
  },
  {
    id: 'crm',
    title: 'CRM',
    copy: 'Track high intent leads who opened emails 3+ times or clicked capability decks. Includes one click complete lead dossier popups.',
  },
] as const

type PreviewId = (typeof previews)[number]['id']

const SCREEN_WIDTH = 1280

const schemes = [
  { initials: 'DR', colour: 'bg-[#DBEAFE]', title: '2 dwellings, Dunvegan Road', status: 'High fit', location: 'Eltham, SE9 1RZ', type: 'Conversion', stage: 'Submitted', council: 'Greenwich', value: '£250k–£450k', date: '12 Mar 2026', ref: '26/1315/F', score: 86, contact: 'Direct', category: 'Housing units' },
  { initials: 'PH', colour: 'bg-[#EDE9FE]', title: 'Pelican Hotel extension', status: 'Review', location: 'Tooting, SW17', type: 'Hotel', stage: 'Submitted', council: 'Wandsworth', value: '£1.5m–£2.0m', date: '4 Mar 2026', ref: '2025/2160', score: 91, contact: 'Direct', category: 'New build' },
  { initials: 'SH', colour: 'bg-[#FEF3C7]', title: 'Scenery House, 9 flats', status: 'High fit', location: 'Wandsworth, SW17', type: 'Mixed use', stage: 'Submitted', council: 'Wandsworth', value: '£1.5m–£2.0m', date: '28 Feb 2026', ref: '2025/1982', score: 78, contact: 'Partial', category: 'Housing units' },
  { initials: 'MD', colour: 'bg-[#DCFCE7]', title: '14 Midland Drive', status: 'Review', location: 'Sutton Coldfield, B72', type: 'New build', stage: 'Approved', council: 'Birmingham', value: '£400k–£600k', date: '19 Feb 2026', ref: '2024/04482/PA', score: 74, contact: 'Direct', category: 'New build' },
  { initials: 'WP', colour: 'bg-[#FCE7F3]', title: 'West Park House plots', status: 'Review', location: 'Forres', type: 'Housing', stage: 'Submitted', council: 'Moray', value: '£200k–£300k', date: '11 Feb 2026', ref: '26/01247/PPP', score: 69, contact: 'Direct', category: 'Housing units' },
]

function AppBar({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="flex h-[78px] items-center justify-between border-b border-[#DCE4F0] bg-[#F4F7FB] px-9">
      <h1 className="font-display text-[23px] font-semibold tracking-[-0.02em] text-[#172033]">{title}</h1>
      <div className="flex items-center gap-2.5">{children}</div>
    </header>
  )
}

function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-6">
      <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#2563EB]">{eyebrow}</div>
      <h2 className="mt-2 font-display text-[24px] font-semibold tracking-[-0.03em] text-[#172033]">{title}</h2>
      <p className="mt-1.5 max-w-2xl text-[11px] leading-relaxed text-[#718096]">{description}</p>
    </div>
  )
}

function CommandScreen() {
  const leads = schemes.slice(0, 4)
  return (
    <div className="bg-[#F4F7FB] text-[#172033]">
      <AppBar title="Command centre">
        <span className="relative grid h-9 w-9 place-items-center rounded-lg border border-[#D8DDD5] bg-white text-[#52605F]">
          <Icon name="bell" size={16} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#E96345] ring-2 ring-white" />
        </span>
        <span className="flex items-center gap-2 rounded-lg bg-[#172554] px-4 py-2.5 text-[11px] font-semibold text-white">
          <Icon name="download" size={14} /> Export leads
        </span>
      </AppBar>
      <div className="p-9">
        <section className="grid grid-cols-4 gap-3">
          {[
            ['Approved schemes', '128', 'building', 'London', 'in your ICP'],
            ['Agent contacts found', '96', 'users', '75%', 'contact coverage'],
            ['High-intent signals', '14', 'signal', '6 new', 'need attention'],
            ['Meetings booked', '4', 'calendar', '8 target', 'of monthly target'],
          ].map(([label, value, icon, meta, note]) => (
            <div key={label} className="rounded-xl border border-[#DCE4F0] bg-white p-5 shadow-[0_1px_2px_rgba(30,58,138,0.04)]">
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#74807E]">{label}</span>
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#F0F3EC] text-[#5E6A68]"><Icon name={icon as 'building'} size={15} /></span>
              </div>
              <div className="mt-4 font-display text-[31px] font-semibold leading-none tracking-[-0.03em]">{value}</div>
              <div className="mt-3 flex items-center gap-1.5 text-[10px]">
                <span className="font-bold text-[#367552]">{meta}</span>
                <span className="text-[#8B9593]">{note}</span>
              </div>
            </div>
          ))}
        </section>
        <section className="mt-5 grid grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)] gap-5">
          <div className="rounded-xl border border-[#DCE4F0] bg-white shadow-[0_1px_2px_rgba(30,58,138,0.04)]">
            <div className="flex items-center justify-between border-b border-[#E6E9E3] p-5">
              <div>
                <h2 className="font-display text-[17px] font-semibold tracking-[-0.01em]">Priority planning leads</h2>
                <p className="mt-1 text-[10px] text-[#7A8583]">Approved schemes ranked from the production export</p>
              </div>
              <div className="flex gap-2">
                <span className="flex h-9 w-[220px] items-center gap-2 rounded-lg border border-[#DCE4F0] bg-[#F8FAFD] px-3 text-[11px] text-[#9CA5A3]">
                  <Icon name="search" size={14} /> Search schemes...
                </span>
                <span className="grid h-9 w-9 place-items-center rounded-lg border border-[#DCE4F0] text-[#64748B]"><Icon name="filter" size={15} /></span>
              </div>
            </div>
            {leads.map((scheme) => (
              <article key={scheme.ref} className="grid grid-cols-[42px_minmax(0,1fr)_auto] gap-4 border-b border-[#ECEEEA] p-5 last:border-0">
                <div className={`grid h-10 w-10 place-items-center rounded-lg ${scheme.colour} text-[10px] font-bold text-[#172224]`}>{scheme.initials}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-[13px] font-semibold">{scheme.title}</h3>
                    <span className={`rounded-full px-2 py-1 text-[8px] font-bold uppercase tracking-[0.08em] ${scheme.status === 'High fit' ? 'bg-[#E6F6D5] text-[#397047]' : 'bg-[#EEF1EC] text-[#63706D]'}`}>{scheme.status}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-[#7C8885]"><Icon name="map" size={11} /> {scheme.location}</div>
                  <div className="mt-3 flex gap-4 text-[9px] font-medium text-[#64706E]">
                    <span>{scheme.type}</span><span className="text-[#B1B8B5]">•</span><span>{scheme.stage}</span><span className="text-[#B1B8B5]">•</span><span>{scheme.council}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-[15px] font-semibold">{scheme.value}</div>
                  <div className="mt-1 text-[9px] text-[#8A9492]">{scheme.date}</div>
                  <div className="mt-3 inline-block rounded-md border border-[#DCE4F0] px-2.5 py-1.5 text-[9px] font-semibold text-[#64748B]">Save</div>
                </div>
              </article>
            ))}
            <div className="flex items-center justify-center gap-2 border-t border-[#E6E9E3] py-4 text-[10px] font-semibold text-[#4F5C5A]">
              View all 128 applications <Icon name="arrow" size={13} />
            </div>
          </div>
          <div className="space-y-5">
            <div className="rounded-xl bg-[#172554] text-white">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-white/45">Pipeline value</div>
                    <div className="mt-2 font-display text-[29px] font-semibold tracking-[-0.03em]">£3.8m</div>
                  </div>
                  <span className="rounded-full bg-[#38BDF8]/15 px-2.5 py-1.5 text-[9px] font-bold text-[#38BDF8]">+12%</span>
                </div>
                <div className="mt-5 flex h-[92px] items-end gap-2 border-b border-white/10">
                  {[42, 55, 48, 63, 58, 72, 66, 80, 74, 88, 92].map((height, index, chart) => (
                    <div key={index} className="flex h-full flex-1 items-end">
                      <div className={`w-full rounded-t-sm ${index === chart.length - 1 ? 'bg-[#38BDF8]' : 'bg-white/20'}`} style={{ height: `${height}%` }} />
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[8px] uppercase tracking-wider text-white/30"><span>Jan</span><span>Jun</span><span>Dec</span></div>
              </div>
              <div className="grid grid-cols-3 border-t border-white/10">
                {[['86', 'Prospects'], ['24', 'Qualified'], ['7', 'Negotiating']].map(([value, label]) => (
                  <div key={label} className="border-r border-white/10 px-4 py-3.5 last:border-0">
                    <div className="font-display text-[16px] font-semibold">{value}</div>
                    <div className="mt-1 text-[8px] uppercase tracking-wider text-white/35">{label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-[#DCE4F0] bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-[16px] font-semibold">Live intent</h2>
                  <p className="mt-1 text-[9px] text-[#8A9492]">Decision-maker activity</p>
                </div>
                <span className="flex items-center gap-1.5 text-[9px] font-semibold text-[#4D615C]"><i className="h-1.5 w-1.5 rounded-full bg-[#70A777]" /> LIVE</span>
              </div>
              <div className="mt-4 space-y-1">
                {[
                  ['ME', 'Maya Evans', 'opened a capability deck', 'Pelican Hotel · 3 opens', '3m'],
                  ['SK', 'Samuel Brodie', 'replied to the introduction', 'Hotel extension · discovery', '1h'],
                  ['NJ', 'Neil Jones', 'clicked the case study', 'Scenery House · 2 clicks', '4h'],
                ].map(([initials, name, action, detail, time]) => (
                  <div key={name} className="flex items-start gap-3 rounded-lg p-2 text-left">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#EDF0EA] text-[9px] font-bold text-[#53605E]">{initials}</div>
                    <div className="min-w-0 flex-1 text-[9px] leading-relaxed text-[#7B8583]">
                      <span className="font-semibold text-[#202D2E]">{name}</span> {action}
                      <div className="text-[#9AA3A1]">{detail}</div>
                    </div>
                    <span className="pt-0.5 text-[8px] text-[#A3ABA9]">{time}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-[#E0E4DD] py-2.5 text-[9px] font-semibold text-[#5F6B69]">View intent centre <Icon name="arrow" size={12} /></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function SearchScreen() {
  const headers = ['Scheme / Application', 'Category', 'Council', 'Value range', 'Stage', 'Contact', 'Fit']
  return (
    <div className="bg-[#F4F7FB] text-[#172033]">
      <AppBar title="Planning search">
        <span className="flex items-center gap-2 rounded-lg bg-[#172554] px-4 py-2.5 text-[11px] font-semibold text-white"><Icon name="download" size={14} /> Export</span>
      </AppBar>
      <div className="p-9">
        <PageIntro eyebrow="Planning intelligence explorer" title="Find schemes before the tender list closes" description="Search enriched statutory applications across your licensed territories. Every result includes valuation, trade classification and verified decision-makers." />
        <div className="rounded-xl border border-[#DCE4F0] bg-white p-4 shadow-sm">
          <div className="flex gap-3">
            <span className="flex flex-1 items-center gap-2 rounded-lg border border-[#DCE4F0] bg-[#F8FAFD] px-3 py-2.5 text-[11px] text-[#718096]">
              <Icon name="search" size={15} /> Application ref, postcode, architect or keyword...
            </span>
            <span className="flex items-center gap-2 rounded-lg border border-[#93C5FD] bg-[#EFF6FF] px-4 py-2.5 text-[10px] font-semibold text-[#1D4ED8]">
              <Icon name="filter" size={13} /> Advanced search
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[#E8EDF5] pt-4">
            {['All categories', 'All counties', 'All stages', 'All contacts', 'All authorities'].map((label) => (
              <div key={label} className="rounded-lg border border-[#DCE4F0] bg-white px-3 py-2.5 text-[10px] text-[#52627A]">{label}</div>
            ))}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-[#DCE4F0] px-3 py-2.5 text-[10px] text-[#94A3B8]">£m Min value</div>
              <div className="rounded-lg border border-[#DCE4F0] px-3 py-2.5 text-[10px] text-[#94A3B8]">£m Max value</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[9px] font-semibold uppercase tracking-wider text-[#94A3B8]">Quick filters</span>
            {['New build', 'Housing units', 'Schemes >£1m', 'Direct contacts', 'London'].map((filter) => (
              <span key={filter} className="rounded-full bg-[#F1F5F9] px-3 py-1.5 text-[9px] font-medium text-[#64748B]">{filter}</span>
            ))}
          </div>
        </div>
        <div className="mt-5 rounded-xl border border-[#DCE4F0] bg-white">
          <div className="flex items-center justify-between border-b border-[#E8EDF5] px-5 py-4">
            <div className="text-[10px] font-semibold text-[#334155]">{schemes.length} matching applications <span className="ml-2 font-normal text-[#94A3B8]">44-column approved schemes export</span></div>
            <div className="text-[9px] text-[#94A3B8]">Select a column heading to sort</div>
          </div>
          <table className="w-full border-collapse text-left">
            <thead className="bg-[#F8FAFD] text-[8px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
              <tr>
                <th className="w-10 px-4 py-3"> </th>
                {headers.map((heading) => <th key={heading} className="px-3 py-3">{heading}</th>)}
                <th className="px-4 py-3"> </th>
              </tr>
            </thead>
            <tbody>
              {schemes.map((scheme) => (
                <tr key={scheme.ref} className="border-t border-[#EEF2F7] text-[10px]">
                  <td className="px-4 py-4"><span className="block h-3.5 w-3.5 rounded-sm border border-[#CBD5E1]" /></td>
                  <td className="px-3 py-4"><div className="font-display text-[12px] font-semibold text-[#1E293B]">{scheme.title}</div><div className="mt-1 text-[9px] text-[#94A3B8]">{scheme.ref} · {scheme.location}</div></td>
                  <td className="px-3 py-4"><span className="rounded-full bg-[#F1F5F9] px-2 py-1 text-[8px] font-semibold text-[#52627A]">{scheme.category}</span></td>
                  <td className="px-3 py-4 text-[#64748B]">{scheme.council}</td>
                  <td className="px-3 py-4 font-semibold text-[#334155]">{scheme.value}</td>
                  <td className="px-3 py-4 font-semibold text-[#2563EB]">{scheme.stage}</td>
                  <td className="px-3 py-4"><span className={`inline-flex items-center gap-1.5 text-[9px] font-semibold ${scheme.contact === 'Direct' ? 'text-[#36805A]' : 'text-[#A16207]'}`}><i className={`h-1.5 w-1.5 rounded-full ${scheme.contact === 'Direct' ? 'bg-[#4ADE80]' : 'bg-[#FACC15]'}`} />{scheme.contact}</span></td>
                  <td className="px-3 py-4"><span className="font-display text-[12px] font-semibold">{scheme.score}</span><span className="text-[#94A3B8]">/100</span></td>
                  <td className="px-4 py-4"><span className="rounded-md border border-[#DCE4F0] px-2.5 py-1.5 text-[9px] font-semibold text-[#64748B]">Save</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-[#E8EDF5] px-5 py-4 text-[9px] text-[#94A3B8]">
            <span>Showing 1–{schemes.length} of {schemes.length}</span>
            <div className="flex gap-1.5">
              <span className="grid h-8 min-w-8 place-items-center rounded-md border border-[#E2E8F0] px-2">‹</span>
              <span className="grid h-8 min-w-8 place-items-center rounded-md bg-[#172554] px-2 text-white">1</span>
              <span className="grid h-8 min-w-8 place-items-center rounded-md border border-[#E2E8F0] px-2">›</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SavedScreen() {
  return (
    <div className="bg-[#F4F7FB] text-[#172033]">
      <AppBar title="Saved schemes" />
      <div className="p-9">
        <PageIntro eyebrow="Shortlist" title="Saved schemes" description="Monitor priority applications and keep the most relevant ECI opportunities close to hand." />
        <div className="grid grid-cols-3 gap-4">
          {schemes.map((scheme) => (
            <article key={scheme.ref} className="rounded-xl border border-[#DCE4F0] bg-white p-5">
              <div className="flex items-start justify-between">
                <div className={`grid h-10 w-10 place-items-center rounded-lg ${scheme.colour} text-[10px] font-bold`}>{scheme.initials}</div>
                <span className="text-[9px] font-semibold text-[#64748B]">Remove</span>
              </div>
              <h3 className="mt-5 font-display text-[15px] font-semibold">{scheme.title}</h3>
              <p className="mt-2 text-[9px] text-[#718096]">{scheme.location}</p>
              <div className="mt-5 grid grid-cols-3 border-y border-[#EEF2F7] py-3 text-[9px]">
                <div><b className="block text-[11px]">{scheme.value}</b><span className="text-[#94A3B8]">Value</span></div>
                <div><b className="block text-[11px]">{scheme.stage}</b><span className="text-[#94A3B8]">Stage</span></div>
                <div><b className="block text-[11px]">{scheme.score}%</b><span className="text-[#94A3B8]">Match</span></div>
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-[#EFF6FF] py-2.5 text-[9px] font-semibold text-[#1D4ED8]">Open dossier <Icon name="arrow" size={12} /></div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

function CampaignsScreen() {
  const rows = [
    ['London architects', 'Live', '1,240', '860', '64%', '9%', '6'],
    ['South East developers', 'Draft', '420', '0', '—', '—', '0'],
  ]
  const domains = [
    ['london-planning.co.uk', 'Healthy', '3', '98%'],
    ['south-east-schemes.co.uk', 'Healthy', '2', '97%'],
    ['architect-intro.co.uk', 'Warming', '1', '91%'],
    ['eci-outreach.co.uk', 'Healthy', '2', '99%'],
  ]
  return (
    <div className="bg-[#F4F7FB] text-[#172033]">
      <AppBar title="Campaigns">
        <span className="rounded-md px-3 py-2 text-[10px] font-semibold text-[#64748B]">Campaign settings</span>
        <span className="rounded-md px-3 py-2 text-[10px] font-semibold text-[#2563EB]">+ New campaign</span>
      </AppBar>
      <div className="p-9">
        <PageIntro eyebrow="PlanningPal Campaigns" title="Campaigns" description="Coordinate RIBA-timed outreach through the PlanningPal campaign engine, across isolated sending domains." />
        <div className="grid grid-cols-3 gap-3">
          {[['8', 'Active inboxes', '4 sending domains'], ['96%', 'Inbox placement', 'Measured after the first send'], ['30/day', 'Sending limit', 'Per inbox']].map(([value, label, note]) => (
            <div key={label} className="rounded-xl border border-[#DCE4F0] bg-white p-5">
              <div className="font-display text-2xl font-semibold">{value}</div>
              <div className="mt-2 text-[10px] font-semibold text-[#52627A]">{label}</div>
              <div className="mt-1 text-[9px] text-[#94A3B8]">{note}</div>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-xl border border-[#DCE4F0] bg-white">
          <div className="grid grid-cols-[minmax(220px,1.5fr)_repeat(5,minmax(70px,0.5fr))_120px] bg-[#F8FAFD] px-5 py-3 text-[8px] font-bold uppercase tracking-wider text-[#94A3B8]">
            <span>Campaign</span><span>Contacts</span><span>Sent</span><span>Open rate</span><span>Reply rate</span><span>Meetings</span><span>Actions</span>
          </div>
          {rows.map(([name, status, contacts, sent, open, reply, meetings]) => (
            <div key={name} className="grid grid-cols-[minmax(220px,1.5fr)_repeat(5,minmax(70px,0.5fr))_120px] items-center border-t border-[#EEF2F7] px-5 py-5 text-[10px]">
              <div>
                <div className="font-display text-[12px] font-semibold">{name}</div>
                <div className={`mt-1.5 inline-flex items-center gap-1.5 text-[8px] font-bold ${status === 'Live' ? 'text-[#36805A]' : 'text-[#94A3B8]'}`}>
                  <i className={`h-1.5 w-1.5 rounded-full ${status === 'Live' ? 'bg-[#4ADE80]' : 'bg-[#CBD5E1]'}`} />{status}
                </div>
              </div>
              <span>{contacts}</span><span>{sent}</span><span className="font-semibold">{open}</span><span>{reply}</span><span className="font-semibold text-[#2563EB]">{meetings}</span>
              <div className="flex gap-1.5">
                <span className="rounded-md border border-[#DCE4F0] px-2 py-1.5 text-[8px] font-semibold text-[#64748B]">Manage</span>
                {status === 'Live' ? <span className="rounded-md bg-[#F1F5F9] px-2 py-1.5 text-[8px] font-semibold text-[#64748B]">Pause</span> : null}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-xl border border-[#DCE4F0] bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-[14px] font-semibold">Sending domains</h3>
              <p className="mt-1 text-[9px] text-[#94A3B8]">Lookalike domains isolate sender reputation from the company domain.</p>
            </div>
            <div className="flex gap-2">
              <span className="rounded-lg border border-[#DCE4F0] px-3 py-2 text-[8px] font-semibold text-[#52627A]">Add owned domain</span>
              <span className="rounded-lg bg-[#172554] px-3 py-2 text-[8px] font-semibold text-white">Buy lookalike domain</span>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-4 gap-3">
            {domains.map(([name, status, inboxes, health]) => (
              <div key={name} className="rounded-lg border border-[#E2E8F0] p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[9px] font-semibold">{name}</div>
                    <div className={`mt-1 text-[7px] font-semibold ${status === 'Healthy' ? 'text-[#15803D]' : 'text-[#C2410C]'}`}>{status}</div>
                  </div>
                  <i className={`mt-1 h-2 w-2 shrink-0 rounded-full ${status === 'Healthy' ? 'bg-[#4ADE80]' : 'bg-[#FB923C]'}`} />
                </div>
                <div className="mt-3 border-t border-[#EEF2F7] pt-2 text-[8px] text-[#94A3B8]">{inboxes} inboxes · {health}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function CrmScreen() {
  const columns = [
    ['New lead queue', [{ person: 'Maya Evans', firm: 'Studio20 Architects', scheme: 'Dunvegan Road', value: '£350k', assignee: 'Emily Rhodes', opens: 4 }]],
    ['Active outreach', [{ person: 'Samuel Brodie', firm: 'Hgh Consulting', scheme: 'Pelican Hotel', value: '£1.7m', assignee: 'James Wilkins', opens: 2 }]],
    ['High intent', [{ person: 'Neil Jones', firm: 'NI Jones Planning', scheme: 'Scenery House', value: '£1.6m', assignee: 'Emily Rhodes', opens: 5 }]],
    ['Warm engagement', [{ person: 'Kit Smithson', firm: 'Natural Building Studio', scheme: 'Midland Drive', value: '£480k', assignee: 'Unassigned', opens: 3 }]],
    ['Tender opportunity', [{ person: 'David Hemmings', firm: 'Aura Heritage', scheme: 'Westminster scheme', value: '£420k', assignee: 'James Wilkins', opens: 6 }]],
  ] as const
  return (
    <div className="bg-[#F4F7FB] text-[#172033]">
      <AppBar title="CRM & intent">
        {['Pipeline', 'Intent', 'Inbox', 'Tasks', 'Opportunities', 'Contacts'].map((label) => (
          <span key={label} className={`rounded-md px-3 py-2 text-[10px] font-semibold ${label === 'Pipeline' ? 'bg-[#DBEAFE] text-[#1D4ED8]' : 'text-[#64748B]'}`}>{label}</span>
        ))}
      </AppBar>
      <div className="p-9">
        <section className="mb-5 rounded-xl border border-[#DCE4F0] bg-white shadow-[0_1px_2px_rgba(30,58,138,0.04)]">
          <div className="flex items-center justify-between p-5">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#2563EB]">5-stage opportunity pipeline</div>
              <h2 className="mt-2 font-display text-[22px] font-semibold tracking-[-0.03em]">Opportunity pipeline</h2>
              <p className="mt-1 max-w-2xl text-[10px] leading-relaxed text-[#718096]">Qualify engagement, assign ownership and progress opportunities into live tenders.</p>
            </div>
            <span className="flex items-center gap-2 rounded-lg bg-[#FFF7ED] px-3 py-2.5 text-[9px] font-semibold text-[#C2410C]">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-[#FED7AA] text-[8px] font-bold">4</span>
              Priority calls due
            </span>
          </div>
          <div className="grid grid-cols-4 border-t border-[#EEF2F7]">
            {[
              ['4', 'High-intent leads', 'signal'],
              ['6', 'Inbox threads', 'mail'],
              ['3', 'Open tasks', 'calendar'],
              ['2', 'Qualified opportunities', 'chart'],
            ].map(([value, label, icon]) => (
              <div key={label} className="flex items-center gap-3 border-r border-[#EEF2F7] px-4 py-3.5 last:border-r-0">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#F1F5F9] text-[#64748B]"><Icon name={icon as 'signal'} size={14} /></span>
                <div>
                  <div className="font-display text-[15px] font-semibold text-[#1E293B]">{value}</div>
                  <div className="mt-0.5 text-[8px] text-[#94A3B8]">{label}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-[#E8EDF5] bg-[#F8FAFD] px-4 py-3">
            <div className="flex rounded-lg border border-[#E2E8F0] bg-white p-1">
              <span className="rounded-md bg-[#172554] px-3 py-1.5 text-[8px] font-semibold text-white">Active pipeline</span>
              <span className="px-3 py-1.5 text-[8px] font-semibold text-[#64748B]">Archived</span>
            </div>
            <span className="rounded-md border border-[#DCE4F0] bg-white px-3 py-2 text-[9px] font-semibold text-[#52627A]">All assignees</span>
          </div>
        </section>
        <div className="grid grid-cols-5 gap-3 pb-4">
          {columns.map(([title, cards]) => (
            <div key={title} className="rounded-xl bg-[#EAEFF7] p-2.5">
              <div className="flex items-center justify-between px-1 py-2">
                <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#52627A]">{title}</span>
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-[8px] font-bold text-[#64748B]">{cards.length}</span>
              </div>
              {cards.map((card) => (
                <article key={card.person} className="rounded-lg border border-[#DCE4F0] bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-[#DBEAFE] text-[8px] font-bold text-[#1D4ED8]">{card.person.split(' ').map((part) => part[0]).join('')}</div>
                    <span className="font-display text-[11px] font-semibold">{card.value}</span>
                  </div>
                  <div className="mt-3 text-[10px] font-semibold text-[#1E293B]">{card.person}</div>
                  <div className="mt-1 text-[8px] text-[#94A3B8]">{card.firm}</div>
                  <div className="mt-2 text-[9px] text-[#64748B]">{card.scheme}</div>
                  {card.opens >= 3 ? <div className="mt-3 rounded-md bg-[#FFF7ED] px-2 py-1.5 text-[8px] font-bold text-[#C2410C]">Opened {card.opens}× · priority signal</div> : null}
                  <div className="mt-3 text-[8px] text-[#64748B]">Assigned to <b className="font-semibold text-[#334155]">{card.assignee}</b></div>
                  <div className="mt-3 grid grid-cols-5 gap-1.5 border-t border-[#EEF2F7] pt-3 text-[#64748B]">
                    {(['mail', 'phone', 'calendar', 'note', 'archive'] as const).map((icon) => (
                      <span key={icon} className="grid h-7 place-items-center rounded-md bg-[#F8FAFD]"><Icon name={icon} size={12} /></span>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-[8px] font-semibold">
                    <span className="text-[#94A3B8]">← Back</span>
                    <span className="text-[#2563EB]">Advance →</span>
                  </div>
                </article>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PreviewScreen({ id }: { id: PreviewId }) {
  if (id === 'search') return <SearchScreen />
  if (id === 'saved') return <SavedScreen />
  if (id === 'campaigns') return <CampaignsScreen />
  if (id === 'crm') return <CrmScreen />
  return <CommandScreen />
}

function ScaledScreen({ screenKey, children }: { screenKey: string; children: ReactNode }) {
  const frame = useRef<HTMLDivElement>(null)
  const sheet = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [sheetHeight, setSheetHeight] = useState(1)

  useEffect(() => {
    const frameNode = frame.current
    const sheetNode = sheet.current
    if (!frameNode || !sheetNode) return
    const fit = () => {
      const width = frameNode.clientWidth
      const nextScale = width > 0 ? width / SCREEN_WIDTH : 1
      setScale(nextScale)
      setSheetHeight(sheetNode.scrollHeight)
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(frameNode)
    observer.observe(sheetNode)
    return () => observer.disconnect()
  }, [screenKey])

  return (
    <div ref={frame} className="relative w-full bg-[#F4F7FB]" style={{ height: sheetHeight * scale }} data-preview-frame>
      <div ref={sheet} data-preview-sheet className="absolute top-0 left-0 origin-top-left bg-[#F4F7FB]" style={{ width: SCREEN_WIDTH, transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  )
}

export function CommandPreview() {
  const [active, setActive] = useState<PreviewId>('command')
  return (
    <div className="mt-10 grid items-start gap-4 lg:grid-cols-[minmax(0,1.63fr)_minmax(0,0.57fr)]">
      <div className="min-w-0 rounded-xl border border-[#3F3F46] bg-white" data-preview-shell>
        <ScaledScreen screenKey={active}>
          <PreviewScreen id={active} />
        </ScaledScreen>
      </div>
      <div className="grid content-start gap-2" role="tablist" aria-label="Product screens">
        {previews.map((item) => {
          const selected = item.id === active
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(item.id)}
              className={`rounded-lg border px-4 py-3 text-left ${selected ? 'border-[#172554] bg-[#172554]' : 'border-[#3F3F46] bg-[#27272A] hover:bg-[#3F3F46]'}`}
            >
              <div className="text-[9.8px] font-semibold leading-[1.25] text-white">{item.title}</div>
              <p className={`mt-1 text-[8.4px] font-normal leading-[14px] ${selected ? 'text-white' : 'text-[#D4D4D8]'}`}>{item.copy}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

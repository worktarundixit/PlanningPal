import { useState } from 'react'
import type { Scheme } from '@planningpal/shared'
import { Icon, type IconName } from '../components/Icon'
import { PageIntro } from '../components/PageIntro'
import { notify } from '../lib/notify'
import type { BoardCard } from '../types'

export function Contacts({ data, embedded = false, crmCards = [], onCrmAction }: { data: Scheme[]; embedded?: boolean; crmCards?: BoardCard[]; onCrmAction?: (type: 'email' | 'call' | 'task' | 'note', card: BoardCard) => void }) {
  const [filter, setFilter] = useState('All')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const contacts = data.filter((scheme) => scheme.architect !== 'Contact not published').slice(0, 30).map((scheme, index) => ({
    scheme,
    crm: crmCards.find((card) => card.person === scheme.architect) ?? crmCards[index % Math.max(crmCards.length, 1)],
    index,
    confidence: scheme.email && scheme.phone ? 'Verified direct' : 'Studio match',
  }))
  const [selectedContact, setSelectedContact] = useState<(typeof contacts)[number] | null>(null)
  const matchesFilter = (contact: (typeof contacts)[number]) => filter === 'All'
    || (filter === 'Direct' && contact.confidence === 'Verified direct')
    || (filter === 'Studio match' && contact.confidence === 'Studio match')
    || (filter === 'High intent' && (contact.crm?.opens ?? 0) >= 3)
  const crmFor = (contact: (typeof contacts)[number]): BoardCard => contact.crm ?? {
    id: 1000 + contact.index,
    person: contact.scheme.architect,
    firm: contact.scheme.practice,
    scheme: contact.scheme.title,
    value: contact.scheme.value,
    opens: 0,
    stage: 0,
    assignee: 'Unassigned',
  }
  return (
    <>
      {!embedded && <PageIntro eyebrow="Enriched decision-makers" title="Contacts" description="Corporate B2B contacts resolved through Companies House, domain matching, MX checks and SMTP verification." />}
      <div className="mb-4 flex flex-wrap gap-2">{['All', 'Direct', 'Studio match', 'High intent'].map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-full px-3 py-2 text-[9px] font-semibold ${filter === item ? 'bg-[#172554] text-white' : 'border border-[#DCE4F0] bg-white text-[#64748B]'}`}>{item}</button>)}</div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {contacts.filter(matchesFilter).map((contact) => {
          const card = crmFor(contact)
          return <article onClick={() => setSelectedContact(contact)} key={`${contact.scheme.id}-${contact.index}`} className="flex min-h-[270px] cursor-pointer flex-col rounded-xl border border-[#DCE4F0] bg-white p-5 shadow-[0_1px_2px_rgba(30,58,138,0.04)] transition hover:-translate-y-0.5 hover:border-[#93C5FD] hover:shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${contact.index % 3 === 0 ? 'bg-[#DBEAFE] text-[#1D4ED8]' : contact.index % 3 === 1 ? 'bg-[#FCE7F3] text-[#9D174D]' : 'bg-[#EDE9FE] text-[#6D28D9]'} text-[10px] font-bold`}>{contact.scheme.architect.split(' ').map((name) => name[0]).join('').slice(0, 2)}</div>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[8px] font-bold ${contact.confidence === 'Verified direct' ? 'bg-[#ECFDF5] text-[#15803D]' : 'bg-[#FFFBEB] text-[#A16207]'}`}><i className={`h-1.5 w-1.5 rounded-full ${contact.confidence === 'Verified direct' ? 'bg-[#4ADE80]' : 'bg-[#FACC15]'}`} />{contact.confidence}</span>
            </div>
            <div className="mt-4"><h3 className="font-display text-[14px] font-semibold text-[#1E293B]">{contact.scheme.architect}</h3><p className="mt-1 text-[9px] text-[#64748B]">Planning contact · {contact.scheme.practice}</p></div>
            <div className="mt-4 rounded-lg bg-[#F8FAFD] p-3"><div className="text-[8px] font-bold uppercase tracking-wider text-[#94A3B8]">Related approved scheme</div><div className="mt-1.5 line-clamp-2 text-[9px] font-medium leading-relaxed text-[#52627A]">{contact.scheme.title}</div></div>
            <div className="mt-3 flex items-center justify-between text-[8px]"><span className="text-[#94A3B8]">Last engagement</span><span className={`font-semibold ${card.opens >= 3 ? 'text-[#C2410C]' : 'text-[#52627A]'}`}>{card.opens ? `${card.opens} opens · ${card.opens >= 3 ? 'High intent' : 'Active'}` : 'No outreach yet'}</span></div>
            <div className="mt-auto grid grid-cols-3 gap-2 border-t border-[#EEF2F7] pt-4">
              <button onClick={(event) => { event.stopPropagation(); onCrmAction?.('email', card) }} className="flex items-center justify-center gap-1.5 rounded-lg bg-[#172554] py-2.5 text-[8px] font-semibold text-white"><Icon name="mail" size={11} /> Email</button>
              <button onClick={(event) => { event.stopPropagation(); onCrmAction?.('call', card) }} className="flex items-center justify-center gap-1.5 rounded-lg border border-[#BFDBFE] py-2.5 text-[8px] font-semibold text-[#2563EB]"><Icon name="phone" size={11} /> Call</button>
              <button onClick={(event) => { event.stopPropagation(); setSelectedContact(contact) }} className="flex items-center justify-center gap-1.5 rounded-lg bg-[#F1F5F9] py-2.5 text-[8px] font-semibold text-[#52627A]">Details <Icon name="arrow" size={10} /></button>
            </div>
          </article>
        })}
      </div>
      {selectedContact && (() => {
        const scheme = selectedContact.scheme
        const card = crmFor(selectedContact)
        const stageNames = ['New lead', 'Active outreach', 'High intent', 'Warm engagement', 'Tender opportunity']
        const history = [
          { icon: 'users' as IconName, title: 'Contact enriched', detail: `${selectedContact.confidence} · PlanningPal enrichment`, time: scheme.date },
          ...(card.stage >= 1 ? [{ icon: 'send' as IconName, title: 'ECI introduction sent', detail: `Campaign sequence started by ${card.assignee}`, time: '7 days ago' }] : []),
          ...(card.opens > 0 ? [{ icon: 'mail' as IconName, title: `Email opened ${card.opens} time${card.opens === 1 ? '' : 's'}`, detail: card.opens >= 3 ? 'High-intent threshold reached' : 'Engagement recorded', time: '2 hours ago' }] : []),
          ...(card.opens >= 5 ? [{ icon: 'external' as IconName, title: 'Capability deck viewed', detail: 'Portfolio link clicked from campaign email', time: '48 minutes ago' }] : []),
        ]
        return <div className="fixed inset-0 z-[75] flex justify-end bg-[#0F172A]/55 backdrop-blur-[2px]" onMouseDown={() => setSelectedContact(null)}>
          <aside className="h-full w-full max-w-[580px] overflow-y-auto bg-[#F7F9FC] shadow-2xl animate-slide-in" onMouseDown={(event) => event.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#DCE4F0] bg-[#F7F9FC]/95 px-6 py-4 backdrop-blur"><div><div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#2563EB]">CRM contact record</div><div className="mt-1 text-[9px] text-[#94A3B8]">Synced across Contacts, Intent and Pipeline</div></div><button onClick={() => setSelectedContact(null)} className="grid h-9 w-9 place-items-center rounded-full border border-[#DCE4F0] bg-white text-[#64748B]"><Icon name="close" size={15} /></button></div>
            <div className="p-6">
              <div className="flex items-start gap-4"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#DBEAFE] text-[12px] font-bold text-[#1D4ED8]">{scheme.architect.split(' ').map((name) => name[0]).join('').slice(0, 2)}</div><div className="min-w-0 flex-1"><h2 className="font-display text-[22px] font-semibold tracking-[-0.03em]">{scheme.architect}</h2><p className="mt-1 text-[10px] text-[#64748B]">Planning contact · {scheme.practice}</p><div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full bg-[#ECFDF5] px-2.5 py-1 text-[8px] font-bold text-[#15803D]">{selectedContact.confidence}</span><span className="rounded-full bg-[#EFF6FF] px-2.5 py-1 text-[8px] font-bold text-[#1D4ED8]">{stageNames[card.stage]}</span>{card.opens >= 3 && <span className="rounded-full bg-[#FFF7ED] px-2.5 py-1 text-[8px] font-bold text-[#C2410C]">High intent · {card.opens} opens</span>}</div></div></div>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{[[scheme.date, 'Added on'], ['PlanningPal', 'Added by'], [card.assignee, 'Assigned to'], [card.opens ? '2 hours ago' : 'No activity', 'Last engagement']].map(([value, label]) => <div key={label} className="rounded-lg border border-[#DCE4F0] bg-white p-3"><div className="truncate text-[9px] font-semibold text-[#334155]">{value}</div><div className="mt-1 text-[7px] uppercase tracking-wider text-[#94A3B8]">{label}</div></div>)}</div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2"><button onClick={() => onCrmAction?.('email', card)} className="flex items-center justify-center gap-2 rounded-lg bg-[#172554] py-3 text-[9px] font-semibold text-white"><Icon name="mail" size={13} /> Compose email</button><button onClick={() => onCrmAction?.('call', card)} className="flex items-center justify-center gap-2 rounded-lg border border-[#BFDBFE] bg-white py-3 text-[9px] font-semibold text-[#2563EB]"><Icon name="phone" size={13} /> Log a call</button><button onClick={() => onCrmAction?.('task', card)} className="flex items-center justify-center gap-2 rounded-lg border border-[#DCE4F0] bg-white py-3 text-[9px] font-semibold text-[#52627A]"><Icon name="calendar" size={13} /> Add follow-up</button><button onClick={() => onCrmAction?.('note', card)} className="flex items-center justify-center gap-2 rounded-lg border border-[#DCE4F0] bg-white py-3 text-[9px] font-semibold text-[#52627A]"><Icon name="note" size={13} /> Add CRM note</button></div>
              <section className="mt-7"><div className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#64748B]">Contact details</div><div className="mt-3 rounded-xl border border-[#DCE4F0] bg-white p-4">{[['Email', scheme.email || 'Not published'], ['Phone', scheme.phone || 'Not published'], ['Office', scheme.architectAddress || 'Not published'], ['Related scheme', `${scheme.title} · ${scheme.id}`]].map(([label, value]) => <div key={label} className="grid grid-cols-[90px_1fr] gap-3 border-b border-[#EEF2F7] py-2.5 text-[9px] last:border-0"><span className="text-[#94A3B8]">{label}</span><span className="break-words font-medium text-[#52627A]">{value}</span></div>)}</div></section>
              <section className="mt-7"><div className="flex items-center justify-between"><div className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#64748B]">Reachout history</div><span className="text-[8px] text-[#94A3B8]">{history.length} activities</span></div><div className="mt-3 rounded-xl border border-[#DCE4F0] bg-white p-4">{history.map((event, index) => <div key={`${event.title}-${index}`} className="relative flex gap-3 pb-5 last:pb-0"><div className="relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#EFF6FF] text-[#2563EB]"><Icon name={event.icon} size={11} /></div>{index < history.length - 1 && <div className="absolute left-3.5 top-7 h-[calc(100%-20px)] w-px bg-[#E2E8F0]" />}<div className="flex-1"><div className="text-[9px] font-semibold text-[#334155]">{event.title}</div><div className="mt-1 text-[8px] text-[#94A3B8]">{event.detail}</div></div><div className="text-[7px] text-[#94A3B8]">{event.time}</div></div>)}</div></section>
              <section className="mt-7"><div className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#64748B]">Internal note</div><textarea value={notes[scheme.id] || ''} onChange={(event) => setNotes((items) => ({ ...items, [scheme.id]: event.target.value }))} rows={4} className="mt-3 w-full resize-none rounded-xl border border-[#DCE4F0] bg-white p-4 text-[10px] leading-relaxed text-[#52627A] outline-none focus:border-[#2563EB]" placeholder="Add context, objections or next steps for your team…" /><button onClick={() => notify(`Note saved for ${scheme.architect}`)} className="mt-2 rounded-lg bg-[#172554] px-4 py-2.5 text-[9px] font-semibold text-white">Save note</button></section>
            </div>
          </aside>
        </div>
      })()}
    </>
  )
}

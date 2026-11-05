import { useEffect, useState } from 'react'
import type { Scheme } from '@planningpal/shared'
import { EmptyState, LoadingBlock } from '../components/EmptyState'
import { Icon, type IconName } from '../components/Icon'
import { api } from '../lib/api'
import { notify } from '../lib/notify'
import { Contacts } from './Contacts'
import type { BoardCard, Conversation, CrmTab } from '../types'

export function IntentBoard({ data, onOpen, crmTab, setCrmTab, setInboxUnread, canWrite = true, onNavigate }: { data: Scheme[]; onOpen: (scheme: Scheme) => void; crmTab: CrmTab; setCrmTab: (tab: CrmTab) => void; setInboxUnread: (count: number) => void; canWrite?: boolean; onNavigate?: (screen: string) => void }) {
  const [assignee, setAssignee] = useState('All assignees')
  const [pipelineView, setPipelineView] = useState<'active' | 'archived'>('active')
  const [lastAction, setLastAction] = useState('')
  const [crmAction, setCrmAction] = useState<{ type: 'email' | 'call' | 'task' | 'note'; card: BoardCard } | null>(null)
  const [actionText, setActionText] = useState('')
  const [selectedConversation, setSelectedConversation] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [replyText, setReplyText] = useState('')
  const [cards, setCards] = useState<BoardCard[]>([])
  const [doneTasks, setDoneTasks] = useState<string[]>([])
  const [crmStatus, setCrmStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  useEffect(() => {
    void Promise.all([api.kanban(), api.inbox(), api.activities('task')]).then(([board, inbox, tasks]) => {
      let resolved = board.cards.map((card) => {
        const conversation = inbox.data.find((item) => item.crmLeadId === card.id)
        return { ...card, timeLabel: conversation?.timeLabel, preview: conversation?.preview }
      })
      if (resolved.length === 0 && data.length > 0) {
        resolved = data.slice(0, 15).map((scheme, idx) => ({
          id: `crm-${scheme.id}`,
          schemeId: scheme.id,
          scheme: scheme.title,
          person: scheme.architect || scheme.applicant || 'Contact not published',
          firm: scheme.practice || scheme.council || 'Planning lead',
          stage: idx % 5,
          value: scheme.value || '—',
          opens: 0,
          timeLabel: undefined,
          preview: undefined,
          assignee: 'Unassigned',
        }))
      }
      setCards(resolved)
      setConversations(inbox.data)
      setSelectedConversation((current) => current || inbox.data[0]?.id || '')
      setDoneTasks(tasks.data.filter((task) => task.completedAt && task.crmLeadId).map((task) => task.crmLeadId as string))
      setInboxUnread(inbox.unreadCount)
      setCrmStatus('ready')
    }).catch(() => setCrmStatus('error'))
  }, [data, setInboxUnread])
  const columns = ['New lead queue', 'Active outreach', 'High intent', 'Warm engagement', 'Tender opportunity']
  const selectedMessage = conversations.find((item) => item.id === selectedConversation) ?? conversations[0]
  const unreadCount = conversations.filter((item) => item.unread).length
  const visibleCards = cards.filter((card) => Boolean(card.archived) === (pipelineView === 'archived')).filter((card) => assignee === 'All assignees' || card.assignee === assignee)
  const archivedCount = cards.filter((card) => card.archived).length
  const openScheme = (card: { schemeId?: string }) => {
    const scheme = data.find((item) => item.id === card.schemeId) ?? data[0]
    if (scheme) onOpen(scheme)
  }
  const move = (id: string, direction: number) => {
    if (!canWrite) return
    const card = cards.find((item) => item.id === id)
    if (!card) return
    const stage = Math.max(0, Math.min(4, card.stage + direction))
    setCards((items) => items.map((item) => item.id === id ? { ...item, stage } : item))
    void api.moveStage(id, stage).catch(() => notify('Could not move that opportunity'))
  }
  const archive = (card: BoardCard) => {
    if (!canWrite) return
    const archived = !card.archived
    setCards((items) => items.map((item) => item.id === card.id ? { ...item, archived } : item))
    setLastAction(`${card.person} ${card.archived ? 'restored to the active pipeline' : 'archived'}`)
    void api.archiveLead(card.id, archived).catch(() => notify('Could not update the archive'))
  }
  const openAction = (type: 'email' | 'call' | 'task' | 'note', card: BoardCard) => {
    if (!canWrite) return
    setCrmAction({ type, card })
    setActionText(type === 'email' ? `ECI introduction regarding ${card.scheme}` : '')
  }
  const completeAction = () => {
    if (!crmAction) return
    const labels = { email: 'Email queued', call: 'Call outcome logged', task: 'Follow-up task created', note: 'Note saved' }
    void api.createActivity({
      type: crmAction.type,
      crmLeadId: crmAction.card.id,
      applicationRef: crmAction.card.schemeId,
      title: labels[crmAction.type],
      body: actionText,
    }).then(() => {
      setLastAction(`${labels[crmAction.type]} for ${crmAction.card.person}`)
      setCrmAction(null)
      setActionText('')
    }).catch(() => notify('Could not save that activity'))
  }
  const openConversation = (id: string) => {
    setSelectedConversation(id)
    setConversations((items) => items.map((item) => item.id === id ? { ...item, unread: false } : item))
    setInboxUnread(conversations.filter((item) => item.id !== id && item.unread).length)
    void api.markRead(id).catch(() => notify('Could not mark that thread read'))
  }
  const sendReply = () => {
    if (!canWrite) return
    if (!replyText.trim() || !selectedMessage) return
    const body = replyText
    void api.reply(selectedMessage.id, body).then((message) => {
      setConversations((items) => items.map((item) => item.id === selectedMessage.id ? { ...item, messages: [...item.messages, message] } : item))
      setLastAction(`Reply queued to ${selectedMessage.person}. Sending is stubbed.`)
      setReplyText('')
    }).catch(() => notify('Could not store that reply'))
  }
  return (
    <>
      <section className="mb-5 overflow-hidden rounded-xl border border-[#DCE4F0] bg-white shadow-[0_1px_2px_rgba(30,58,138,0.04)]">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#2563EB]">5-stage opportunity pipeline</div>
            <h2 className="mt-2 font-display text-[22px] font-semibold tracking-[-0.03em] text-[#172033]">{crmTab === 'pipeline' ? 'Opportunity pipeline' : crmTab === 'intent' ? 'Intent feed' : crmTab === 'inbox' ? 'Shared inbox' : crmTab === 'tasks' ? 'Tasks & follow-ups' : crmTab === 'contacts' ? 'Decision-maker contacts' : 'Qualified opportunities'}</h2>
            <p className="mt-1 max-w-2xl text-[10px] leading-relaxed text-[#718096]">{crmTab === 'pipeline' ? 'Qualify engagement, assign ownership and progress opportunities into live tenders.' : crmTab === 'intent' ? 'Review opens, clicks and replies as they happen across active campaigns.' : crmTab === 'inbox' ? 'Read and respond to campaign replies from every connected sending inbox.' : crmTab === 'tasks' ? 'Prioritise calls, follow-ups and meetings assigned to your team.' : crmTab === 'contacts' ? 'Access the architects and planning agents connected to your approved schemes.' : 'Review high-value schemes that have progressed beyond initial outreach.'}</p>
          </div>
          {cards.filter((card) => card.opens >= 3).length > 0 && <button onClick={() => { setCrmTab('tasks'); setAssignee('All assignees'); notify('Priority call queue opened') }} className="flex shrink-0 items-center gap-2 self-start rounded-lg bg-[#FFF7ED] px-3 py-2.5 text-[9px] font-semibold text-[#C2410C] sm:self-auto">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[#FED7AA] text-[8px] font-bold">{cards.filter((card) => card.opens >= 3).length}</span>
            Priority calls due
            <Icon name="arrow" size={12} />
          </button>}
        </div>
        <div className="grid grid-cols-2 border-t border-[#EEF2F7] lg:grid-cols-4">
          {[[String(cards.filter((card) => card.opens >= 3).length), 'High-intent leads', 'signal', 'intent'], [String(conversations.length), 'Inbox threads', 'mail', 'inbox'], [String(cards.filter((card) => card.opens >= 3 && !doneTasks.includes(card.id)).length), 'Open tasks', 'calendar', 'tasks'], [String(cards.filter((card) => card.stage >= 2 && !card.archived).length), 'Qualified opportunities', 'chart', 'opportunities']].map(([value, label, icon, target], index) => (
            <button onClick={() => { setCrmTab(target as CrmTab); notify(`Showing ${label.toLowerCase()}`) }} key={label} className={`group flex items-center gap-3 border-[#EEF2F7] px-4 py-3.5 text-left transition hover:bg-[#F8FAFD] ${index % 2 === 0 ? 'border-r' : ''} ${index < 2 ? 'border-b lg:border-b-0' : ''} lg:border-r lg:last:border-r-0`}>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#F1F5F9] text-[#64748B]"><Icon name={icon as IconName} size={14} /></span>
              <div className="flex-1"><div className="font-display text-[15px] font-semibold text-[#1E293B]">{value}</div><div className="mt-0.5 text-[8px] text-[#94A3B8]">{label}</div></div>
              <span className="mr-1 text-[#CBD5E1] opacity-0 transition group-hover:translate-x-0.5 group-hover:text-[#2563EB] group-hover:opacity-100"><Icon name="chevron" size={12} /></span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E8EDF5] bg-[#F8FAFD] px-4 py-3">
          {crmTab === 'pipeline' ? <div className="flex rounded-lg border border-[#E2E8F0] bg-white p-1">
            <button onClick={() => setPipelineView('active')} className={`rounded-md px-3 py-1.5 text-[8px] font-semibold ${pipelineView === 'active' ? 'bg-[#172554] text-white shadow-sm' : 'text-[#64748B]'}`}>Active pipeline</button>
            <button onClick={() => setPipelineView('archived')} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[8px] font-semibold ${pipelineView === 'archived' ? 'bg-[#172554] text-white shadow-sm' : 'text-[#64748B]'}`}><Icon name="archive" size={11} /> Archived {archivedCount > 0 && `(${archivedCount})`}</button>
          </div> : <div className="text-[8px] font-semibold uppercase tracking-wider text-[#94A3B8]">{crmTab === 'intent' ? 'Live campaign activity' : crmTab === 'inbox' ? `${unreadCount} unread conversations` : crmTab === 'tasks' ? 'Due and upcoming work' : crmTab === 'contacts' ? 'Enriched stakeholder directory' : 'High-intent and tender-stage leads'}</div>}
          <label className="flex items-center gap-2 text-[9px] font-semibold text-[#64748B]">
            <Icon name="users" size={13} />
            <span className="hidden sm:inline">Assigned to</span>
            <select value={assignee} onChange={(event) => setAssignee(event.target.value)} className="rounded-md border border-[#DCE4F0] bg-white px-3 py-2 text-[9px] font-semibold text-[#52627A] outline-none">
              <option>All assignees</option>
              <option>Emily Rhodes</option>
              <option>James Wilkins</option>
              <option>Unassigned</option>
            </select>
          </label>
        </div>
      </section>
      {lastAction && <div className="mb-4 flex items-center justify-between rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-2.5 text-[9px] font-medium text-[#1D4ED8]"><span>{lastAction}</span><button onClick={() => setLastAction('')} aria-label="Dismiss notification"><Icon name="close" size={12} /></button></div>}
      {crmStatus === 'loading' && <LoadingBlock label="Loading the CRM" />}
      {crmStatus === 'error' && <EmptyState kind="error" title="The pipeline could not be loaded." action={{ label: 'Try again', onClick: () => window.location.reload() }} />}
      {crmTab === 'pipeline' && crmStatus === 'ready' && cards.length === 0 && <EmptyState icon="briefcase" title="The pipeline is empty." action={{ label: 'Run your first planning search', onClick: () => onNavigate?.('Planning search') }} />}
      {crmTab === 'pipeline' && crmStatus === 'ready' && cards.length > 0 && visibleCards.length === 0 && <EmptyState kind="filtered" icon="filter" title="No opportunities match this filter." action={{ label: 'Clear filter', onClick: () => { setAssignee('All assignees'); setPipelineView('active') } }} />}
      {crmTab === 'pipeline' && crmStatus === 'ready' && visibleCards.length > 0 && <div className="grid min-w-[1180px] grid-cols-5 gap-3 overflow-x-auto pb-4">
        {columns.map((column, stage) => <div key={column} className="rounded-xl bg-[#EAEFF7] p-2.5">
          <div className="flex items-center justify-between px-1 py-2"><span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#52627A]">{column}</span><span className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-[8px] font-bold text-[#64748B]">{visibleCards.filter((card) => card.stage === stage).length}</span></div>
          <div className="mt-1 space-y-2.5">
            {visibleCards.filter((card) => card.stage === stage).map((card) => <article key={card.id} className="rounded-lg border border-[#DCE4F0] bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between"><div className="grid h-8 w-8 place-items-center rounded-full bg-[#DBEAFE] text-[8px] font-bold text-[#1D4ED8]">{card.person.split(' ').map((n) => n[0]).join('')}</div><span className="font-display text-[11px] font-semibold">{card.value}</span></div>
              <button onClick={() => openScheme(card)} className="mt-3 text-left"><div className="text-[10px] font-semibold text-[#1E293B]">{card.person}</div><div className="mt-1 text-[8px] text-[#94A3B8]">{card.firm}</div><div className="mt-2 text-[9px] text-[#64748B]">{card.scheme}</div></button>
              {card.opens >= 3 && <div className="mt-3 rounded-md bg-[#FFF7ED] px-2 py-1.5 text-[8px] font-bold text-[#C2410C]">Opened {card.opens}× · priority signal</div>}
              <div className="mt-3 flex items-center gap-2 text-[8px] text-[#64748B]">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-[#EDE9FE] text-[7px] font-bold text-[#6D28D9]">{card.assignee === 'Unassigned' ? '—' : card.assignee.split(' ').map((name) => name[0]).join('')}</span>
                <span>Assigned to <b className="font-semibold text-[#334155]">{card.assignee}</b></span>
              </div>
              <div className="mt-3 grid grid-cols-5 gap-1.5 border-t border-[#EEF2F7] pt-3">
                <button disabled={!canWrite} onClick={() => openAction('email', card)} title="Send email" aria-label={`Send email to ${card.person}`} className="grid h-7 place-items-center rounded-md bg-[#F8FAFD] text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#2563EB] disabled:cursor-not-allowed disabled:opacity-40"><Icon name="mail" size={12} /></button>
                <button disabled={!canWrite} onClick={() => openAction('call', card)} title="Log call" aria-label={`Log call with ${card.person}`} className="grid h-7 place-items-center rounded-md bg-[#F8FAFD] text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#2563EB] disabled:cursor-not-allowed disabled:opacity-40"><Icon name="phone" size={12} /></button>
                <button disabled={!canWrite} onClick={() => openAction('task', card)} title="Add follow-up task" aria-label={`Add follow-up task for ${card.person}`} className="grid h-7 place-items-center rounded-md bg-[#F8FAFD] text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#2563EB] disabled:cursor-not-allowed disabled:opacity-40"><Icon name="calendar" size={12} /></button>
                <button disabled={!canWrite} onClick={() => openAction('note', card)} title="Add note" aria-label={`Add note for ${card.person}`} className="grid h-7 place-items-center rounded-md bg-[#F8FAFD] text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#2563EB] disabled:cursor-not-allowed disabled:opacity-40"><Icon name="note" size={12} /></button>
                <button disabled={!canWrite} onClick={() => archive(card)} title={card.archived ? 'Restore opportunity' : 'Archive stalled opportunity'} aria-label={`${card.archived ? 'Restore' : 'Archive'} ${card.person}`} className={`grid h-7 place-items-center rounded-md disabled:cursor-not-allowed disabled:opacity-40 ${card.archived ? 'bg-[#ECFDF5] text-[#15803D]' : 'bg-[#F8FAFD] text-[#94A3B8] hover:bg-[#FEF2F2] hover:text-[#B91C1C]'}`}><Icon name="archive" size={12} /></button>
              </div>
              {!card.archived && <div className="mt-2 flex justify-between"><button disabled={!canWrite || stage === 0} onClick={() => move(card.id, -1)} className="text-[8px] font-semibold text-[#94A3B8] disabled:cursor-not-allowed disabled:opacity-20">← Back</button><button disabled={!canWrite || stage === 4} onClick={() => move(card.id, 1)} className="text-[8px] font-semibold text-[#2563EB] disabled:cursor-not-allowed disabled:opacity-20">Advance →</button></div>}
            </article>)}
          </div>
        </div>)}
      </div>}
      {crmTab === 'intent' && crmStatus === 'ready' && cards.filter((card) => assignee === 'All assignees' || card.assignee === assignee).length === 0 && <EmptyState kind={assignee === 'All assignees' ? 'empty' : 'filtered'} icon="signal" title={assignee === 'All assignees' ? 'No intent signals yet.' : 'No intent for this assignee.'} action={assignee === 'All assignees' ? { label: 'Create a campaign', onClick: () => onNavigate?.('Campaigns') } : { label: 'Clear filter', onClick: () => setAssignee('All assignees') }} />}
      {crmTab === 'intent' && crmStatus === 'ready' && cards.filter((card) => assignee === 'All assignees' || card.assignee === assignee).length > 0 && <div className="overflow-hidden rounded-xl border border-[#DCE4F0] bg-white">
        {cards.filter((card) => assignee === 'All assignees' || card.assignee === assignee).map((card, index) => (
          <div key={card.id} className="flex items-start gap-4 border-t border-[#EEF2F7] p-4 first:border-0">
            <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${card.opens >= 3 ? 'bg-[#FFF7ED] text-[#C2410C]' : 'bg-[#EFF6FF] text-[#2563EB]'}`}><Icon name={card.opens >= 5 ? 'external' : 'mail'} size={14} /></div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-[10px]"><b className="font-semibold text-[#1E293B]">{card.person}</b><span className="text-[#94A3B8]">from {card.firm}</span>{card.opens >= 3 && <span className="rounded-full bg-[#FFF7ED] px-2 py-1 text-[7px] font-bold text-[#C2410C]">HIGH INTENT</span>}</div>
              <div className="mt-1.5 text-[9px] text-[#64748B]">{card.opens >= 5 ? `Viewed the capability deck and opened the email ${card.opens} times` : `Opened campaign email ${card.opens} time${card.opens === 1 ? '' : 's'}`}</div>
              <button onClick={() => openScheme(card)} className="mt-2 text-[8px] font-semibold text-[#2563EB]">{card.scheme} · View dossier</button>
            </div>
            <div className="text-right"><div className="text-[8px] text-[#94A3B8]">{index < 2 ? `${index * 12 + 3}m ago` : `${index}h ago`}</div><div className="mt-2 text-[8px] text-[#64748B]">{card.assignee}</div></div>
          </div>
        ))}
      </div>}
      {crmTab === 'inbox' && crmStatus === 'ready' && conversations.length === 0 && <EmptyState icon="mail" title="The inbox is empty." action={{ label: 'Create a campaign', onClick: () => onNavigate?.('Campaigns') }} />}
      {crmTab === 'inbox' && selectedMessage && <div className="grid min-h-[560px] overflow-hidden rounded-xl border border-[#DCE4F0] bg-white lg:grid-cols-[310px_1fr]">
        <aside className="border-b border-[#E2E8F0] lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-[#EEF2F7] p-4"><div><div className="text-[10px] font-semibold text-[#334155]">All conversations</div><div className="mt-1 text-[8px] text-[#94A3B8]">{unreadCount} unread across 12 inboxes</div></div><button onClick={() => { setConversations((items) => items.map((item) => ({ ...item, unread: false }))); setInboxUnread(0); void api.markAllRead() }} className="text-[8px] font-semibold text-[#2563EB]">Mark all read</button></div>
          <div className="max-h-[500px] overflow-y-auto">{conversations.map((card) => {
            const unread = card.unread
            return <button key={card.id} onClick={() => openConversation(card.id)} className={`flex w-full gap-3 border-b border-[#EEF2F7] p-4 text-left transition ${selectedConversation === card.id ? 'bg-[#EFF6FF]' : 'hover:bg-[#F8FAFD]'}`}>
              <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#DBEAFE] text-[8px] font-bold text-[#1D4ED8]">{card.person.split(' ').map((name) => name[0]).join('').slice(0, 2)}{unread && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#2563EB]" />}</div>
              <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className={`truncate text-[9px] ${unread ? 'font-bold text-[#1E293B]' : 'font-semibold text-[#52627A]'}`}>{card.person}</span><span className="shrink-0 text-[7px] text-[#94A3B8]">{card.timeLabel}</span></div><div className="mt-1 truncate text-[8px] font-medium text-[#64748B]">{card.subject}</div><div className="mt-1 truncate text-[8px] text-[#94A3B8]">{card.preview}</div></div>
            </button>
          })}</div>
        </aside>
        <section className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEF2F7] px-5 py-4"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-[#DBEAFE] text-[9px] font-bold text-[#1D4ED8]">{selectedMessage.person.split(' ').map((name) => name[0]).join('').slice(0, 2)}</div><div><div className="text-[10px] font-semibold text-[#334155]">{selectedMessage.person}</div><div className="mt-1 text-[8px] text-[#94A3B8]">{selectedMessage.firm} · {selectedMessage.assignee}</div></div></div><div className="flex gap-2"><button onClick={() => { setConversations((items) => items.map((item) => item.id === selectedMessage.id ? { ...item, unread: true } : item)); void api.markUnread(selectedMessage.id) }} className="rounded-md border border-[#DCE4F0] px-3 py-2 text-[8px] font-semibold text-[#64748B]">Mark unread</button><button onClick={() => { const lead = cards.find((card) => card.id === selectedMessage.crmLeadId); if (lead) archive(lead) }} className="grid h-8 w-8 place-items-center rounded-md border border-[#DCE4F0] text-[#64748B]" title="Archive conversation"><Icon name="archive" size={12} /></button></div></div>
          <div className="flex-1 space-y-5 overflow-y-auto bg-[#F8FAFD] p-5">
            {selectedMessage.messages.map((message) => message.direction === 'outbound' ? (
              <div key={message.id} className="flex justify-end"><div className="max-w-[82%] rounded-xl rounded-tr-sm bg-[#172554] p-4 text-white"><div className="text-[8px] font-semibold text-[#38BDF8]">{message.senderName} · {message.timeLabel}{message.deliveryStatus === 'stubbed' ? ' · not sent' : ''}</div><p className="mt-2 text-[9px] leading-relaxed text-white/75">{message.body}</p></div></div>
            ) : (
              <div key={message.id} className="flex justify-start"><div className="max-w-[82%] rounded-xl rounded-tl-sm border border-[#DCE4F0] bg-white p-4"><div className="text-[8px] font-semibold text-[#2563EB]">{message.senderName} · {message.timeLabel}</div><p className="mt-2 text-[9px] leading-relaxed text-[#52627A]">{message.body}</p></div></div>
            ))}
          </div>
          <div className="border-t border-[#E2E8F0] bg-white p-4"><textarea value={replyText} onChange={(event) => setReplyText(event.target.value)} rows={3} className="w-full resize-none rounded-lg border border-[#DCE4F0] p-3 text-[9px] leading-relaxed text-[#52627A] outline-none focus:border-[#2563EB]" placeholder={`Reply to ${selectedMessage.person}…`} /><div className="mt-2 flex items-center justify-between"><div className="flex gap-1"><button onClick={() => notify('Attachment picker opened')} className="grid h-8 w-8 place-items-center rounded-md bg-[#F1F5F9] text-[#64748B]" title="Attach file"><Icon name="briefcase" size={12} /></button><button onClick={() => { const lead = cards.find((card) => card.id === selectedMessage.crmLeadId); if (lead) openAction('task', lead) }} className="grid h-8 w-8 place-items-center rounded-md bg-[#F1F5F9] text-[#64748B]" title="Create follow-up"><Icon name="calendar" size={12} /></button></div><button disabled={!replyText.trim()} onClick={sendReply} className="flex items-center gap-2 rounded-lg bg-[#172554] px-4 py-2.5 text-[9px] font-semibold text-white disabled:bg-[#CBD5E1]"><Icon name="send" size={12} /> Send reply</button></div></div>
        </section>
      </div>}
      {crmTab === 'tasks' && crmStatus === 'ready' && cards.filter((card) => card.opens >= 3 && !doneTasks.includes(card.id) && (assignee === 'All assignees' || card.assignee === assignee)).length === 0 && <EmptyState kind={assignee === 'All assignees' ? 'empty' : 'filtered'} icon="calendar" title={assignee === 'All assignees' ? 'No tasks are waiting.' : 'No tasks for this assignee.'} action={assignee === 'All assignees' ? { label: 'Open the pipeline', onClick: () => setCrmTab('pipeline') } : { label: 'Clear filter', onClick: () => setAssignee('All assignees') }} />}
      {crmTab === 'tasks' && crmStatus === 'ready' && cards.filter((card) => card.opens >= 3 && !doneTasks.includes(card.id) && (assignee === 'All assignees' || card.assignee === assignee)).length > 0 && <div className="grid gap-3 lg:grid-cols-2">
        {cards.filter((card) => card.opens >= 3 && !doneTasks.includes(card.id) && (assignee === 'All assignees' || card.assignee === assignee)).map((card, index) => (
          <article key={card.id} className="rounded-xl border border-[#DCE4F0] bg-white p-4">
            <div className="flex items-start justify-between gap-3"><div className="flex gap-3"><span className={`grid h-9 w-9 place-items-center rounded-lg ${index < 2 ? 'bg-[#FEF2F2] text-[#B91C1C]' : 'bg-[#EFF6FF] text-[#2563EB]'}`}><Icon name={index % 2 ? 'phone' : 'calendar'} size={14} /></span><div><div className="text-[10px] font-semibold text-[#1E293B]">{index % 2 ? 'Priority follow-up call' : 'Review engagement and respond'}</div><div className="mt-1 text-[8px] text-[#94A3B8]">{card.person} · {card.firm}</div></div></div><span className={`rounded-full px-2 py-1 text-[7px] font-bold ${index < 2 ? 'bg-[#FEF2F2] text-[#B91C1C]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>{index < 2 ? 'DUE TODAY' : 'UPCOMING'}</span></div>
            <div className="mt-4 flex items-center justify-between border-t border-[#EEF2F7] pt-3"><span className="text-[8px] text-[#64748B]">Assigned to <b>{card.assignee}</b></span><div className="flex gap-2"><button onClick={() => openAction(index % 2 ? 'call' : 'task', card)} className="rounded-md border border-[#DCE4F0] px-2.5 py-1.5 text-[8px] font-semibold text-[#52627A]">Open</button><button onClick={() => { void api.createActivity({ type: 'task', crmLeadId: card.id, applicationRef: card.schemeId, title: index % 2 ? 'Priority follow-up call' : 'Review engagement and respond', body: 'Completed from the task queue' }).then((activity) => api.completeActivity(activity.id, true)).then(() => { setDoneTasks((ids) => [...ids, card.id]); setLastAction(`Task completed for ${card.person}`) }).catch(() => notify('Could not complete that task')) }} className="rounded-md bg-[#172554] px-2.5 py-1.5 text-[8px] font-semibold text-white">Complete</button></div></div>
          </article>
        ))}
      </div>}
      {crmTab === 'opportunities' && crmStatus === 'ready' && cards.filter((card) => card.stage >= 2 && !card.archived && (assignee === 'All assignees' || card.assignee === assignee)).length === 0 && <EmptyState kind={assignee === 'All assignees' ? 'empty' : 'filtered'} icon="spark" title={assignee === 'All assignees' ? 'No qualified opportunities yet.' : 'No opportunities for this assignee.'} action={assignee === 'All assignees' ? { label: 'Run your first planning search', onClick: () => onNavigate?.('Planning search') } : { label: 'Clear filter', onClick: () => setAssignee('All assignees') }} />}
      {crmTab === 'opportunities' && crmStatus === 'ready' && cards.filter((card) => card.stage >= 2 && !card.archived && (assignee === 'All assignees' || card.assignee === assignee)).length > 0 && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.filter((card) => card.stage >= 2 && !card.archived && (assignee === 'All assignees' || card.assignee === assignee)).map((card) => (
          <article key={card.id} className="rounded-xl border border-[#DCE4F0] bg-white p-5">
            <div className="flex items-center justify-between"><span className="rounded-full bg-[#ECFDF5] px-2.5 py-1 text-[7px] font-bold text-[#15803D]">{columns[card.stage]}</span><b className="font-display text-[14px]">{card.value}</b></div>
            <h3 className="mt-4 font-display text-[13px] font-semibold">{card.scheme}</h3><p className="mt-1 text-[9px] text-[#64748B]">{card.person} · {card.firm}</p>
            <div className="mt-4 flex items-center justify-between border-t border-[#EEF2F7] pt-3"><span className="text-[8px] text-[#94A3B8]">{card.assignee}</span><button onClick={() => openScheme(card)} className="flex items-center gap-1 text-[8px] font-semibold text-[#2563EB]">Open opportunity <Icon name="arrow" size={10} /></button></div>
          </article>
        ))}
      </div>}
      {crmTab === 'contacts' && <Contacts data={data} embedded crmCards={cards} assignee={assignee} onCrmAction={openAction} />}
      {crmAction && <div className="fixed inset-0 z-[80] grid place-items-center bg-[#0F172A]/55 p-4" onMouseDown={() => setCrmAction(null)}>
        <form onSubmit={(event) => { event.preventDefault(); completeAction() }} onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between"><div><div className="text-[9px] font-bold uppercase tracking-wider text-[#2563EB]">CRM activity</div><h3 className="mt-2 font-display text-xl font-semibold">{crmAction.type === 'email' ? 'Compose email' : crmAction.type === 'call' ? 'Log call outcome' : crmAction.type === 'task' ? 'Schedule follow-up' : 'Add internal note'}</h3><p className="mt-1 text-[9px] text-[#94A3B8]">{crmAction.card.person} · {crmAction.card.firm}</p></div><button type="button" onClick={() => setCrmAction(null)} className="grid h-8 w-8 place-items-center rounded-full bg-[#F1F5F9] text-[#64748B]"><Icon name="close" size={14} /></button></div>
          {crmAction.type === 'task' && <label className="mt-6 block text-[9px] font-bold uppercase tracking-wider text-[#64748B]">Due date<input type="date" defaultValue={new Date(Date.now() + 86400000).toISOString().slice(0, 10)} className="mt-2 w-full rounded-lg border border-[#DCE4F0] px-3 py-3 text-[10px] font-normal normal-case tracking-normal outline-none" /></label>}
          {crmAction.type === 'call' && <label className="mt-6 block text-[9px] font-bold uppercase tracking-wider text-[#64748B]">Outcome<select className="mt-2 w-full rounded-lg border border-[#DCE4F0] bg-white px-3 py-3 text-[10px] font-normal normal-case tracking-normal outline-none"><option>Connected — follow-up required</option><option>Voicemail left</option><option>No answer</option><option>Meeting agreed</option><option>Not interested</option></select></label>}
          <label className="mt-4 block text-[9px] font-bold uppercase tracking-wider text-[#64748B]">{crmAction.type === 'email' ? 'Subject and message' : 'Details'}<textarea required value={actionText} onChange={(event) => setActionText(event.target.value)} rows={5} className="mt-2 w-full resize-none rounded-lg border border-[#DCE4F0] p-3 text-[10px] font-normal leading-relaxed normal-case tracking-normal outline-none focus:border-[#2563EB]" placeholder={crmAction.type === 'note' ? 'Add context for the account team…' : 'Add activity details…'} /></label>
          <div className="mt-6 flex gap-3"><button type="button" onClick={() => setCrmAction(null)} className="flex-1 rounded-lg border border-[#DCE4F0] py-3 text-[9px] font-semibold text-[#64748B]">Cancel</button><button type="submit" className="flex-1 rounded-lg bg-[#172554] py-3 text-[9px] font-semibold text-white">{crmAction.type === 'email' ? 'Queue email' : crmAction.type === 'task' ? 'Create task' : 'Save activity'}</button></div>
        </form>
      </div>}
    </>
  )
}

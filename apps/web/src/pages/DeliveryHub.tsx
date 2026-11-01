import { useEffect, useState } from 'react'
import { PUBLIC_EMAIL } from '@planningpal/shared'
import { EmptyState, LoadingBlock } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { PageIntro } from '../components/PageIntro'
import { api } from '../lib/api'
import { notify } from '../lib/notify'

type Meeting = { when: string; firm: string; scheme: string; kind: string }
type Delivery = { meetings?: Meeting[]; leads?: string; contacted?: string; booked?: string }

export function DeliveryHub({ onNavigate }: { onNavigate?: (screen: string) => void }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [delivery, setDelivery] = useState<Delivery>({})
  useEffect(() => {
    void api.delivery().then((payload) => {
      setDelivery(payload as Delivery)
      setStatus('ready')
    }).catch(() => setStatus('error'))
  }, [])
  const meetings = delivery.meetings ?? []
  const hasLive = meetings.length > 0 || Boolean(delivery.leads || delivery.contacted || delivery.booked)
  return (
    <>
      <PageIntro eyebrow="Team Plan" title="Service delivery hub" description="Track contractual delivery, booked meetings and the work still to do this period." />
      {status === 'loading' && <LoadingBlock label="Loading delivery" />}
      {status === 'error' && <EmptyState kind="error" title="Delivery figures could not be loaded." action={{ label: 'Try again', onClick: () => window.location.reload() }} />}
      {status === 'ready' && !hasLive && (
        <EmptyState
          icon="calendar"
          title="Delivery tracking starts after the first leads land."
          action={{ label: 'Set up your ICP', onClick: () => onNavigate?.('Workspace setup') }}
          sample={<div className="text-[12px] text-[#334155]"><b>20 Jun · 10:30</b> Discovery call · Northbank Studio</div>}
        />
      )}
      {status === 'ready' && hasLive && (
        <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-xl border border-[#DCE4F0] bg-white p-5">
            <h3 className="font-display text-[14px] font-semibold">Upcoming meetings</h3>
            {meetings.length === 0 && <div className="mt-4"><EmptyState icon="calendar" title="No meetings are booked yet." action={{ label: 'Open the pipeline', onClick: () => onNavigate?.('CRM & intent') }} /></div>}
            <div className="mt-4">{meetings.map((meeting) => <div key={`${meeting.when}-${meeting.firm}`} className="grid gap-3 border-t border-[#EEF2F7] py-4 first:border-0 sm:grid-cols-[110px_1fr_auto]"><div className="text-[9px] font-semibold text-[#2563EB]">{meeting.when}</div><div><div className="text-[10px] font-semibold">{meeting.firm}</div><div className="mt-1 text-[8px] text-[#94A3B8]">{meeting.scheme}</div></div><span className="w-fit rounded-full bg-[#F1F5F9] px-2 py-1 text-[8px] text-[#64748B]">{meeting.kind}</span></div>)}</div>
          </div>
          <div className="rounded-xl border border-[#DCE4F0] bg-white p-5">
            <div className="text-[9px] font-bold uppercase tracking-wider text-[#94A3B8]">This period</div>
            <div className="mt-4 space-y-3 text-[12px] text-[#334155]">
              <div>Leads <b>{delivery.leads ?? '—'}</b></div>
              <div>Contacted <b>{delivery.contacted ?? '—'}</b></div>
              <div>Meetings <b>{delivery.booked ?? '—'}</b></div>
            </div>
            <a href={`mailto:${PUBLIC_EMAIL}`} className="mt-5 flex items-center gap-2 rounded-lg bg-[#F8FAFD] p-3 text-[9px] font-semibold text-[#52627A]"><Icon name="mail" size={13} /> Message the account team</a>
            <button type="button" onClick={() => notify('Account review request sent')} className="mt-2 flex w-full items-center gap-2 rounded-lg bg-[#EFF6FF] p-3 text-[9px] font-semibold text-[#1D4ED8]"><Icon name="calendar" size={13} /> Book account review</button>
          </div>
        </div>
      )}
    </>
  )
}

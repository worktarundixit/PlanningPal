import { useEffect, useState } from 'react'
import { EmptyState, LoadingBlock } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { PageIntro } from '../components/PageIntro'
import { api } from '../lib/api'
import { notify } from '../lib/notify'

type Invoice = { date: string; number: string; amount: string; status: string }
type BillingAccount = { plan?: string; price?: string; company?: string; invoices?: Invoice[] }

export function Billing() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [account, setAccount] = useState<BillingAccount>({})
  useEffect(() => {
    void api.billing().then((payload) => {
      setAccount(payload as BillingAccount)
      setStatus('ready')
    }).catch(() => setStatus('error'))
  }, [])
  const invoices = account.invoices ?? []
  return (
    <>
      <PageIntro eyebrow="Account billing" title="Billing & subscription" description={`Manage ${account.company || 'your workspace'} subscription, payment method and invoice history.`} action={<button onClick={() => notify('Billing support request opened')} className="rounded-lg border border-[#DCE4F0] bg-white px-4 py-2.5 text-[9px] font-semibold text-[#52627A]">Contact billing support</button>} />
      {status === 'loading' && <LoadingBlock label="Loading billing" />}
      {status === 'error' && <EmptyState kind="error" title="Billing could not be loaded." action={{ label: 'Try again', onClick: () => window.location.reload() }} />}
      {status === 'ready' && (
        <>
          <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
            <div className="rounded-xl bg-[#172554] p-6 text-white">
              <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#38BDF8]">Current subscription</div>
              <h3 className="mt-3 font-display text-[24px] font-semibold">{account.plan || 'No plan yet'}</h3>
              <p className="mt-2 max-w-md text-[10px] leading-relaxed text-white/50">{account.company || 'Your workspace'} · {account.price || 'Price not set'}</p>
            </div>
            <EmptyState icon="briefcase" title="No payment method is saved yet." action={{ label: 'Contact billing support', onClick: () => notify('Billing support request opened') }} />
          </div>
          <div className="mt-5 overflow-hidden rounded-xl border border-[#DCE4F0] bg-white">
            <div className="border-b border-[#EEF2F7] px-5 py-4"><h3 className="font-display text-[14px] font-semibold">Invoice history</h3></div>
            {invoices.length === 0 && <div className="p-5"><EmptyState icon="download" title="No invoices have been issued yet." sample={<div className="text-[12px] text-[#334155]">01 Jun · INV-0001 · £99 · Paid</div>} /></div>}
            {invoices.map((invoice) => <div key={invoice.number} className="grid items-center gap-3 border-t border-[#EEF2F7] px-5 py-4 sm:grid-cols-[1fr_1fr_120px_100px_auto]"><div className="text-[9px] font-medium text-[#52627A]">{invoice.date}</div><div className="text-[9px] font-semibold text-[#334155]">{invoice.number}</div><div className="text-[9px] font-semibold">{invoice.amount}</div><span className="w-fit rounded-full bg-[#F1F5F9] px-2.5 py-1 text-[7px] font-bold text-[#52627A]">{invoice.status}</span><button onClick={() => notify(`${invoice.number} downloaded`)} className="flex items-center gap-2 rounded-md bg-[#F1F5F9] px-3 py-2 text-[8px] font-semibold text-[#52627A]"><Icon name="download" size={11} /> Download</button></div>)}
          </div>
        </>
      )}
    </>
  )
}

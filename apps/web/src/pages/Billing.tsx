import { Icon } from '../components/Icon'
import { PageIntro } from '../components/PageIntro'
import { notify } from '../lib/notify'

export function Billing() {
  const invoices = [['01 Jun 2025', 'INV-2025-0601', '£2,950', 'Paid'], ['01 May 2025', 'INV-2025-0501', '£2,950', 'Paid'], ['01 Apr 2025', 'INV-2025-0401', '£2,950', 'Paid']]
  return (
    <>
      <PageIntro eyebrow="Account billing" title="Billing & subscription" description="Manage Micraft Design Ltd’s PlanningPal subscription, payment method and invoice history." action={<button onClick={() => notify('Billing support request opened')} className="rounded-lg border border-[#DCE4F0] bg-white px-4 py-2.5 text-[9px] font-semibold text-[#52627A]">Contact billing support</button>} />
      <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-xl bg-[#172554] p-6 text-white">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div><div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#38BDF8]">Current subscription</div><h3 className="mt-3 font-display text-[24px] font-semibold">Team Plan</h3><p className="mt-2 max-w-md text-[10px] leading-relaxed text-white/50">Planning intelligence, CRM, intent tracking, campaigns and team collaboration for Micraft Design Ltd.</p></div>
            <div className="sm:text-right"><div className="font-display text-[28px] font-semibold">£2,950</div><div className="mt-1 text-[9px] text-white/40">per month · VAT excluded</div></div>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 sm:grid-cols-4">{[['01 Jul 2025', 'Next invoice'], ['Monthly', 'Billing cycle'], ['Active', 'Plan status'], ['3 included', 'Team seats']].map(([value, label]) => <div key={label}><div className="text-[11px] font-semibold">{value}</div><div className="mt-1 text-[8px] text-white/35">{label}</div></div>)}</div>
        </div>
        <div className="rounded-xl border border-[#DCE4F0] bg-white p-6">
          <div className="flex items-start justify-between"><div><div className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">Payment method</div><div className="mt-3 flex items-center gap-3"><div className="grid h-10 w-14 place-items-center rounded-lg bg-[#172554] text-[9px] font-bold italic text-white">VISA</div><div><div className="text-[10px] font-semibold text-[#334155]">Visa ending in 4821</div><div className="mt-1 text-[8px] text-[#94A3B8]">Expires 08/28</div></div></div></div><span className="rounded-full bg-[#ECFDF5] px-2.5 py-1 text-[7px] font-bold text-[#15803D]">DEFAULT</span></div>
          <button onClick={() => notify('Payment method editor opened')} className="mt-6 w-full rounded-lg border border-[#DCE4F0] py-3 text-[9px] font-semibold text-[#2563EB]">Update payment method</button>
        </div>
      </div>
      <div className="mt-5 overflow-hidden rounded-xl border border-[#DCE4F0] bg-white">
        <div className="flex items-center justify-between border-b border-[#EEF2F7] px-5 py-4"><div><h3 className="font-display text-[14px] font-semibold">Invoice history</h3><p className="mt-1 text-[8px] text-[#94A3B8]">Download invoices and payment receipts</p></div><span className="text-[8px] text-[#94A3B8]">All amounts exclude VAT</span></div>
        {invoices.map(([date, invoice, amount, status]) => <div key={invoice} className="grid items-center gap-3 border-t border-[#EEF2F7] px-5 py-4 first:border-0 sm:grid-cols-[1fr_1fr_120px_100px_auto]"><div className="text-[9px] font-medium text-[#52627A]">{date}</div><div className="text-[9px] font-semibold text-[#334155]">{invoice}</div><div className="text-[9px] font-semibold">{amount}</div><span className="w-fit rounded-full bg-[#ECFDF5] px-2.5 py-1 text-[7px] font-bold text-[#15803D]">{status}</span><button onClick={() => notify(`${invoice} downloaded`)} className="flex items-center gap-2 rounded-md bg-[#F1F5F9] px-3 py-2 text-[8px] font-semibold text-[#52627A]"><Icon name="download" size={11} /> Download</button></div>)}
      </div>
    </>
  )
}

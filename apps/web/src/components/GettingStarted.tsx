import type { ClientOnboarding } from '../lib/api'
import { EmptyState } from './EmptyState'
import { Icon } from './Icon'

export function GettingStarted({
  items,
  onDismiss,
}: {
  items: { id: string; label: string; done: boolean; skipped: boolean }[]
  onDismiss: () => void
}) {
  return (
    <section className="mb-5 rounded-xl border border-[#DCE4F0] bg-white p-4 shadow-[0_1px_2px_rgba(30,58,138,0.04)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2563EB]">Getting started</div>
          <h2 className="mt-1 font-display text-[17px] font-semibold tracking-[-0.02em]">Your workspace is ready</h2>
          <p className="mt-1 text-[12px] leading-relaxed text-[#52627A]">These are the choices from setup. You can change them later in Workspace setup.</p>
        </div>
        <button type="button" onClick={onDismiss} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#F1F5F9] text-[#64748B]" aria-label="Dismiss getting started">
          <Icon name="close" size={13} />
        </button>
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 rounded-lg border border-[#E2E8F0] px-3 py-2.5">
            <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${item.done ? 'bg-[#16A34A] text-white' : 'bg-[#F1F5F9] text-[#64748B]'}`}>{item.done ? '✓' : '–'}</span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-[#172033]">{item.label}</span>
              {item.skipped && <span className="text-[11px] text-[#64748B]">Skipped for now</span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function ClientOnboardingList({ clients }: { clients: ClientOnboarding[] }) {
  return (
    <section className="mb-5 rounded-xl border border-[#DCE4F0] bg-white p-4 shadow-[0_1px_2px_rgba(30,58,138,0.04)] sm:p-5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2563EB]">Hitcaliber</div>
      <h2 className="mt-1 font-display text-[17px] font-semibold tracking-[-0.02em]">Client onboarding</h2>
      <p className="mt-1 text-[12px] leading-relaxed text-[#52627A]">Setup progress for each workspace. This list is staff-only and every view is audited.</p>
      <ul className="mt-4 divide-y divide-[#EEF2F7]">
        {clients.map((client) => (
          <li key={client.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[13px] font-semibold">{client.name}</div>
              <div className="text-[11px] text-[#64748B]">{client.planName}{client.coverage ? ` · ${client.coverage.replaceAll('_', ' ')}` : ''}</div>
            </div>
            <span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${client.finished ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#FEF3C7] text-[#92400E]'}`}>
              {client.finished ? 'Finished' : client.step.replaceAll('_', ' ')}
            </span>
          </li>
        ))}
        {!clients.length && <li className="py-3"><EmptyState icon="building" title="No client workspaces yet." /></li>}
      </ul>
    </section>
  )
}

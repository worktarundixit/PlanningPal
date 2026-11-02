import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

type Kind = 'empty' | 'filtered' | 'error'

const kindLabel: Record<Kind, string> = {
  empty: 'Nothing here yet',
  filtered: 'No matches',
  error: 'Something went wrong',
}

export function EmptyState({
  kind = 'empty',
  icon = 'spark',
  title,
  action,
  sample,
}: {
  kind?: Kind
  icon?: IconName
  title: string
  action?: { label: string; onClick: () => void }
  sample?: ReactNode
}) {
  const error = kind === 'error'
  return (
    <div role="status" className="rounded-xl border border-dashed border-[#DCE4F0] bg-white px-5 py-8 text-center sm:px-8">
      <div className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl ${error ? 'bg-[#FEF2F2] text-[#B91C1C]' : 'bg-[#EFF6FF] text-[#1D4ED8]'}`}>
        <Icon name={error ? 'close' : icon} size={22} />
      </div>
      <div className="mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">{kindLabel[kind]}</div>
      <p className="mx-auto mt-2 max-w-md text-[13px] font-medium leading-relaxed text-[#172033]">{title}</p>
      {action && (
        <button type="button" onClick={action.onClick} className="mt-5 inline-flex items-center justify-center rounded-lg bg-[#172554] px-4 py-2.5 text-[12px] font-semibold text-white hover:bg-[#1E3A8A]">
          {action.label}
        </button>
      )}
      {sample && (
        <div className="mx-auto mt-6 max-w-lg rounded-xl border border-[#E2E8F0] bg-[#F8FAFD] p-4 text-left">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#2563EB]">Sample preview</div>
          <div className="pointer-events-none mt-3 select-none opacity-80">{sample}</div>
        </div>
      )}
    </div>
  )
}

export function LoadingBlock({ label = 'Loading' }: { label?: string }) {
  return (
    <div aria-busy="true" aria-label={label} className="grid gap-3">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl bg-white" />)}
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-white" />
    </div>
  )
}

export function SampleBars() {
  return (
    <div className="flex h-16 items-end gap-1.5">
      {[28, 46, 34, 62, 48, 80, 70].map((height, index) => (
        <div key={index} className="flex-1 rounded-t bg-[#93C5FD]" style={{ height: `${height}%` }} />
      ))}
    </div>
  )
}

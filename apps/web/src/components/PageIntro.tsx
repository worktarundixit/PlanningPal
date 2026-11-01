import type { ReactNode } from 'react'

export function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#2563EB]">{eyebrow}</div>
        <h2 className="mt-2 font-display text-[24px] font-semibold tracking-[-0.03em] text-[#172033]">{title}</h2>
        <p className="mt-1.5 max-w-2xl text-[11px] leading-relaxed text-[#718096]">{description}</p>
      </div>
      {action}
    </div>
  )
}

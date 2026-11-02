type Kind = 'missing' | 'error' | 'offline' | 'forbidden' | 'session'

const copy: Record<Kind, { eyebrow: string; title: string; body: string }> = {
  missing: {
    eyebrow: '404',
    title: 'This page is not on PlanningPal',
    body: 'The link may be out of date. Head back to the site or the command centre.',
  },
  error: {
    eyebrow: '500',
    title: 'Something went wrong',
    body: 'The page could not be shown. Nothing on your account was changed. Try again in a moment.',
  },
  offline: {
    eyebrow: 'Offline',
    title: 'PlanningPal cannot reach the network',
    body: 'Check your connection, then reload. Your saved work stays in the workspace.',
  },
  forbidden: {
    eyebrow: '403',
    title: 'You do not have access',
    body: 'This area is limited to another role. Ask an owner or admin if you need it.',
  },
  session: {
    eyebrow: 'Session',
    title: 'Your session has expired',
    body: 'Sign in again to open the command centre.',
  },
}

export function StatusScreen({ kind, onRetry }: { kind: Kind; onRetry?: () => void }) {
  const item = copy[kind]
  return (
    <div className="grid min-h-screen place-items-center bg-[#F4F7FB] px-6 text-[#172033]">
      <div className="w-full max-w-md rounded-2xl border border-[#DCE4F0] bg-white p-8 text-center shadow-[0_12px_40px_rgba(23,37,84,0.06)]">
        <img src="/brand/logo-horizontal.svg" alt="PlanningPal" className="mx-auto h-8 w-auto" />
        <div className="mt-8 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2563EB]">{item.eyebrow}</div>
        <h1 className="mt-2 font-display text-[28px] font-semibold tracking-[-0.03em]">{item.title}</h1>
        <p className="mt-3 text-[13px] leading-relaxed text-[#52627A]">{item.body}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href="/" className="rounded-lg border border-[#DCE4F0] px-4 py-2.5 text-[12px] font-semibold">Back to site</a>
          {kind === 'session' ? (
            <a href="/sign-in" className="rounded-lg bg-[#172554] px-4 py-2.5 text-[12px] font-semibold text-white">Sign in</a>
          ) : (
            <a href="/app" className="rounded-lg bg-[#172554] px-4 py-2.5 text-[12px] font-semibold text-white">Command centre</a>
          )}
          {onRetry && (
            <button type="button" onClick={onRetry} className="rounded-lg border border-[#DCE4F0] px-4 py-2.5 text-[12px] font-semibold">Try again</button>
          )}
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { authClient } from '../lib/auth-client'
import { api } from '../lib/api'

function Shell({ title, lede, children }: { title: string; lede: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#172033]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <a href="/" aria-label="PlanningPal home">
          <img src="/brand/logo-horizontal.svg" alt="PlanningPal" className="h-8 w-auto" />
        </a>
        <a href="/" className="text-[12px] font-semibold text-[#52627A]">Back to site</a>
      </header>
      <main className="mx-auto grid max-w-md px-5 pb-16 pt-6">
        <section className="rounded-2xl border border-[#DCE4F0] bg-white p-6 shadow-[0_12px_40px_rgba(23,37,84,0.06)] sm:p-8">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2563EB]">PlanningPal</div>
          <h1 className="mt-2 font-display text-[28px] font-semibold tracking-[-0.03em]">{title}</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-[#52627A]">{lede}</p>
          <div className="mt-6">{children}</div>
        </section>
      </main>
    </div>
  )
}

const field = 'mt-2 w-full rounded-lg border border-[#DCE4F0] px-3 py-3 text-sm outline-none focus:border-[#2563EB]'
const label = 'mt-4 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748B]'
const primary = 'mt-6 w-full rounded-lg bg-[#172554] py-3 text-[13px] font-semibold text-white hover:bg-[#1E3A8A] disabled:cursor-not-allowed disabled:opacity-50'

function messageOf(error: { message?: string } | null | undefined, fallback: string) {
  return error?.message || fallback
}

export function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [providers, setProviders] = useState({ google: false, microsoft: false })

  useEffect(() => {
    void api.providers().then((next) => setProviders(next)).catch(() => undefined)
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    const result = await authClient.signIn.email({ email, password, callbackURL: '/app' })
    setBusy(false)
    if (result.error) {
      setError(messageOf(result.error, 'Check the email and password, and confirm the address if you just signed up.'))
      return
    }
    window.location.assign('/app')
  }

  const sendLink = async () => {
    if (!email) {
      setError('Enter your email and we will send a sign-in link.')
      return
    }
    setBusy(true)
    setError('')
    const result = await authClient.signIn.magicLink({ email, callbackURL: '/app' })
    setBusy(false)
    if (result.error) setError(messageOf(result.error, 'Could not send the sign-in link.'))
    else setNotice('If that account can sign in, a link is on its way. In local development the link is written to the API log.')
  }

  const social = async (provider: 'google' | 'microsoft') => {
    await authClient.signIn.social({ provider, callbackURL: '/app' })
  }

  return (
    <Shell title="Sign in" lede="Open the command centre for your organisation.">
      <form onSubmit={submit}>
        <label className={label}>Email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={field} /></label>
        <label className={label}>Password<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className={field} /></label>
        {error && <p className="mt-3 text-[13px] font-medium text-[#B91C1C]">{error}</p>}
        {notice && <p className="mt-3 text-[13px] leading-relaxed text-[#166534]">{notice}</p>}
        <button type="submit" disabled={busy} className={primary}>Sign in</button>
      </form>
      <button type="button" disabled={busy} onClick={() => void sendLink()} className="mt-3 w-full rounded-lg border border-[#DCE4F0] py-3 text-[13px] font-semibold text-[#172554]">
        Email me a sign-in link
      </button>
      {(providers.google || providers.microsoft) && (
        <div className="mt-3 grid gap-2">
          {providers.google && <button type="button" onClick={() => void social('google')} className="rounded-lg border border-[#DCE4F0] py-3 text-[13px] font-semibold">Continue with Google</button>}
          {providers.microsoft && <button type="button" onClick={() => void social('microsoft')} className="rounded-lg border border-[#DCE4F0] py-3 text-[13px] font-semibold">Continue with Microsoft</button>}
        </div>
      )}
      <div className="mt-5 flex justify-between text-[13px]">
        <a href="/forgot-password" className="font-semibold text-[#2563EB]">Forgot password</a>
        <a href="/sign-up" className="font-semibold text-[#2563EB]">Create an account</a>
      </div>
    </Shell>
  )
}

export function SignUpPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    const result = await authClient.signUp.email({ name, email, password, callbackURL: '/app' })
    setBusy(false)
    if (result.error) {
      setError(messageOf(result.error, 'Could not create that account.'))
      return
    }
    setNotice('Check your email to confirm the address. In local development the confirmation link is written to the API log.')
  }

  return (
    <Shell title="Create an account" lede="A new organisation is created with you as the owner.">
      <form onSubmit={submit}>
        <label className={label}>Name<input required value={name} onChange={(event) => setName(event.target.value)} className={field} /></label>
        <label className={label}>Work email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={field} /></label>
        <label className={label}>Password<input required type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className={field} /></label>
        {error && <p className="mt-3 text-[13px] font-medium text-[#B91C1C]">{error}</p>}
        {notice && <p className="mt-3 text-[13px] leading-relaxed text-[#166534]">{notice}</p>}
        <button type="submit" disabled={busy} className={primary}>Create account</button>
      </form>
      <p className="mt-5 text-[13px] text-[#52627A]">Already registered? <a href="/sign-in" className="font-semibold text-[#2563EB]">Sign in</a></p>
    </Shell>
  )
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    const result = await authClient.requestPasswordReset({ email, redirectTo: `${window.location.origin}/reset-password` })
    setBusy(false)
    if (result.error) setError(messageOf(result.error, 'Could not start a password reset.'))
    else setNotice('If an account uses that email, a reset link is on its way. In local development the link is written to the API log.')
  }

  return (
    <Shell title="Reset password" lede="We will email a link to choose a new password.">
      <form onSubmit={submit}>
        <label className={label}>Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={field} /></label>
        {error && <p className="mt-3 text-[13px] font-medium text-[#B91C1C]">{error}</p>}
        {notice && <p className="mt-3 text-[13px] leading-relaxed text-[#166534]">{notice}</p>}
        <button type="submit" disabled={busy} className={primary}>Send reset link</button>
      </form>
      <p className="mt-5 text-[13px]"><a href="/sign-in" className="font-semibold text-[#2563EB]">Back to sign in</a></p>
    </Shell>
  )
}

export function ResetPasswordPage() {
  const token = new URLSearchParams(window.location.search).get('token') || ''
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    const result = await authClient.resetPassword({ newPassword: password, token })
    setBusy(false)
    if (result.error) {
      setError(messageOf(result.error, 'That reset link is invalid or has expired.'))
      return
    }
    window.location.assign('/sign-in')
  }

  return (
    <Shell title="Choose a new password" lede="Use at least 8 characters.">
      <form onSubmit={submit}>
        <label className={label}>New password<input required type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className={field} /></label>
        {error && <p className="mt-3 text-[13px] font-medium text-[#B91C1C]">{error}</p>}
        <button type="submit" disabled={busy || !token} className={primary}>Update password</button>
      </form>
    </Shell>
  )
}

export function AcceptInvitePage() {
  const token = new URLSearchParams(window.location.search).get('token') || ''
  const [email, setEmail] = useState('')
  const [organisation, setOrganisation] = useState('')
  const [role, setRole] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!token) return
    void api.invitation(token).then((invite) => {
      setEmail(invite.email)
      setOrganisation(invite.organisation)
      setRole(invite.role)
      if (invite.expired) setError('This invitation has expired. Ask an admin to send a new one.')
    }).catch(() => setError('This invitation link is not valid.'))
  }, [token])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    const created = await authClient.signUp.email({ name, email, password, callbackURL: '/app' })
    if (created.error) {
      setBusy(false)
      setError(messageOf(created.error, 'Could not accept the invitation.'))
      return
    }
    const signedIn = await authClient.signIn.email({ email, password, callbackURL: '/app' })
    setBusy(false)
    if (signedIn.error) {
      setError(messageOf(signedIn.error, 'Account created. Sign in once your email is confirmed.'))
      return
    }
    window.location.assign('/app')
  }

  return (
    <Shell title="Join your team" lede={organisation ? `${organisation} invited you as ${role}.` : 'Accept your PlanningPal invitation.'}>
      <form onSubmit={submit}>
        <label className={label}>Name<input required value={name} onChange={(event) => setName(event.target.value)} className={field} /></label>
        <label className={label}>Email<input required type="email" value={email} readOnly className={`${field} bg-[#F8FAFC]`} /></label>
        <label className={label}>Password<input required type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className={field} /></label>
        {error && <p className="mt-3 text-[13px] font-medium text-[#B91C1C]">{error}</p>}
        <button type="submit" disabled={busy || !email} className={primary}>Create account and join</button>
      </form>
    </Shell>
  )
}

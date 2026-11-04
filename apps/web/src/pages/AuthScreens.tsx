import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { supabase } from '../lib/auth-client'

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
const primary = 'mt-6 w-full rounded-xl bg-[#172554] py-3 text-[13px] font-semibold text-white hover:bg-[#1E3A8A] disabled:cursor-not-allowed disabled:opacity-50'

function missingClient() {
  return 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
}

function safeRedirect(path: string) {
  try {
    const url = new URL(path, window.location.origin)
    if (url.origin !== window.location.origin) return `${window.location.origin}/app`
    return url.href
  } catch {
    return `${window.location.origin}/app`
  }
}

/** Where a completed sign-in should land. Super Admin lands on /app/admin. */
function destinationAfterSignIn(isSuperAdmin = false) {
  const nextParam = new URLSearchParams(window.location.search).get('next')
  if (nextParam && nextParam.startsWith('/')) return nextParam
  return isSuperAdmin ? '/app/admin' : '/app'
}

export function SignInPage() {
  const expired = new URLSearchParams(window.location.search).get('expired') === '1'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [require2fa, setRequire2fa] = useState(false)
  const [totpCode, setTotpCode] = useState('')
  const [pendingDestination, setPendingDestination] = useState('/app')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!supabase) return setError(missingClient())
    setBusy(true)
    setError('')
    if (require2fa) {
      try {
        const { api } = await import('../lib/api')
        await api.verifyTwoFactor(totpCode)
        window.location.assign(pendingDestination)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid 6-digit verification code')
      } finally {
        setBusy(false)
      }
      return
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setBusy(false)
      return setError(signInError.message)
    }
    try {
      const { api } = await import('../lib/api')
      const me = await api.me()
      const dest = destinationAfterSignIn(me.platformRole === 'super_admin')
      if (me.twoFactorEnabled) {
        setPendingDestination(dest)
        setRequire2fa(true)
        setBusy(false)
        return
      }
      window.location.assign(dest)
    } catch {
      window.location.assign(destinationAfterSignIn(false))
    }
  }

  const sendLink = async () => {
    if (!supabase) return setError(missingClient())
    if (!email) return setError('Enter your email and we will send a sign-in link.')
    setBusy(true)
    setError('')
    const { error: linkError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: safeRedirect(destinationAfterSignIn()) },
    })
    setBusy(false)
    if (linkError) return setError(linkError.message)
    setNotice('Check your email for a sign-in link. Supabase sends that message.')
  }

  return (
    <Shell title={require2fa ? 'Two-Factor Authentication' : 'Sign in'} lede={require2fa ? 'Enter the 6-digit verification code from your authenticator app.' : 'Open the command centre for your organisation.'}>
      {expired && <p className="mb-4 rounded-lg bg-[#FFF7ED] px-3 py-2 text-[13px] text-[#9A3412]">Your session has expired. Sign in again.</p>}
      <form onSubmit={submit}>
        {!require2fa ? (
          <>
            <label className={label}>Email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={field} /></label>
            <label className={label}>Password<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className={field} /></label>
          </>
        ) : (
          <label className={label}>
            6-digit authenticator code
            <input
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="123456"
              value={totpCode}
              onChange={(event) => setTotpCode(event.target.value)}
              className={`${field} tracking-[0.25em] font-mono text-base`}
            />
          </label>
        )}
        {error && <p className="mt-3 text-[13px] font-medium text-[#B91C1C]">{error}</p>}
        {notice && <p className="mt-3 text-[13px] leading-relaxed text-[#166534]">{notice}</p>}
        <button type="submit" disabled={busy} className={primary}>{require2fa ? 'Verify & Continue' : 'Sign in'}</button>
      </form>
      {!require2fa && (
        <>
          <button type="button" disabled={busy} onClick={() => void sendLink()} className="mt-3 w-full rounded-lg border border-[#DCE4F0] py-3 text-[13px] font-semibold text-[#172554]">Email me a sign-in link</button>
          <button
            type="button"
            className="mt-3 w-full rounded-lg border border-[#DCE4F0] py-3 text-[13px] font-semibold"
            onClick={() => {
              if (!supabase) return setError(missingClient())
              void supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: safeRedirect(destinationAfterSignIn()) } })
            }}
          >
            Continue with Google
          </button>
          <div className="mt-5 flex justify-between text-[13px]">
            <a href="/forgot-password" className="font-semibold text-[#2563EB]">Forgot password</a>
            <a href="/sign-up" className="font-semibold text-[#2563EB]">Create an account</a>
          </div>
          <p className="mt-4 text-center text-[13px]">
            <a href="/sign-in?next=/app/admin" className="font-semibold text-[#2563EB]">Super Admin Console login</a>
          </p>
        </>
      )}
    </Shell>
  )
}

export function SignUpPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!supabase) return setError(missingClient())
    setBusy(true)
    setError('')
    const name = `${firstName.trim()} ${lastName.trim()}`.trim()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, firstName: firstName.trim(), lastName: lastName.trim() }, emailRedirectTo: safeRedirect('/onboarding') },
    })
    setBusy(false)
    if (signUpError) return setError(signUpError.message)
    if (data.session) {
      window.location.assign('/onboarding')
      return
    }
    setNotice('Check your email to confirm the address. Supabase sends that message. You will then complete your onboarding.')
  }

  return (
    <Shell title="Create an account" lede="Sign up to launch your PlanningPal onboarding, add your contact details, and invite your team.">
      <form onSubmit={submit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={label}>First name<input required value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Alex" className={field} /></label>
          <label className={label}>Last name<input required value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Morgan" className={field} /></label>
        </div>
        <label className={label}>Work email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={field} /></label>
        <label className={label}>Password<input required type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className={field} /></label>
        {error && <p className="mt-3 text-[13px] font-medium text-[#B91C1C]">{error}</p>}
        {notice && <p className="mt-3 text-[13px] leading-relaxed text-[#166534]">{notice}</p>}
        <button type="submit" disabled={busy} className={primary}>Create account & start onboarding</button>
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
    if (!supabase) return setError(missingClient())
    setBusy(true)
    setError('')
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: safeRedirect('/reset-password'),
    })
    setBusy(false)
    if (resetError) return setError(resetError.message)
    setNotice('If an account uses that email, Supabase will send a reset link.')
  }

  return (
    <Shell title="Reset password" lede="Supabase emails a link to choose a new password.">
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
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!supabase) return setError(missingClient())
    setBusy(true)
    setError('')
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (updateError) return setError(updateError.message)
    window.location.assign('/app')
  }

  return (
    <Shell title="Choose a new password" lede="Use at least 8 characters. Open this page from the Supabase reset link.">
      <form onSubmit={submit}>
        <label className={label}>New password<input required type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className={field} /></label>
        {error && <p className="mt-3 text-[13px] font-medium text-[#B91C1C]">{error}</p>}
        <button type="submit" disabled={busy} className={primary}>Update password</button>
      </form>
    </Shell>
  )
}

export function AcceptInvitePage() {
  const token = new URLSearchParams(window.location.search).get('token') || ''
  const [email, setEmail] = useState('')
  const [organisation, setOrganisation] = useState('')
  const [role, setRole] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    void import('../lib/api').then(({ api }) => api.invitation(token)).then((invite) => {
      if (cancelled) return
      setEmail(invite.email)
      setOrganisation(invite.organisation)
      setRole(invite.role || 'Member')
      if (invite.firstName || invite.lastName) {
        setFirstName(invite.firstName || '')
        setLastName(invite.lastName || '')
      } else if (invite.name) {
        const parts = invite.name.trim().split(/\s+/)
        setFirstName(parts[0] || '')
        setLastName(parts.slice(1).join(' '))
      }
      if (invite.expired) setError('This invitation has expired. Ask an admin to send a new one.')
    }).catch(() => {
      if (!cancelled) setError('This invitation link is not valid.')
    })
    return () => { cancelled = true }
  }, [token])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!supabase) return setError(missingClient())
    setBusy(true)
    setError('')
    const name = `${firstName.trim()} ${lastName.trim()}`.trim()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, firstName: firstName.trim(), lastName: lastName.trim() }, emailRedirectTo: safeRedirect('/onboarding') },
    })
    setBusy(false)
    if (signUpError) return setError(signUpError.message)
    if (data.session) {
      window.location.assign('/onboarding')
      return
    }
    window.location.assign('/sign-in')
  }

  return (
    <Shell
      title={role === 'Owner' ? `Welcome to ${organisation || 'PlanningPal'}` : 'Welcome to your team'}
      lede={
        organisation
          ? role === 'Owner'
            ? `Your customer workspace for ${organisation} has been prepared. Confirm your name and choose a password to start onboarding.`
            : `${organisation} invited you to join their workspace (Default Role: ${role || 'Member'} — your Admin can assign roles in the Team section).`
          : 'Accept your PlanningPal invitation to continue to onboarding.'
      }
    >
      <form onSubmit={submit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={label}>First name<input required value={firstName} onChange={(event) => setFirstName(event.target.value)} className={field} /></label>
          <label className={label}>Last name<input required value={lastName} onChange={(event) => setLastName(event.target.value)} className={field} /></label>
        </div>
        <label className={label}>Invited Email<input required type="email" value={email} readOnly className={`${field} bg-[#F8FAFC]`} /></label>
        <label className={label}>Choose Password<input required type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className={field} /></label>
        {error && <p className="mt-3 text-[13px] font-medium text-[#B91C1C]">{error}</p>}
        <button type="submit" disabled={busy || !email} className={primary}>Accept invite & continue to onboarding</button>
      </form>
    </Shell>
  )
}

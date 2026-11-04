import { useEffect, useState, type FormEvent } from 'react'
import { ALERT_FREQUENCIES, COVERAGE_TIERS, PROJECT_TYPES, RIBA_STAGES, UK_AREAS, VALUE_RANGES } from '@planningpal/shared'
import { api, type OnboardingState } from '../lib/api'

const field = 'mt-2 w-full rounded-lg border border-[#DCE4F0] bg-white px-3 py-3 text-base outline-none focus:border-[#2563EB]'
const label = 'block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748B]'

function Chip({ active, children, onClick }: { active: boolean; children: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-full border px-3 py-2 text-left text-[13px] font-semibold ${active ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8]' : 'border-[#E2E8F0] bg-white text-[#334155]'}`}>
      {children}
    </button>
  )
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

export function OnboardingPage() {
  const [state, setState] = useState<OnboardingState | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [secondaryEmail, setSecondaryEmail] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [coverage, setCoverage] = useState('regional')
  const [regions, setRegions] = useState<string[]>([])
  const [councils, setCouncils] = useState<string[]>([])
  const [projectTypes, setProjectTypes] = useState<string[]>([])
  const [valueRanges, setValueRanges] = useState<string[]>([])
  const [ribaStages, setRibaStages] = useState<string[]>(['0', '1', '2'])
  const [invites, setInvites] = useState([
    { name: '', email: '', role: 'member' },
    { name: '', email: '', role: 'member' },
    { name: '', email: '', role: 'member' },
  ])
  const [alertsEnabled, setAlertsEnabled] = useState(true)
  const [frequency, setFrequency] = useState('weekly')
  const [areas, setAreas] = useState(UK_AREAS)
  const [coverageByName, setCoverageByName] = useState<Record<string, string>>({})

  const apply = (next: OnboardingState) => {
    setState(next)
    setCompanyName(next.draft.companyName)
    setLogoUrl(next.draft.logoUrl)
    const parts = (next.draft.name || '').trim().split(/\s+/)
    setFirstName(next.draft.firstName || parts[0] || '')
    setLastName(next.draft.lastName || parts.slice(1).join(' ') || '')
    setEmail(next.draft.email || '')
    setPhone(next.draft.phone || '')
    setSecondaryEmail(next.draft.secondaryEmail || '')
    setJobTitle(next.draft.jobTitle || (next.invited ? 'Estimator' : 'Managing Director'))
    setCoverage(next.draft.coverage || 'regional')
    setRegions(next.draft.coverage === 'nationwide' ? areas.map((area) => area.region) : next.draft.regions)
    setCouncils(next.draft.councils)
    setProjectTypes(next.draft.projectTypes)
    setValueRanges(next.draft.valueRanges)
    setRibaStages(next.draft.ribaStages.length ? next.draft.ribaStages : ['0', '1', '2'])
    setAlertsEnabled(next.draft.alertsEnabled)
    setFrequency(next.draft.frequency || 'weekly')
    if (next.step === 'done') window.location.assign('/app')
  }

  useEffect(() => {
    void api.lpas().then((payload) => {
      if (!payload.regions.length) return
      setAreas(payload.regions.map((region) => ({ region: region.region, councils: region.councils.map((council) => council.name) })))
      setCoverageByName(Object.fromEntries(payload.regions.flatMap((region) => region.councils.map((council) => [council.name, council.coverage]))))
    }).catch(() => undefined)
  }, [])

  useEffect(() => {
    let cancelled = false
    void api.onboarding().then((next) => {
      if (!cancelled) apply(next)
    }).catch((reason: unknown) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : 'Setup could not be loaded')
    })
    return () => { cancelled = true }
  }, [])

  const save = async (body: Record<string, unknown>) => {
    setBusy(true)
    setError('')
    try {
      apply(await api.saveOnboarding(body))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'That step could not be saved')
    } finally {
      setBusy(false)
    }
  }

  const onLogo = (file: File | undefined) => {
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Use a PNG, JPEG, or WebP logo.')
      return
    }
    if (file.size > 120_000) {
      setError('Logo must be smaller than 120KB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setLogoUrl(typeof reader.result === 'string' ? reader.result : '')
    reader.readAsDataURL(file)
  }

  if (!state) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] px-5 py-16">
        {error ? <p className="mx-auto max-w-lg rounded-xl bg-white p-6 text-[14px] font-medium text-[#B91C1C]">{error}</p> : (
          <>
            <div className="mx-auto h-8 w-40 animate-pulse rounded-lg bg-[#E2E8F0]" />
            <div className="mx-auto mt-6 h-64 max-w-lg animate-pulse rounded-2xl bg-white" />
          </>
        )}
      </div>
    )
  }

  const stepIndex = Math.max(0, state.steps.findIndex((step) => step.state === 'current'))
  const current = state.steps[stepIndex]
  const councilOptions = areas.filter((area) => coverage === 'nationwide' || regions.includes(area.region)).flatMap((area) => area.councils)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (state.step === 'workspace') void save({ action: 'save-workspace', companyName, logoUrl })
    else if (state.step === 'profile') {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
      void save({
        action: 'save-profile',
        name: fullName,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        secondaryEmail: secondaryEmail.trim(),
        companyName: companyName.trim() || undefined,
        jobTitle,
      })
    } else if (state.step === 'icp') void save({ action: 'save-icp', coverage, regions: coverage === 'nationwide' ? areas.map((area) => area.region) : regions, councils, projectTypes, valueRanges, ribaStages })
    else if (state.step === 'team') void save({ action: 'save-team', invites: invites.filter((invite) => invite.email.trim()) })
    else void save({ action: 'save-alerts', enabled: alertsEnabled, frequency })
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#172033]">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5 sm:px-6">
        <a href="/" aria-label="PlanningPal home"><img src="/brand/logo-horizontal.svg" alt="PlanningPal" className="h-8 w-auto" /></a>
        <span className="text-[12px] font-semibold text-[#52627A]">Step {stepIndex + 1} of {state.steps.length}</span>
      </header>
      <main className="mx-auto grid max-w-3xl gap-4 px-4 pb-28 sm:px-6">
        <ol className="flex gap-2 overflow-x-auto pb-1">
          {state.steps.map((step, index) => (
            <li key={step.id} className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold ${step.state === 'current' ? 'bg-[#172554] text-white' : step.state === 'complete' ? 'bg-[#DBEAFE] text-[#1D4ED8]' : 'bg-white text-[#64748B]'}`}>
              {index + 1}. {step.label}{step.optional ? ' · optional' : ''}
            </li>
          ))}
        </ol>
        <form onSubmit={submit} className="rounded-2xl border border-[#DCE4F0] bg-white p-5 shadow-[0_12px_40px_rgba(23,37,84,0.06)] sm:p-8">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2563EB]">{state.invited ? 'Welcome to your workspace' : 'Set up PlanningPal'}</div>
          <h1 className="mt-2 font-display text-[28px] font-semibold tracking-[-0.03em]">{current?.label}</h1>
          {state.step === 'workspace' && (
            <div className="mt-6 grid gap-4">
              <p className="text-[13px] leading-relaxed text-[#52627A]">Name the company this workspace belongs to. A logo is optional.</p>
              <label className={label}>Company name<input required minLength={2} value={companyName} onChange={(event) => setCompanyName(event.target.value)} className={field} /></label>
              <label className={label}>Logo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => onLogo(event.target.files?.[0])} className={`${field} text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#EFF6FF] file:px-3 file:py-1.5 file:text-[12px] file:font-semibold file:text-[#1D4ED8]`} /></label>
              {logoUrl && <img src={logoUrl} alt="Workspace logo preview" className="h-16 w-16 rounded-lg border border-[#E2E8F0] object-contain" />}
            </div>
          )}
          {state.step === 'profile' && (
            <div className="mt-6 grid gap-4">
              {state.invited ? (
                <div className="rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] px-4 py-3 text-[13px] text-[#1E3A8A]">
                  <strong>Welcome to {state.draft.companyName || 'PlanningPal'}!</strong> Your First and Last Name from your invitation are pre-filled below. Complete your contact number and optional secondary email to continue (teammates join as <strong>Member</strong> by default — Admins can assign roles in the Team section).
                </div>
              ) : (
                <p className="text-[13px] leading-relaxed text-[#52627A]">Complete your personal contact details and role so teammates and notifications reach you cleanly.</p>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={label}>First name<input required value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Alex" className={field} /></label>
                <label className={label}>Last name<input required value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Morgan" className={field} /></label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={label}>Primary email<input type="email" value={email} readOnly className={`${field} bg-[#F8FAFC] text-[#64748B]`} /></label>
                <label className={label}>Secondary email (optional)<input type="email" value={secondaryEmail} onChange={(event) => setSecondaryEmail(event.target.value)} placeholder="backup@company.co.uk" className={field} /></label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={label}>Contact number<input required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="07700 900123 or 020 7946 0192" className={field} /></label>
                <label className={label}>Job role<input required value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} placeholder="Estimator, director, bid manager" className={field} /></label>
              </div>
            </div>
          )}
          {state.step === 'icp' && (
            <div className="mt-6 grid gap-5">
              <p className="text-[13px] leading-relaxed text-[#52627A]">Match the feed to your pricing tier. Regional is one region, Multi County is two or three, Nationwide is every UK authority. Focus stays on RIBA stages 0–2.</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {COVERAGE_TIERS.map((tier) => (
                  <button key={tier.id} type="button" onClick={() => { setCoverage(tier.id); setRegions(tier.id === 'nationwide' ? areas.map((area) => area.region) : []); setCouncils([]) }} className={`rounded-xl border p-3 text-left ${coverage === tier.id ? 'border-[#2563EB] bg-[#EFF6FF]' : 'border-[#E2E8F0]'}`}>
                    <div className="text-[13px] font-semibold">{tier.label}</div>
                    <div className="mt-1 text-[12px] text-[#52627A]">{tier.monthlyPrice}/mo</div>
                    <div className="mt-1 text-[11px] leading-relaxed text-[#64748B]">{tier.detail}</div>
                  </button>
                ))}
              </div>
              {coverage !== 'nationwide' && (
                <fieldset>
                  <legend className={label}>Regions</legend>
                  <div className="mt-2 flex flex-wrap gap-2">{areas.map((area) => <Chip key={area.region} active={regions.includes(area.region)} onClick={() => { setRegions((currentRegions) => toggle(currentRegions, area.region)); setCouncils([]) }}>{area.region}</Chip>)}</div>
                </fieldset>
              )}
              {coverage === 'nationwide' && <p className="rounded-lg bg-[#F8FAFC] px-3 py-2 text-[12px] text-[#52627A]">Nationwide includes all 380 active planning authorities. Add councils below only if you want them called out.</p>}
              <fieldset>
                <legend className={label}>Councils in those regions</legend>
                <div className="mt-2 flex max-h-40 flex-wrap gap-2 overflow-y-auto">
                  {councilOptions.map((council) => <Chip key={council} active={councils.includes(council)} onClick={() => setCouncils((currentCouncils) => toggle(currentCouncils, council))}>{coverageByName[council] === 'coverage unavailable' ? `${council} (coverage unavailable)` : council}</Chip>)}
                  {!councilOptions.length && <span className="text-[12px] text-[#64748B]">Choose a region to see its councils.</span>}
                </div>
              </fieldset>
              <fieldset>
                <legend className={label}>Project types</legend>
                <div className="mt-2 flex flex-wrap gap-2">{PROJECT_TYPES.map((item) => <Chip key={item} active={projectTypes.includes(item)} onClick={() => setProjectTypes((currentTypes) => toggle(currentTypes, item))}>{item}</Chip>)}</div>
              </fieldset>
              <fieldset>
                <legend className={label}>Value ranges</legend>
                <div className="mt-2 flex flex-wrap gap-2">{VALUE_RANGES.map((item) => <Chip key={item} active={valueRanges.includes(item)} onClick={() => setValueRanges((currentRanges) => toggle(currentRanges, item))}>{item}</Chip>)}</div>
              </fieldset>
              <fieldset>
                <legend className={label}>RIBA stages 0–2</legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {RIBA_STAGES.map((stage) => (
                    <button key={stage.id} type="button" onClick={() => setRibaStages((currentStages) => toggle(currentStages, stage.id))} className={`rounded-xl border p-3 text-left ${ribaStages.includes(stage.id) ? 'border-[#2563EB] bg-[#EFF6FF]' : 'border-[#E2E8F0]'}`}>
                      <div className="text-[13px] font-semibold">{stage.label}</div>
                      <div className="mt-1 text-[11px] text-[#64748B]">{stage.detail}</div>
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          )}
          {state.step === 'team' && (
            <div className="mt-6 grid gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] px-4 py-3">
                <div>
                  <div className="text-[13px] font-semibold text-[#1E3A8A]">Add Your Team — Available Seat Slots</div>
                  <p className="mt-0.5 text-[12px] text-[#3B82F6]">Enter each colleague&apos;s Name and Email. When they join via their invite link, they are welcomed as <strong>Member</strong> by default. Admins can assign or customize roles anytime in the Team section.</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#1D4ED8] shadow-xs">
                  {Math.max(1, 5 - (state.draft.teamInvites?.length ?? 0))} slots available
                </span>
              </div>
              {state.draft.teamInvites && state.draft.teamInvites.length > 0 && (
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">Already Invited</div>
                  <div className="mt-2 grid gap-1.5">
                    {state.draft.teamInvites.map((member, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[12px]">
                        <span className="font-semibold text-[#172554]">{member.name} · <span className="font-normal text-[#64748B]">{member.email}</span></span>
                        <span className="rounded-full bg-[#DBEAFE] px-2.5 py-0.5 text-[11px] font-semibold text-[#1D4ED8]">{member.role} · {member.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid gap-3">
                {invites.map((invite, index) => (
                  <div key={index} className="grid gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/60 p-3 sm:grid-cols-[180px_1fr_110px]">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#64748B]">Slot {index + 1} · Full Name</span>
                      <input
                        value={invite.name}
                        onChange={(event) => setInvites((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, name: event.target.value } : row))}
                        placeholder="Jamie Clarke"
                        className="mt-1 w-full rounded-lg border border-[#DCE4F0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2563EB]"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#64748B]">Work Email</span>
                      <input
                        type="email"
                        value={invite.email}
                        onChange={(event) => setInvites((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, email: event.target.value } : row))}
                        placeholder="jamie@company.co.uk"
                        className="mt-1 w-full rounded-lg border border-[#DCE4F0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2563EB]"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#64748B]">Default Role</span>
                      <div className="mt-1 flex h-[40px] items-center rounded-lg border border-[#E2E8F0] bg-white px-3 text-[12px] font-semibold text-[#475569]">
                        Member
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setInvites((rows) => [...rows, { name: '', email: '', role: 'member' }])} className="w-fit text-[13px] font-semibold text-[#2563EB]">+ Add another team slot</button>
            </div>
          )}
          {state.step === 'alerts' && (
            <div className="mt-6 grid gap-4">
              <p className="text-[13px] leading-relaxed text-[#52627A]">New planning leads can be emailed to you. Resend sends them when the workspace is connected. You can change this later.</p>
              <label className="flex items-center gap-3 text-[14px] font-semibold"><input type="checkbox" checked={alertsEnabled} onChange={(event) => setAlertsEnabled(event.target.checked)} className="h-4 w-4" /> Email me new leads</label>
              <div className="grid gap-2">
                {ALERT_FREQUENCIES.map((item) => (
                  <label key={item.id} className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-[13px] font-semibold ${frequency === item.id ? 'border-[#2563EB] bg-[#EFF6FF]' : 'border-[#E2E8F0]'} ${alertsEnabled ? '' : 'opacity-50'}`}>
                    <input type="radio" name="frequency" value={item.id} checked={frequency === item.id} disabled={!alertsEnabled} onChange={() => setFrequency(item.id)} />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>
          )}
          {error && <p className="mt-4 text-[13px] font-medium text-[#B91C1C]">{error}</p>}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <button type="button" disabled={busy || stepIndex === 0} onClick={() => void save({ action: 'back' })} className="rounded-lg border border-[#DCE4F0] px-4 py-3 text-[13px] font-semibold text-[#172554] disabled:opacity-40">Back</button>
            <div className="flex flex-col gap-2 sm:flex-row">
              {current?.optional && <button type="button" disabled={busy} onClick={() => void save({ action: 'skip' })} className="rounded-lg border border-[#DCE4F0] px-4 py-3 text-[13px] font-semibold text-[#52627A]">Skip for now</button>}
              <button type="submit" disabled={busy} className="rounded-lg bg-[#172554] px-4 py-3 text-[13px] font-semibold text-white hover:bg-[#1E3A8A] disabled:opacity-50">{state.step === 'alerts' ? 'Finish' : 'Continue'}</button>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}

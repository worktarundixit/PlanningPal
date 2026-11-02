import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { PUBLIC_EMAIL, PUBLIC_PHONE_DISPLAY, PUBLIC_PHONE_TEL } from '@planningpal/shared'
import { api } from '../lib/api'
import { supabase } from '../lib/auth-client'
import { CommandPreview } from './ProductPreview'
import { UkCouncilMap } from './UkCouncilMap'

const plans = [
  {
    kicker: 'Self serve data',
    name: 'Regional Leads Feed',
    who: 'For local contractors, QS firms, and surveyors operating in 1 defined territory.',
    price: '£99',
    featured: false,
    cta: 'Subscribe to Regional Feed',
    points: [
      '1 UK Region / Territory (e.g. Surrey or London)',
      'Projects prefiltered for £100k+ or £250k+',
      'Delivered every Monday morning (Excel/CSV)',
      'Full 44 columns: Applicant, Architect, Values',
      'Both Submitted & Approved status',
    ],
  },
  {
    kicker: 'Expanded coverage',
    name: 'Multi County Feed',
    who: 'For growing construction and design firms covering multiple regional counties.',
    price: '£179',
    featured: true,
    cta: 'Subscribe to Multi County',
    points: [
      'Up to 3 UK Regions (e.g. London + Kent + Surrey)',
      'Prefiltered for £100k to £1M or custom values',
      'Verified Architect Phone Numbers & Business Emails',
      'Priority Monday 8:00 AM Delivery',
      'Sector tagging: Residential, Commercial, D&B',
    ],
  },
  {
    kicker: 'Full intelligence',
    name: 'All UK Nationwide',
    who: 'Complete national pipeline across England, Scotland, Wales & Northern Ireland.',
    price: '£299',
    featured: false,
    cta: 'Subscribe to Nationwide',
    points: [
      'All 380 active UK planning authorities',
      '~2,000+ Qualified High Value Leads Weekly',
      'Multi Seat CSV/Excel and direct CRM sync format',
      'Custom value thresholds (e.g. £500k+, £1M+)',
      'Dedicated account manager',
    ],
  },
]

function authCallbackOnHome() {
  const hash = window.location.hash
  const search = window.location.search
  return /access_token=|refresh_token=|error_description=/.test(hash) || /[?&]code=/.test(search)
}

export function Landing() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    if (!supabase) return
    const callback = authCallbackOnHome()
    let active = true
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      if (callback && data.session) {
        window.location.replace('/app')
        return
      }
      setSignedIn(Boolean(data.session))
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (callback && session) {
        window.location.replace('/app')
        return
      }
      setSignedIn(Boolean(session))
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setPending(true)
    setError('')
    void api.bookDemo({
      name: String(form.get('name') || ''),
      email: String(form.get('email') || ''),
      company: String(form.get('company') || ''),
      trade: String(form.get('trade') || ''),
      note: String(form.get('note') || ''),
    }).then(() => setSent(true)).catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : 'Could not store that request')
    }).finally(() => setPending(false))
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] font-normal text-[#172033]">
      <a href="#sheet" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2">Skip to content</a>
      <header className="sticky top-0 z-30 border-b border-[#DCE4F0]/80 bg-[#F4F7FB]/90 backdrop-blur-md">
        <div className="mx-auto flex h-[76px] max-w-[1180px] items-center justify-between gap-2 px-3 sm:gap-4 sm:px-5">
          <a href="/" className="flex shrink-0 items-center gap-3">
            <img src="/brand/logo-horizontal.svg" alt="PlanningPal" className="h-6 w-auto sm:h-8" />
          </a>
          <nav className="flex items-center gap-2 overflow-x-auto text-[13px] font-medium text-[#3F3F46] sm:gap-4" aria-label="Page">
            <a href="#command" className="hidden whitespace-nowrap hover:text-black md:inline">Product</a>
            <a href="#how" className="hidden whitespace-nowrap hover:text-black md:inline">How It Works</a>
            <a href="#packages" className="hidden whitespace-nowrap hover:text-black md:inline">Pricing</a>
            <a href="#team" className="hidden whitespace-nowrap hover:text-black md:inline">Team</a>
            <a href={signedIn ? '/app' : '/sign-in'} className="whitespace-nowrap px-2 py-2 font-medium hover:text-black">{signedIn ? 'Dashboard' : 'Sign In'}</a>
            <a href="#demo" className="pp-cta shrink-0 whitespace-nowrap bg-[#2563EB] px-2 py-2 text-[11px] font-semibold text-white hover:bg-[#1D4ED8] sm:px-3.5 sm:py-2.5 sm:text-[13px]">Schedule Demo</a>
          </nav>
        </div>
      </header>

      <main id="sheet">
        <section className="mx-auto grid max-w-[1180px] items-center gap-6 px-5 pb-8 pt-6 lg:grid-cols-[1.05fr_0.95fr] lg:pt-8">
          <div className="text-center lg:text-left">
            <p className="pp-rise inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-black">
              <span className="pp-live-dot h-1.5 w-1.5 rounded-full bg-black" aria-hidden="true" />
              Live Planning Data + Dedicated Campaign + Detailed BD
            </p>
            <h1 className="pp-rise pp-d1 mt-5 text-[44px] font-bold leading-[1.02] tracking-[-0.035em] sm:text-[64px]">
              Win Construction Projects <span className="text-[#2563EB]">Before They Ever Go To Tender</span>
            </h1>
            <p className="pp-rise pp-d2 mx-auto mt-6 max-w-xl text-[18px] font-normal leading-8 text-[#52627A] lg:mx-0">
              We monitor all UK planning authorities for high value residential and commercial schemes, identify lead architects and developers, and run hyper personalised trigger outreach on your behalf to secure high value contractor opportunities.
            </p>
            <div className="pp-rise pp-d3 mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <a href="#demo" className="pp-cta bg-[#2563EB] px-6 py-3 text-[13px] font-semibold text-white hover:bg-[#1D4ED8]">Schedule Demo</a>
            </div>
          </div>
          <div className="pp-rise pp-d2">
            <UkCouncilMap />
          </div>
        </section>

        <section id="proof" className="pp-reveal mx-auto max-w-[1100px] px-5 pb-24 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#15803D]">Unmatched track record</p>
            <h2 className="mt-4 text-[34px] font-bold tracking-[-0.03em] sm:text-[44px]">We Don't Just Sell Data. We Deliver Warm Responses.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-7 text-[#52627A]">Here is the real campaign proof from our sending engine and live inboxes, connecting contractors with active architects eager to talk.</p>
          <div className="mt-10 grid gap-4 text-left lg:grid-cols-[1.3fr_0.7fr]">
            <article className="rounded-2xl border border-[#DCE4F0] bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-[15px] font-semibold">Annual Outreach Analytics (Last 12 Months)</h3>
                <span className="rounded-full bg-[#ECFDF5] px-3 py-1 text-[11px] font-semibold text-[#15803D]">Verified Campaign Stats</span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[['1.8M', 'Volume Delivered'], ['74.9%', 'In Inbox Open Rate'], ['£700k+', 'Pipeline Value Unlocked']].map(([value, label]) => (
                  <div key={label} className="rounded-xl bg-[#F4F7FB] px-4 py-4 text-center">
                    <div className="text-[26px] font-semibold text-[#2563EB]">{value}</div>
                    <div className="mt-1 text-[12px] text-[#64748B]">{label}</div>
                  </div>
                ))}
              </div>
            </article>
            <article className="rounded-2xl border border-[#DCE4F0] bg-white p-6 text-left">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[15px] font-semibold">Live Positive Architect Reply</h3>
                <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-[11px] font-semibold text-[#2563EB]">Interested</span>
              </div>
              <blockquote className="mt-4 text-[14px] leading-6 text-[#334155]">
                “I'm always keen to hear from experienced contractors working across London. I'm happy to have a brief introductory call. Please let me know what your director's availability looks like over the coming week or two.”
              </blockquote>
              <p className="mt-4 text-[12px] text-[#64748B]">Kit Smithson, Director, Natural Building Studio · Discovery Call Booked</p>
            </article>
          </div>
        </section>

        <section id="command" className="pp-reveal bg-[#18181B] text-white">
          <div className="mx-auto max-w-[1100px] px-5 py-20">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#15803D]">Proprietary client platform & portal</p>
              <h2 className="mt-4 text-[34px] font-bold tracking-[-0.03em] sm:text-[44px]">Your Dedicated Contractor Command Centre & Telemetry Hub</h2>
              <p className="mt-4 text-[15px] font-normal leading-7 text-[#D4D4D8]">Every client receives full access to our custom web application. Track live campaign send volumes, review weekly scraped planning applications, define custom persona filters, and manage warm inbound replies inside your personal Intent CRM.</p>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['4,820', 'Total sends', '98.4% delivered'],
                ['312', 'Opened more than twice', 'High intent'],
                ['19', 'Email opportunities', 'Tender invites'],
                ['£3.85M', 'Active pipeline', 'Quoted schemes'],
              ].map(([value, label, note]) => (
                <div key={label} className="rounded-2xl border border-[#3F3F46] bg-[#27272A] px-4 py-5">
                  <div className="text-[26px] font-bold text-white">{value}</div>
                  <div className="mt-1 text-[13px] font-semibold text-[#E4E4E7]">{label}</div>
                  <div className="mt-1 text-[12px] font-normal text-[#A1A1AA]">{note}</div>
                </div>
              ))}
            </div>
            <p className="mx-auto mt-6 max-w-3xl text-center text-[13px] font-normal leading-6 text-[#A1A1AA]">
              Vanguard Construction & Civils Ltd · Jack Robinson, Senior Account Manager & PlanningPal Growth Lead · Target postcodes W1, SW3, GU1, TN13, B1 · Next batch drop every Monday 08:00 GMT · Latest intent signal: David Hemmings (Aura Heritage) invited the contractor to tender on a £420k Westminster scheme.
            </p>
            <CommandPreview />
            <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-[#3F3F46] bg-[#27272A] p-5 sm:flex-row sm:items-center">
              <div>
                <div className="text-[16px] font-semibold">Want to see the platform in action for your postal territory?</div>
                <p className="mt-1 text-[13px] font-normal text-[#A1A1AA]">Book a 20 minute live demonstration or explore the complete platform tour with all screenshots.</p>
              </div>
              <a href="#demo" className="pp-cta shrink-0 bg-[#2563EB] px-5 py-3 text-[13px] font-semibold text-white hover:bg-[#1D4ED8]">Schedule Demo</a>
            </div>
          </div>
        </section>

        <section id="how" className="pp-reveal mx-auto max-w-[1100px] px-5 py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#2563EB]">The secret of the PlanningPal network</p>
            <h2 className="mt-4 text-[34px] font-bold tracking-[-0.03em] sm:text-[44px]">Why Tenders Are Won At Stage 1, Not Stage 4</h2>
            <p className="mt-4 text-[15px] leading-7 text-[#52627A]">Every UK construction project follows the RIBA Plan of Work. The firms that win work are already trusted by the architect and developer before procurement begins.</p>
          </div>
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {[
              ['01', 'The Common Mistake: Stage 4 Tenders', 'Most contractors and subcontractors wait until a project reaches technical tender (Stage 4). By then, the architect, QS, and developer have already formed their preferred shortlist. You compete strictly on price in a race to the bottom.', 'Low Margins & Cold Bids', false],
              ['02', 'The Timing Advantage: Stage 0 to 1', 'Our automated scraper identifies planning applications the exact week they are submitted or approved. We reach out to the specified architect and planning consultant right as design begins, positioning you as their trusted delivery partner.', 'Warm Introductions & Relationship Moat', true],
              ['03', 'The Compounding Network Effect', 'Unlike paid ads which vanish when you stop paying, an architect relationship built today yields referrals on their next 3 to 5 schemes over the next 24 months. One intro creates multiple recurring project pipelines.', 'Long Term Lifetime Value', false],
            ].map(([num, title, copy, foot, sweet]) => (
              <article key={String(num)} className={`pp-card rounded-2xl border p-6 ${sweet ? 'border-[#93C5FD] bg-[#EFF6FF]' : 'border-[#DCE4F0] bg-white'}`}>
                {sweet ? <div className="mb-3 inline-block rounded-lg bg-[#232326] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#15803D]">Our sweet spot</div> : null}
                <div className="text-[13px] font-bold text-[#2563EB]">{num}</div>
                <h3 className="mt-3 text-[18px] font-semibold">{title}</h3>
                <p className="mt-3 text-[14px] leading-6 text-[#52627A]">{copy}</p>
                <p className={`mt-5 border-t pt-4 text-[13px] font-semibold ${sweet ? 'border-[#BFDBFE] text-[#2563EB]' : 'border-[#EEF2F7] text-[#64748B]'}`}>{foot}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="packages" className="pp-reveal mx-auto max-w-[1100px] px-5 py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-[34px] font-bold tracking-[-0.03em] sm:text-[44px]">Pricing</h2>
            <p className="mt-4 text-[15px] font-normal leading-7 text-[#52627A]">From raw prefiltered intelligence to a fully managed Business Development team booking meetings directly into your diary.</p>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <article key={plan.name} className={`pp-card flex flex-col rounded-2xl border bg-white p-6 ${plan.featured ? 'border-[#2563EB] shadow-[0_16px_40px_rgba(37,99,235,0.12)]' : 'border-[#DCE4F0]'}`}>
                {plan.featured ? <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#2563EB]">Most popular tier</div> : <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#64748B]">{plan.kicker}</div>}
                <h3 className="text-[22px] font-semibold">{plan.name}</h3>
                <p className="mt-2 text-[13px] leading-6 text-[#64748B]">{plan.who}</p>
                <div className="mt-5 text-[40px] font-semibold tracking-[-0.04em] text-[#2563EB]">{plan.price}<span className="ml-1 text-[14px] font-medium text-[#94A3B8]">/ month</span></div>
                <ul className="mt-5 flex-1 space-y-2 text-[13px] leading-5 text-[#334155]">
                  {plan.points.map((point) => <li key={point}>✓ {point}</li>)}
                </ul>
                <a href="#demo" className="pp-cta mt-6 block bg-[#2563EB] px-4 py-3 text-center text-[13px] font-semibold text-white hover:bg-[#1D4ED8]">{plan.cta}</a>
              </article>
            ))}
          </div>
        </section>

        <section id="partner" className="mx-auto max-w-[1100px] px-5 pb-20">
          <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-[#232326] p-6 text-white sm:p-10 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#A1A1AA]">Direct UK planning consultation</p>
              <h2 className="mt-3 text-[30px] font-bold tracking-[-0.03em]">Need a Bespoke Territory or Volume Package?</h2>
              <p className="mt-3 text-[14px] font-normal leading-6 text-[#D4D4D8]">Speak with our pipeline strategists to map out your target boroughs, local planning authorities, and estimated monthly project flow.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a href={`tel:${PUBLIC_PHONE_TEL}`} className="whitespace-nowrap bg-[#2563EB] px-5 py-3 text-[13px] font-semibold text-white hover:bg-[#1D4ED8]">Call: {PUBLIC_PHONE_DISPLAY}</a>
              <a href={`mailto:${PUBLIC_EMAIL}`} className="whitespace-nowrap bg-[#2563EB] px-5 py-3 text-[13px] font-semibold text-white hover:bg-[#1D4ED8]">Email: {PUBLIC_EMAIL}</a>
            </div>
          </div>
        </section>

        <section id="demo" className="pp-reveal mx-auto max-w-[1100px] px-5 pb-24">
          <div className="grid gap-10 rounded-3xl border border-[#DCE4F0] bg-white p-6 sm:p-10 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <h2 className="text-[30px] font-bold tracking-[-0.03em]">Schedule Demo</h2>
              <p className="mt-3 text-[14px] leading-6 text-[#52627A]">Tell us the trade and the counties. Hitcaliber Ltd reads this note. Nothing is emailed automatically from this form.</p>
            </div>
            {sent ? (
              <p className="self-center text-[15px] leading-7">Received. Someone at Hitcaliber will use the address you gave.</p>
            ) : (
              <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
                <Field label="Name"><input required name="name" className={fieldClass} /></Field>
                <Field label="Work email"><input required type="email" name="email" className={fieldClass} /></Field>
                <Field label="Company"><input required name="company" className={fieldClass} /></Field>
                <Field label="Trade"><input name="trade" className={fieldClass} /></Field>
                <Field label="Counties and anything else" wide><textarea name="note" rows={4} className={fieldClass} /></Field>
                {error ? <p className="text-[13px] text-[#B91C1C] sm:col-span-2">{error}</p> : null}
                <button disabled={pending} className="pp-cta bg-[#2563EB] px-4 py-3 text-[13px] font-semibold text-white hover:bg-[#1D4ED8] sm:col-span-2 disabled:opacity-60">{pending ? 'Sending…' : 'Schedule Demo'}</button>
              </form>
            )}
          </div>
        </section>

        <section id="team" className="pp-reveal mx-auto max-w-[1100px] px-5 pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-black">Team</p>
            <h2 className="mt-4 text-[34px] font-bold tracking-[-0.03em] sm:text-[44px]">Team</h2>
            <p className="mt-4 text-[15px] font-normal leading-7 text-[#52627A]">Names and photos will be added here.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {['One', 'Two', 'Three', 'Four'].map((slot) => (
              <article key={slot} className="rounded-2xl border border-[#E4E4E7] bg-white p-4">
                <div className="grid aspect-square place-items-center rounded-lg bg-[#F4F4F5] text-[12px] font-medium uppercase tracking-[0.14em] text-[#A1A1AA]">Photo</div>
                <div className="mt-4 text-[16px] font-semibold text-[#A1A1AA]">Name</div>
                <div className="mt-1 text-[13px] font-normal text-[#D4D4D8]">Role</div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-[#DCE4F0] bg-white">
        <div className="mx-auto max-w-[1100px] px-5 py-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <img src="/brand/logo-horizontal.svg" alt="PlanningPal" className="h-7 w-auto" />
              <p className="mt-2 max-w-[34ch] text-left text-[13px] text-[#52627A]">Automated UK Planning Intelligence & Architect Outreach Engine</p>
              <p className="mt-3 text-[13px] text-[#52627A]">{PUBLIC_EMAIL} · {PUBLIC_PHONE_DISPLAY}</p>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-16">
              <nav className="flex flex-col gap-2 text-[13px] font-semibold text-[#2563EB]" aria-label="Product">
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#64748B]">Product</div>
                <a href="/">Home</a>
                <a href="#command">Platform Tour</a>
                <a href="#packages">Pricing</a>
                <a href="#demo">Schedule Demo</a>
              </nav>
              <nav className="flex flex-col gap-2 text-[13px] font-semibold text-[#2563EB]" aria-label="Company">
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#64748B]">Company</div>
                <a href="#team">Team</a>
                <a href="#partner">Partner Programme</a>
                <a href="#privacy">Privacy Policy</a>
                <a href="#terms">Terms of Service</a>
              </nav>
            </div>
          </div>
          <div id="privacy" className="mx-auto mt-10 max-w-3xl text-center text-[12px] leading-6 text-[#64748B]">
            <p>Registered Office: PO Box 4385, 16751943, Companies House Default Address, Cardiff, CF14 8LH, United Kingdom.</p>
            <p id="terms" className="mt-4">© 2026 Hitcaliber Ltd. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const fieldClass = 'mt-2 w-full rounded-xl border border-[#DCE4F0] bg-white px-3 py-3 text-[14px] font-medium text-[#172033] outline-none'

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`text-[11px] font-semibold uppercase tracking-wider text-[#64748B] ${wide ? 'sm:col-span-2' : ''}`}>
      {label}
      {children}
    </label>
  )
}

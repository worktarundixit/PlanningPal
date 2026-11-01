import { useState, type FormEvent } from 'react'
import { api } from '../lib/api'

const stages = [
  { id: '0', name: 'Strategic definition', window: true },
  { id: '1', name: 'Preparation and brief', window: true },
  { id: '2', name: 'Concept design', window: true },
  { id: '3', name: 'Spatial coordination', window: false },
  { id: '4', name: 'Technical design', window: false },
  { id: '5', name: 'Manufacturing', window: false },
  { id: '6', name: 'Construction', window: false },
  { id: '7', name: 'Use', window: false },
]

const columns = [
  ['Heading and proposal', 'The statutory description, not a rewritten sales summary.'],
  ['£m value from / to', 'A published bracket when the portal states one, kept in the export.'],
  ['Site address', 'Raw address plus the structured lines and postcode area.'],
  ['Applicant', 'Developer or owner, with the address and phone the register published.'],
  ['Architect or agent', 'Named contact, practice, studio address, phone and email when present.'],
  ['Authority and dates', 'Council, application reference, stage, publication date, portal URL.'],
]

export function Landing() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

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
    <div className="min-h-screen bg-[#F4F7FB] text-[#172033]">
      <a href="#sheet" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2">Skip to the brief</a>
      <header className="sticky top-0 z-30 border-b border-[#DCE4F0] bg-[#F4F7FB]/95 backdrop-blur-md">
        <div className="mx-auto flex h-[78px] max-w-[1180px] items-center justify-between px-5">
          <a href="/" className="flex items-center">
            <img src="/brand/logo-horizontal.svg" alt="PlanningPal" className="h-8 w-auto" />
          </a>
          <nav className="hidden items-center gap-6 text-[11px] font-semibold text-[#52627A] md:flex" aria-label="Page">
            <a href="#riba" className="hover:text-[#172554]">RIBA window</a>
            <a href="#register" className="hover:text-[#172554]">Monday register</a>
            <a href="#packages" className="hover:text-[#172554]">Packages</a>
            <a href="/app" className="hover:text-[#172554]">Sign in</a>
            <a href="#conversation" className="rounded-lg bg-[#172554] px-4 py-2.5 text-white hover:bg-[#1E3A8A]">Book a conversation</a>
          </nav>
          <a href="/app" className="rounded-lg border border-[#DCE4F0] bg-white px-3 py-2 text-[10px] font-semibold text-[#172554] md:hidden">Sign in</a>
        </div>
      </header>

      <main id="sheet">
        <section className="mx-auto grid max-w-[1180px] gap-10 px-5 py-16 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#2563EB]">For UK trade contractors</p>
            <h1 className="mt-4 max-w-xl font-display text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] text-[#172033] sm:text-[52px]">Meet the architect while the scheme is still in planning.</h1>
            <p className="mt-6 max-w-xl text-[15px] leading-7 text-[#52627A]">By RIBA Stage 4 the tender list is usually closed and the specification is already written. PlanningPal watches local planning registers and puts the architect, the applicant and the scheme on your desk at Stages 0 to 2, when early contractor involvement is still possible.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#conversation" className="rounded-lg bg-[#172554] px-5 py-3 text-[12px] font-semibold text-white hover:bg-[#1E3A8A]">Book a conversation</a>
              <a href="/app" className="rounded-lg border border-[#DCE4F0] bg-white px-5 py-3 text-[12px] font-semibold text-[#172554]">Open the command centre</a>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-[#DCE4F0] pt-6">
              {[['376', 'Planning authorities'], ['44', 'Columns in every drop'], ['Mon 08:00', 'Weekly delivery']].map(([value, label]) => (
                <div key={label}>
                  <dt className="font-display text-[22px] font-semibold text-[#172554]">{value}</dt>
                  <dd className="mt-1 text-[10px] leading-4 text-[#64748B]">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
          <aside className="rounded-xl border border-[#DCE4F0] bg-white p-5 shadow-[0_1px_2px_rgba(30,58,138,0.04)]" aria-label="Example scheme card from the command centre">
            <div className="flex items-center justify-between border-b border-[#EEF2F7] pb-4">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#64748B]">Scheme dossier</div>
                <div className="mt-1 text-[10px] text-[#94A3B8]">26/02630/FUL · Croydon</div>
              </div>
              <span className="rounded-full bg-[#E6F6D5] px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.08em] text-[#397047]">High fit</span>
            </div>
            <h2 className="mt-5 font-display text-[22px] font-semibold leading-tight">Rear extension, Thornton Heath</h2>
            <p className="mt-2 text-[11px] text-[#718096]">1041 London Road · detailed plans approved</p>
            <div className="mt-5 grid grid-cols-3 overflow-hidden rounded-lg border border-[#DCE4F0]">
              {[['£0.25–0.45m', 'Value'], ['Approved', 'Stage'], ['Dwelling', 'Type']].map(([value, label]) => (
                <div key={label} className="border-r border-[#EEF2F7] p-3 last:border-0">
                  <div className="font-display text-[13px] font-semibold">{value}</div>
                  <div className="mt-1 text-[8px] uppercase tracking-wider text-[#94A3B8]">{label}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-lg bg-[#F8FAFD] p-4 text-[11px] leading-6 text-[#52627A]">
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">Architect / agent</div>
              <div className="mt-2 font-semibold text-[#1E293B]">Kashif Syed · Arista</div>
              <div className="mt-1">k.syed@arista-architecture.com</div>
              <div>07710 183 612</div>
            </div>
            <p className="mt-4 text-[9px] leading-5 text-[#94A3B8]">A real row from the seeded residential register. The command centre opens the full 44-column record, the portal link, and the CRM card.</p>
          </aside>
        </section>

        <section id="riba" className="border-y border-[#DCE4F0] bg-white">
          <div className="mx-auto max-w-[1180px] px-5 py-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#2563EB]">The timing</p>
            <h2 className="mt-3 max-w-2xl font-display text-[32px] font-semibold tracking-[-0.03em]">RIBA Stages 0–2 are the commercial window.</h2>
            <p className="mt-4 max-w-2xl text-[13px] leading-6 text-[#52627A]">Public tender notices usually appear at Stages 4 to 6, after the architect has already chosen who is allowed to price the work. PlanningPal is built for the earlier conversation: the planning application itself.</p>
            <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {stages.map((stage) => (
                <li key={stage.id} className={`rounded-xl border p-4 ${stage.window ? 'border-[#93C5FD] bg-[#EFF6FF]' : 'border-[#E2E8F0] bg-[#F8FAFD]'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[20px] font-semibold text-[#172554]">Stage {stage.id}</span>
                    <span className={`rounded-full px-2 py-1 text-[8px] font-bold uppercase tracking-wider ${stage.window ? 'bg-[#172554] text-white' : 'bg-[#E2E8F0] text-[#64748B]'}`}>{stage.window ? 'In window' : 'Usually late'}</span>
                  </div>
                  <div className="mt-3 text-[12px] font-semibold text-[#334155]">{stage.name}</div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="register" className="mx-auto max-w-[1180px] px-5 py-16">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#2563EB]">The Monday register</p>
              <h2 className="mt-3 font-display text-[32px] font-semibold tracking-[-0.03em]">One 44-column file. Same order every week.</h2>
              <p className="mt-4 text-[13px] leading-6 text-[#52627A]">Category 1 deliveries are a vetted Excel or CSV drop at 08:00 on Monday: about 40 to 50 schemes per licensed county, with the portal link and the architect’s phone and email when the register published them. Internal CRM notes stay out of that file.</p>
            </div>
            <div className="overflow-hidden rounded-xl border border-[#DCE4F0] bg-white">
              {columns.map(([title, detail]) => (
                <div key={title} className="grid gap-2 border-b border-[#EEF2F7] px-5 py-4 last:border-0 sm:grid-cols-[200px_1fr]">
                  <div className="text-[12px] font-semibold text-[#172554]">{title}</div>
                  <div className="text-[12px] leading-5 text-[#52627A]">{detail}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#172554] text-white">
          <div className="mx-auto grid max-w-[1180px] gap-10 px-5 py-16 lg:grid-cols-[1fr_.8fr] lg:items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#38BDF8]">Where the schemes come from</p>
              <h2 className="mt-3 font-display text-[32px] font-semibold tracking-[-0.03em]">376 local planning authorities. No single national feed.</h2>
              <p className="mt-4 max-w-xl text-[13px] leading-7 text-white/70">England, Scotland and Wales publish applications on Idox, Northgate, Civica and a handful of other portals. The Sunday batch reads the previous week. London and the other large cities are checked again overnight. PlanIt is only a fallback, and it runs a day or two behind the council sites.</p>
              <ul className="mt-6 space-y-2 text-[12px] text-white/80">
                <li>Idox Public Access — the majority of councils</li>
                <li>Northgate Planning Explorer — session-heavy ASP.NET</li>
                <li>Civica APP / FastWeb — the smaller remainder</li>
              </ul>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-6" aria-hidden="true">
              <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40">Authority lattice · illustrative</div>
              <svg viewBox="0 0 220 280" className="mx-auto mt-4 h-72 w-full max-w-[240px]">
                {Array.from({ length: 140 }, (_, index) => {
                  const col = index % 10
                  const row = Math.floor(index / 10)
                  const x = 28 + col * 16
                  const y = 16 + row * 16
                  const inBritain = y > 24 && y < 250 && x > 40 + Math.abs(row - 8) && x < 180 - Math.max(0, row - 10) * 2
                  return inBritain ? <circle key={index} cx={x} cy={y} r={row % 5 === 0 ? 2.4 : 1.4} fill={row % 5 === 0 ? '#38BDF8' : '#93C5FD'} /> : null
                })}
              </svg>
              <p className="text-center text-[10px] text-white/45">Not a boundary map. A count of places the batch is meant to cover.</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1180px] px-5 py-16">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#2563EB]">After the drop</p>
          <h2 className="mt-3 max-w-2xl font-display text-[32px] font-semibold tracking-[-0.03em]">The command centre keeps the scheme, the person and the reply together.</h2>
          <div className="mt-10 space-y-4">
            {[
              ['01  Search', 'Filter the approved register by county, value, authority and whether a direct phone and email were published.'],
              ['02  Intent', 'Five stages: new lead, active outreach, high intent, warm engagement, tender opportunity. Three opens or a deck click moves a card to high intent.'],
              ['03  Outreach', 'Category 2 and 3 add secondary domains and a shared inbox. Replies are stored here. This build does not send live email.'],
            ].map(([title, copy]) => (
              <article key={title} className="grid gap-3 rounded-xl border border-[#DCE4F0] bg-white p-6 sm:grid-cols-[140px_1fr] sm:items-center">
                <h3 className="font-display text-[16px] font-semibold text-[#172554]">{title}</h3>
                <p className="text-[13px] leading-6 text-[#52627A]">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="packages" className="border-t border-[#DCE4F0] bg-white">
          <div className="mx-auto max-w-[1180px] px-5 py-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#2563EB]">Commercial packages</p>
            <h2 className="mt-3 font-display text-[32px] font-semibold tracking-[-0.03em]">Three ways to buy the same register.</h2>
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {[
                ['Category 1', 'Planning leads feed', '£99–£299', 'a month', 'Weekly Monday file for a county. 40 to 50 vetted schemes, 44 columns, portal links, architect phone and email when published.'],
                ['Category 2', 'Leads and outreach', '£950–£2,750', 'a month', 'The feed, plus 6 to 12 sending inboxes on secondary domains and 600 to 4,000 decision-makers contacted in a month, with intent signals.'],
                ['Category 3', 'Business development partner', '£2,450–£3,950', 'a month, plus a success fee', 'The data and the inboxes, plus a person who follows up by phone. The target is 6 to 18 booked meetings a month.'],
              ].map(([tier, name, price, cadence, copy]) => (
                <article key={tier} className="flex flex-col rounded-xl border border-[#DCE4F0] p-6">
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#2563EB]">{tier}</div>
                  <h3 className="mt-2 font-display text-[20px] font-semibold">{name}</h3>
                  <div className="mt-5 font-display text-[28px] font-semibold text-[#172554]">{price}</div>
                  <div className="mt-1 text-[11px] text-[#94A3B8]">{cadence}</div>
                  <p className="mt-4 flex-1 text-[12px] leading-6 text-[#52627A]">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="conversation" className="mx-auto max-w-[1180px] px-5 py-16">
          <div className="grid gap-8 rounded-xl bg-[#172554] p-6 text-white sm:p-10 lg:grid-cols-[.9fr_1.1fr]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#38BDF8]">A conversation, not a trial login</p>
              <h2 className="mt-3 font-display text-[30px] font-semibold tracking-[-0.03em]">Tell us the trade and the counties.</h2>
              <p className="mt-4 text-[13px] leading-6 text-white/65">Hitcaliber Ltd reads this note. Nothing is emailed automatically from this form. Company No. 16751943 · PO Box 4385, Cardiff, CF14 8LH.</p>
            </div>
            {sent ? (
              <p className="self-center rounded-xl bg-white/10 p-6 text-[13px] leading-6">Received. Someone at Hitcaliber will use the address you gave. You can also sign in to the seeded command centre while you look around.</p>
            ) : (
              <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
                <label className="text-[9px] font-bold uppercase tracking-wider text-white/50">Name<input required name="name" className="mt-2 w-full rounded-lg border border-white/10 bg-white px-3 py-3 text-[12px] font-normal normal-case tracking-normal text-[#172033] outline-none" /></label>
                <label className="text-[9px] font-bold uppercase tracking-wider text-white/50">Work email<input required type="email" name="email" className="mt-2 w-full rounded-lg border border-white/10 bg-white px-3 py-3 text-[12px] font-normal normal-case tracking-normal text-[#172033] outline-none" /></label>
                <label className="text-[9px] font-bold uppercase tracking-wider text-white/50">Company<input required name="company" className="mt-2 w-full rounded-lg border border-white/10 bg-white px-3 py-3 text-[12px] font-normal normal-case tracking-normal text-[#172033] outline-none" /></label>
                <label className="text-[9px] font-bold uppercase tracking-wider text-white/50">Trade<input name="trade" placeholder="Groundworks, RC frame…" className="mt-2 w-full rounded-lg border border-white/10 bg-white px-3 py-3 text-[12px] font-normal normal-case tracking-normal text-[#172033] outline-none" /></label>
                <label className="text-[9px] font-bold uppercase tracking-wider text-white/50 sm:col-span-2">Counties and anything else<textarea name="note" rows={4} className="mt-2 w-full rounded-lg border border-white/10 bg-white px-3 py-3 text-[12px] font-normal normal-case tracking-normal text-[#172033] outline-none" /></label>
                {error && <p className="text-[11px] text-[#FCA5A5] sm:col-span-2">{error}</p>}
                <button disabled={pending} className="rounded-lg bg-[#38BDF8] px-4 py-3 text-[12px] font-semibold text-[#172554] sm:col-span-2 disabled:opacity-60">{pending ? 'Sending…' : 'Book a conversation'}</button>
              </form>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-[#DCE4F0]">
        <div className="mx-auto grid max-w-[1180px] gap-6 px-5 py-10 text-[11px] leading-6 text-[#64748B] sm:grid-cols-[1.2fr_.8fr]">
          <div>
            <img src="/brand/logo-horizontal.svg" alt="PlanningPal" className="h-6 w-auto" />
            <p className="mt-2 max-w-xl">Operated by Hitcaliber Ltd, Company No. 16751943, PO Box 4385, Cardiff, CF14 8LH. aecpipeline.co.uk · app.aecpipeline.co.uk</p>
            <p className="mt-3 max-w-xl">Business contact details are processed under legitimate interests for professional correspondence about a live planning reference. Messages to limited companies, LLPs and public bodies identify the sender, give this postal address, and include a way to opt out. Opt-outs are suppressed across client accounts.</p>
          </div>
          <div className="sm:text-right">
            <a href="/app" className="font-semibold text-[#2563EB]">Sign in</a>
            <div className="mt-2">Planning leads · Intent CRM · Outreach</div>
          </div>
        </div>
      </footer>
    </div>
  )
}

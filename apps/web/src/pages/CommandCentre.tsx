import { useEffect, useMemo, useRef, useState } from 'react'
import type { Scheme, UserProfile } from '@planningpal/shared'
import { EmptyState, LoadingBlock, SampleBars } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { ToastHost } from '../components/ToastHost'
import { exportSchemes, notify } from '../lib/notify'
import { supabase } from '../lib/auth-client'
import { ClientOnboardingList, GettingStarted } from '../components/GettingStarted'
import { api, type ClientOnboarding, type OnboardingState, type Overview } from '../lib/api'
import type { CrmTab, ReportsTab, SetupTab } from '../types'
import { StatusScreen } from '../components/StatusScreen'
import { WorkspaceView } from './WorkspaceView'

const nav = [
  { label: 'Overview', icon: 'grid' as const },
  { label: 'Planning search', icon: 'search' as const },
  { label: 'Saved schemes', icon: 'building' as const },
  { label: 'Campaigns', icon: 'send' as const },
  { label: 'CRM & intent', icon: 'signal' as const },
  { label: 'Reports & delivery', icon: 'chart' as const },
  { label: 'Workspace setup', icon: 'settings' as const },
  { label: 'Ingestion', icon: 'download' as const },
  { label: 'Campaign provider', icon: 'briefcase' as const },
]

export function CommandCentre() {
  const [active, setActive] = useState('Overview')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Scheme | null>(null)
  const [saved, setSaved] = useState<string[]>([])
  const [mobileNav, setMobileNav] = useState(false)
  const [data, setData] = useState<Scheme[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [overview, setOverview] = useState<Overview | null>(null)
  const [region, setRegion] = useState('All regions')
  const [crmTab, setCrmTab] = useState<CrmTab>('pipeline')
  const [inboxUnread, setInboxUnread] = useState(3)
  const [reportsTab, setReportsTab] = useState<ReportsTab>('reports')
  const [setupTab, setSetupTab] = useState<SetupTab>('persona')
  const [campaignSettingsOpen, setCampaignSettingsOpen] = useState(false)
  const [campaignCreateSignal, setCampaignCreateSignal] = useState(0)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const [profile, setProfile] = useState<UserProfile>({ name: '', role: '', company: '', email: '' })
  const [permissions, setPermissions] = useState<string[]>([])
  const [orgRole, setOrgRole] = useState<string | null>(null)
  const [checklist, setChecklist] = useState<OnboardingState['checklist'] | null>(null)
  const [clients, setClients] = useState<ClientOnboarding[] | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  const can = (permission: string) => permissions.includes(permission)

  const toggleSave = async (id: string) => {
    if (!can('saved.write')) {
      notify('Your role can view schemes. Saving is turned off.')
      return
    }
    const already = saved.includes(id)
    setSaved((items) => already ? items.filter((item) => item !== id) : [...items, id])
    try {
      if (already) await api.unsave(id)
      else await api.save(id)
    } catch {
      setSaved((items) => already ? [...items, id] : items.filter((item) => item !== id))
      notify('Could not update saved schemes')
    }
  }

  useEffect(() => {
    let cancelled = false
    api.me()
      .then(async (me) => {
        if (cancelled) return
        setProfile(me)
        setPermissions(me.permissions)
        setOrgRole(me.orgRole)
        const flow = await api.onboarding()
        if (flow.step !== 'done') {
          window.location.assign('/onboarding')
          return
        }
        if (!flow.checklistDismissed) setChecklist(flow.checklist)
        if (me.platformRole === 'super_admin') {
          const listed = await api.onboardingClients().catch(() => ({ data: [] as ClientOnboarding[] }))
          if (!cancelled) setClients(listed.data)
        }
        const [leads, savedIds, overview] = await Promise.all([api.leads(), api.saved(), api.overview()])
        if (cancelled) return
        setData(leads.data)
        setSaved(savedIds.ids)
        setOverview(overview)
        setLoadError('')
        setSessionReady(true)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const message = error instanceof Error ? error.message : 'The planning API is unavailable'
        if (message.includes('session has expired')) return
        setLoadError(message)
        setSessionReady(true)
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!accountOpen) return
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) setAccountOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [accountOpen])

  const filteredData = useMemo(() => region === 'All regions' ? data : data.filter((scheme) => scheme.region === region), [data, region])
  const regions = useMemo(() => [...new Set(data.map((scheme) => scheme.region).filter(Boolean))].sort() as string[], [data])

  const visibleSchemes = useMemo(() => filteredData.filter((scheme) =>
    `${scheme.title} ${scheme.location} ${scheme.type}`.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 6), [filteredData, query])

  const visibleNav = nav.filter((item) => {
    if (item.label === 'Ingestion') return can('ingest.admin')
    if (item.label === 'Campaign provider') return can('campaign.provider')
    return true
  })

  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] p-8">
        <div className="mx-auto grid max-w-5xl gap-4">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-[#E2E8F0]" />
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl bg-white" />)}</div>
          <div className="h-80 animate-pulse rounded-xl bg-white" />
        </div>
      </div>
    )
  }

  if (loadError.includes('do not have access')) return <StatusScreen kind="forbidden" />
  const pageGuard: Record<string, string> = { Ingestion: 'ingest.admin', 'Campaign provider': 'campaign.provider', Billing: 'billing.manage' }
  if (pageGuard[active] && !can(pageGuard[active])) return <StatusScreen kind="forbidden" />
  if (loadError.includes('offline')) return <StatusScreen kind="offline" onRetry={() => window.location.reload()} />

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#172033]">
      <ToastHost />
      <aside className={`fixed inset-y-0 left-0 z-40 w-[248px] bg-[#172554] text-white transition-transform duration-300 lg:translate-x-0 ${mobileNav ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col">
          <div className="flex h-[78px] items-center justify-between border-b border-white/8 px-6">
            <div className="min-w-0">
              <img src="/brand/logo-horizontal-white.svg" alt="PlanningPal" className="h-[22px] w-auto" />
              <div>
                <label className="mt-1.5 flex items-center gap-1 text-white/45">
                  <Icon name="map" size={10} />
                  <select value={region} onChange={(event) => setRegion(event.target.value)} className="max-w-[130px] cursor-pointer bg-transparent text-[9px] font-semibold uppercase tracking-[0.12em] outline-none">
                    <option className="text-[#172033]">All regions</option>
                    {regions.map((item) => <option key={item} className="text-[#172033]">{item}</option>)}
                  </select>
                </label>
              </div>
            </div>
            <button className="text-white/60 lg:hidden" onClick={() => setMobileNav(false)} aria-label="Close navigation"><Icon name="close" /></button>
          </div>

          <div className="px-3 pt-6">
            <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Workspace</div>
            <nav className="space-y-1">
              {visibleNav.map((item) => (
                <button
                  key={item.label}
                  onClick={() => { setActive(item.label); setMobileNav(false) }}
                  className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition ${active === item.label ? 'bg-white/10 font-medium text-white' : 'text-white/55 hover:bg-white/5 hover:text-white'}`}
                >
                  <span className={active === item.label ? 'text-[#38BDF8]' : 'text-white/45'}><Icon name={item.icon} size={17} /></span>
                  <span className="flex-1">{item.label}</span>
                  {(item.label === 'Saved schemes' ? saved.length : item.label === 'CRM & intent' ? (overview?.metrics.priorityActions ?? 0) : 0) > 0 && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${active === item.label ? 'bg-[#38BDF8] text-[#172554]' : 'bg-white/10 text-white/55'}`}>{item.label === 'Saved schemes' ? saved.length : overview?.metrics.priorityActions ?? 8}</span>}
                </button>
              ))}
            </nav>
          </div>

          <div className="mx-4 mt-auto mb-4">
            <div className="mb-3 rounded-lg border border-white/10 bg-white/[0.045] p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[9px] font-semibold text-[#38BDF8]"><Icon name="spark" size={11} /> PIPELINE HEALTH</div>
                <div className="font-display text-[16px] font-semibold">{overview?.metrics.pipelineHealth ? `${overview.metrics.pipelineHealth}%` : '—'}</div>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#38BDF8]" style={{ width: `${overview?.metrics.pipelineHealth ?? 0}%` }} /></div>
              <div className="mt-2 flex justify-between text-[8px] text-white/40"><span>{overview?.metrics.inboxesHealthy ?? 'No inboxes yet'}</span><span>{overview?.metrics.deliveryRate ?? 'No sends yet'}</span></div>
            </div>
            <div ref={accountMenuRef} className="relative mt-2 border-t border-white/8 pt-3">
              {accountOpen && <div className="absolute bottom-[58px] left-0 right-0 overflow-hidden rounded-xl border border-white/10 bg-[#203363] p-1.5 shadow-2xl">
                <div className="border-b border-white/10 px-3 py-2.5"><div className="text-[10px] font-semibold text-white">{profile.company}</div><div className="mt-1 text-[8px] text-white/40">Team Plan</div></div>
                <button onClick={() => { setActive('My profile'); setAccountOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[10px] text-white/65 hover:bg-white/10 hover:text-white"><Icon name="users" size={13} /> My profile</button>
                {can('billing.manage') && <button onClick={() => { setActive('Billing'); setAccountOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[10px] text-white/65 hover:bg-white/10 hover:text-white"><Icon name="briefcase" size={13} /> Billing</button>}
                <button onClick={() => { void supabase?.auth.signOut().finally(() => { window.location.assign('/') }) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[10px] text-[#FCA5A5] hover:bg-white/10"><Icon name="arrow" size={13} /> Sign out</button>
              </div>}
              <button onClick={() => setAccountOpen((open) => !open)} className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-white/5" aria-expanded={accountOpen}>
                <div className="grid h-9 w-9 place-items-center rounded-full bg-[#BDD8FF] text-[11px] font-bold text-[#152328]">{(profile.name || '?').split(' ').map((name) => name[0]).join('').slice(0, 2)}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium">{profile.name}</div>
                  <div className="truncate text-[10px] text-white/35">{profile.role}</div>
                </div>
                <span className={`mr-1 transition-transform ${accountOpen ? '-rotate-90' : 'rotate-90'}`}><Icon name="chevron" size={14} /></span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-h-screen lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-[78px] items-center justify-between border-b border-[#DCE4F0] bg-[#F4F7FB]/95 px-4 backdrop-blur-md sm:px-7 lg:px-9">
          <div className="flex items-center gap-3">
            <button className="grid h-9 w-9 place-items-center rounded-lg border border-[#D8DDD5] lg:hidden" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Icon name="menu" /></button>
            <div>
              <h1 className="font-display text-xl font-semibold tracking-[-0.02em] sm:text-[23px]">{active === 'Overview' ? 'Command centre' : active}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {active === 'CRM & intent' && (
              <>
                <nav className="hidden items-center gap-1 md:flex" aria-label="CRM sections">
                  {[
                    ['pipeline', 'Pipeline'],
                    ['intent', 'Intent'],
                    ['inbox', 'Inbox'],
                    ['tasks', 'Tasks'],
                    ['opportunities', 'Opportunities'],
                    ['contacts', 'Contacts'],
                  ].map(([tab, label]) => (
                    <button key={tab} onClick={() => setCrmTab(tab as CrmTab)} className={`rounded-md px-3 py-2 text-[10px] font-semibold transition ${crmTab === tab ? 'bg-[#DBEAFE] text-[#1D4ED8]' : 'text-[#64748B] hover:bg-[#E8EDF5]'}`}>
                      {label}{tab === 'tasks' && <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[7px] ${crmTab === tab ? 'bg-[#BFDBFE] text-[#1D4ED8]' : 'bg-[#FEE2E2] text-[#B91C1C]'}`}>8</span>}
                      {tab === 'inbox' && inboxUnread > 0 && <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[7px] ${crmTab === tab ? 'bg-[#BFDBFE] text-[#1D4ED8]' : 'bg-[#DBEAFE] text-[#1D4ED8]'}`}>{inboxUnread}</span>}
                      {tab === 'contacts' && <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[7px] ${crmTab === tab ? 'bg-[#BFDBFE] text-[#1D4ED8]' : 'bg-[#E2E8F0] text-[#64748B]'}`}>{filteredData.filter((scheme) => scheme.architect !== 'Contact not published').length}</span>}
                    </button>
                  ))}
                </nav>
                <select value={crmTab} onChange={(event) => setCrmTab(event.target.value as CrmTab)} className="max-w-[88px] rounded-lg border border-[#DCE4F0] bg-transparent px-2 py-2 text-[9px] font-semibold text-[#52627A] outline-none md:hidden" aria-label="CRM section">
                  <option value="pipeline">Pipeline</option>
                  <option value="intent">Intent</option>
                  <option value="inbox">Inbox ({inboxUnread})</option>
                  <option value="tasks">Tasks (8)</option>
                  <option value="opportunities">Opportunities</option>
                  <option value="contacts">Contacts ({filteredData.filter((scheme) => scheme.architect !== 'Contact not published').length})</option>
                </select>
              </>
            )}
            {active === 'Reports & delivery' && (
              <nav className="flex items-center gap-1" aria-label="Reports and delivery sections">
                {[['reports', 'Performance reports'], ['delivery', 'Delivery & SLA']].map(([tab, label]) => (
                  <button key={tab} onClick={() => setReportsTab(tab as ReportsTab)} className={`rounded-md px-3 py-2 text-[10px] font-semibold transition ${reportsTab === tab ? 'bg-[#DBEAFE] text-[#1D4ED8]' : 'text-[#64748B] hover:bg-[#E8EDF5]'}`}>{label}</button>
                ))}
              </nav>
            )}
            {active === 'Workspace setup' && (
              <nav className="flex items-center gap-1" aria-label="Workspace setup sections">
                {[['persona', 'Persona studio'], ['settings', 'Workspace settings'], ['team', 'Team management']].map(([tab, label]) => (
                  <button key={tab} onClick={() => setSetupTab(tab as SetupTab)} className={`rounded-md px-3 py-2 text-[10px] font-semibold transition ${setupTab === tab ? 'bg-[#DBEAFE] text-[#1D4ED8]' : 'text-[#64748B] hover:bg-[#E8EDF5]'}`}>{label}</button>
                ))}
              </nav>
            )}
            {active === 'Campaigns' && (
              <nav className="flex items-center gap-1" aria-label="Campaign actions">
                <button disabled={!can('campaigns.write')} onClick={() => setCampaignSettingsOpen((open) => !open)} className={`rounded-md px-3 py-2 text-[10px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${campaignSettingsOpen ? 'bg-[#DBEAFE] text-[#1D4ED8]' : 'text-[#64748B] hover:bg-[#E8EDF5]'}`}>Campaign settings</button>
                <button disabled={!can('campaigns.write')} onClick={() => setCampaignCreateSignal((signal) => signal + 1)} className="rounded-md px-3 py-2 text-[10px] font-semibold text-[#2563EB] transition hover:bg-[#DBEAFE] disabled:cursor-not-allowed disabled:opacity-40">+ New campaign</button>
              </nav>
            )}
            {active === 'Overview' && <button onClick={() => { setActive('CRM & intent'); notify('Showing your priority CRM actions') }} className="relative grid h-9 w-9 place-items-center rounded-lg border border-[#D8DDD5] bg-white text-[#52605F] hover:border-[#AEB8B3]">
              <Icon name="bell" size={16} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#E96345] ring-2 ring-white" />
            </button>}
            {active === 'Overview' && (
              <button disabled={!can('leads.export')} onClick={() => exportSchemes(filteredData)} className="hidden items-center gap-2 rounded-lg bg-[#172554] px-4 py-2.5 text-[11px] font-semibold text-white shadow-sm hover:bg-[#1E3A8A] disabled:cursor-not-allowed disabled:opacity-40 sm:flex">
                <Icon name="download" size={14} /> Export leads
              </button>
            )}
          </div>
        </header>

        {loading ? <div className="mx-auto max-w-[1600px] p-4 sm:p-7 lg:p-9"><LoadingBlock label="Loading the command centre" /></div> : loadError ? <div className="mx-auto max-w-[1600px] p-4 sm:p-7 lg:p-9"><EmptyState kind="error" title="The command centre could not be loaded." action={{ label: 'Try again', onClick: () => window.location.reload() }} /></div> : active === 'Overview' ? <div className="mx-auto max-w-[1600px] p-4 sm:p-7 lg:p-9">
          {clients && <ClientOnboardingList clients={clients} />}
          {checklist && <GettingStarted items={checklist} onDismiss={() => { setChecklist(null); void api.saveOnboarding({ action: 'dismiss-checklist' }).catch(() => setChecklist(checklist)) }} />}
          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[
              { label: 'Approved schemes', value: filteredData.length.toLocaleString(), meta: data.length ? (region === 'All regions' ? 'All regions' : region) : '—', note: data.length ? 'active region' : 'no leads yet', icon: 'building' as const },
              { label: 'Agent contacts found', value: filteredData.filter((scheme) => scheme.email || scheme.phone).length.toLocaleString(), meta: filteredData.length ? `${Math.round(filteredData.filter((scheme) => scheme.email || scheme.phone).length / filteredData.length * 100)}%` : '—', note: 'contact coverage', icon: 'users' as const },
              { label: 'High-intent signals', value: overview?.metrics.highIntentSignals ?? String(overview?.intent.length ?? 0), meta: overview?.metrics.highIntentNew ?? (overview?.intent.length ? 'live' : '—'), note: overview?.intent.length ? 'need attention' : 'none yet', icon: 'signal' as const },
              { label: 'Meetings booked', value: overview?.metrics.meetingsBooked ?? '0', meta: overview?.metrics.meetingsTarget ?? '—', note: 'of monthly target', icon: 'calendar' as const },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-[#DCE4F0] bg-white p-4 shadow-[0_1px_2px_rgba(30,58,138,0.04)] sm:p-5">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#74807E]">{stat.label}</span>
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#F0F3EC] text-[#5E6A68]"><Icon name={stat.icon} size={15} /></span>
                </div>
                <div className="mt-4 font-display text-[27px] font-semibold leading-none tracking-[-0.03em] sm:text-[31px]">{stat.value}</div>
                <div className="mt-3 flex items-center gap-1.5 text-[10px]">
                  <span className="font-bold text-[#367552]">{stat.meta}</span>
                  <span className="text-[#8B9593]">{stat.note}</span>
                </div>
              </div>
            ))}
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.75fr)]">
            <div className="overflow-hidden rounded-xl border border-[#DCE4F0] bg-white shadow-[0_1px_2px_rgba(30,58,138,0.04)]">
              <div className="flex flex-col gap-4 border-b border-[#E6E9E3] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-[17px] font-semibold tracking-[-0.01em]">Priority planning leads</h2>
                  <p className="mt-1 text-[10px] text-[#7A8583]">Approved schemes ranked from the production export</p>
                </div>
                <div className="flex gap-2">
                  <label className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-[#DCE4F0] bg-[#F8FAFD] px-3 text-[#718096] sm:w-[220px]">
                    <Icon name="search" size={14} />
                    <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent text-[11px] text-[#172224] outline-none placeholder:text-[#9CA5A3]" placeholder="Search schemes..." />
                  </label>
                  <button onClick={() => setActive('Planning search')} className="grid h-9 w-9 place-items-center rounded-lg border border-[#DCE4F0] text-[#64748B] hover:bg-[#F0F4FA]" aria-label="Filter leads"><Icon name="filter" size={15} /></button>
                </div>
              </div>

              <div>
                {data.length === 0 ? <div className="p-5"><EmptyState icon="search" title="No planning leads in this workspace yet." action={{ label: 'Run your first planning search', onClick: () => setActive('Planning search') }} /></div> : visibleSchemes.length === 0 ? <div className="p-5"><EmptyState kind="filtered" icon="filter" title="No schemes match this search." action={{ label: 'Clear search', onClick: () => setQuery('') }} /></div> : visibleSchemes.map((scheme) => (
                  <article key={scheme.id} className="group grid cursor-pointer gap-4 border-b border-[#ECEEEA] p-4 transition last:border-0 hover:bg-[#FAFBF8] sm:grid-cols-[42px_minmax(0,1fr)_auto] sm:p-5" onClick={() => setSelected(scheme)}>
                    <div className={`grid h-10 w-10 place-items-center rounded-lg ${scheme.colour} text-[10px] font-bold text-[#172224]`}>{scheme.initials}</div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-[13px] font-semibold">{scheme.title}</h3>
                        <span className={`rounded-full px-2 py-1 text-[8px] font-bold uppercase tracking-[0.08em] ${scheme.status === 'High fit' ? 'bg-[#E6F6D5] text-[#397047]' : 'bg-[#EEF1EC] text-[#63706D]'}`}>{scheme.status}</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-[#7C8885]"><Icon name="map" size={11} /> {scheme.location}</div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[9px] font-medium text-[#64706E]">
                        <span>{scheme.type}</span><span className="text-[#B1B8B5]">•</span><span>{scheme.stage}</span><span className="text-[#B1B8B5]">•</span><span>{scheme.council}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-6 sm:flex-col sm:items-end">
                      <div className="text-left sm:text-right">
                        <div className="font-display text-[15px] font-semibold">{scheme.value}</div>
                        <div className="mt-1 text-[9px] text-[#8A9492]">{scheme.date}</div>
                      </div>
                      <button
                        onClick={(event) => { event.stopPropagation(); void toggleSave(scheme.id) }}
                        className={`rounded-md px-2.5 py-1.5 text-[9px] font-semibold transition ${saved.includes(scheme.id) ? 'bg-[#172554] text-white' : 'border border-[#DCE4F0] text-[#64748B] opacity-100 sm:opacity-0 sm:group-hover:opacity-100'}`}
                      >
                        {saved.includes(scheme.id) ? 'Saved' : 'Save'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              {visibleSchemes.length > 0 && <button onClick={() => setActive('Planning search')} className="flex w-full items-center justify-center gap-2 border-t border-[#E6E9E3] py-4 text-[10px] font-semibold text-[#4F5C5A] hover:bg-[#FAFBF8]">
                View all {filteredData.length} applications <Icon name="arrow" size={13} />
              </button>}
            </div>

            <div className="space-y-5">
              {overview?.metrics.pipelineValue ? <div className="overflow-hidden rounded-xl bg-[#172554] text-white shadow-sm">
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-white/45">Pipeline value</div>
                      <div className="mt-2 font-display text-[29px] font-semibold tracking-[-0.03em]">{overview.metrics.pipelineValue}</div>
                    </div>
                    {overview.metrics.pipelineDelta && <span className="rounded-full bg-[#38BDF8]/15 px-2.5 py-1.5 text-[9px] font-bold text-[#38BDF8]">{overview.metrics.pipelineDelta}</span>}
                  </div>
                  <div className="mt-5 flex h-[92px] items-end gap-2 border-b border-white/10">
                    {(overview.metrics.pipelineChart ?? []).map((height, index, chart) => (
                      <div key={index} className="group flex h-full flex-1 items-end">
                        <div className={`w-full rounded-t-sm transition-all group-hover:bg-[#38BDF8] ${index === chart.length - 1 ? 'bg-[#38BDF8]' : 'bg-white/15'}`} style={{ height: `${height}%` }} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-[8px] uppercase tracking-wider text-white/30"><span>Jan</span><span>Jun</span><span>Dec</span></div>
                </div>
                <div className="grid grid-cols-3 border-t border-white/8 bg-white/[0.025]">
                  {[[overview.metrics.prospects ?? '0', 'Prospects'], [overview.metrics.qualified ?? '0', 'Qualified'], [overview.metrics.negotiating ?? '0', 'Negotiating']].map(([value, label]) => (
                    <div key={label} className="border-r border-white/8 px-4 py-3.5 last:border-0">
                      <div className="font-display text-[16px] font-semibold">{value}</div>
                      <div className="mt-1 text-[8px] uppercase tracking-wider text-white/35">{label}</div>
                    </div>
                  ))}
                </div>
              </div> : <EmptyState icon="chart" title="Pipeline value appears after the first qualified lead." action={{ label: 'Set up your ICP', onClick: () => { setActive('Workspace setup'); setSetupTab('persona') } }} sample={<SampleBars />} />}

              <div className="rounded-xl border border-[#DCE4F0] bg-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-[16px] font-semibold">Live intent</h2>
                    <p className="mt-1 text-[9px] text-[#8A9492]">Decision-maker activity</p>
                  </div>
                  {Boolean(overview?.intent.length) && <span className="flex items-center gap-1.5 text-[9px] font-semibold text-[#4D615C]"><i className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#70A777]" /> LIVE</span>}
                </div>
                <div className="mt-4 space-y-1">
                  {overview?.intent.length ? overview.intent.map((item) => (
                    <button key={item.name + item.detail} onClick={() => { setActive('CRM & intent'); setCrmTab('intent') }} className="flex w-full items-start gap-3 rounded-lg p-2 text-left transition hover:bg-[#F5F7F2]">
                      <div className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#EDF0EA] text-[9px] font-bold text-[#53605E]">
                        {item.initials}{item.hot && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#E96345]" />}
                      </div>
                      <div className="min-w-0 flex-1 text-[9px] leading-relaxed text-[#7B8583]">
                        <span className="font-semibold text-[#202D2E]">{item.name}</span> {item.action}
                        <div className="truncate text-[#9AA3A1]">{item.detail}</div>
                      </div>
                      <span className="pt-0.5 text-[8px] text-[#A3ABA9]">{item.time}</span>
                    </button>
                  )) : <EmptyState icon="signal" title="Intent shows up when someone opens a campaign." action={{ label: 'Create a campaign', onClick: () => setActive('Campaigns') }} sample={<p className="text-[12px] text-[#334155]"><b>Maya Evans</b> opened a case study · 3m</p>} />}
                </div>
                {Boolean(overview?.intent.length) && <button onClick={() => { setActive('CRM & intent'); setCrmTab('intent') }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#E0E4DD] py-2.5 text-[9px] font-semibold text-[#5F6B69] hover:bg-[#F7F8F5]">View intent centre <Icon name="arrow" size={12} /></button>}
              </div>
            </div>
          </section>
        </div> : (
          <WorkspaceView
            active={active}
            data={filteredData}
            crmTab={crmTab}
            setCrmTab={setCrmTab}
            setInboxUnread={setInboxUnread}
            reportsTab={reportsTab}
            setupTab={setupTab}
            campaignSettingsOpen={campaignSettingsOpen}
            setCampaignSettingsOpen={setCampaignSettingsOpen}
            campaignCreateSignal={campaignCreateSignal}
            profile={profile}
            setProfile={(next) => { setProfile(next); void api.updateMe(next).catch(() => notify('Could not save your profile')) }}
            saved={saved}
            onOpen={setSelected}
            onSave={(id) => { void toggleSave(id) }}
            canSave={can('saved.write')}
            canExport={can('leads.export')}
            canCampaign={can('campaigns.write')}
            canCrm={can('crm.write')}
            canSettings={can('settings.write')}
            canTeam={can('team.manage')}
            actorRole={orgRole}
            onNavigate={setActive}
          />
        )}
      </main>

      {mobileNav && <button className="fixed inset-0 z-30 bg-[#0F172A]/50 lg:hidden" onClick={() => setMobileNav(false)} aria-label="Close navigation overlay" />}

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#0F172A]/55 backdrop-blur-[2px]" onMouseDown={() => setSelected(null)}>
          <aside className="h-full w-full max-w-[540px] overflow-y-auto bg-[#F7F9FC] shadow-2xl animate-slide-in" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex h-[70px] items-center justify-between border-b border-[#DCE4F0] bg-[#F7F9FC]/95 px-6 backdrop-blur">
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#7A8683]">Scheme dossier</div>
                <div className="mt-1 text-[10px] text-[#9AA3A1]">{selected.id}</div>
              </div>
              <button className="grid h-9 w-9 place-items-center rounded-full border border-[#D9DED7] bg-white text-[#5E6A68] hover:bg-[#EDF0EA]" onClick={() => setSelected(null)} aria-label="Close scheme dossier"><Icon name="close" size={16} /></button>
            </div>
            <div className="p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${selected.colour} text-[11px] font-bold`}>{selected.initials}</div>
                <div>
                  <span className="rounded-full bg-[#E2F5D1] px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.09em] text-[#3E7549]">{selected.score}% match</span>
                  <h2 className="mt-3 font-display text-[25px] font-semibold leading-tight tracking-[-0.03em]">{selected.title}</h2>
                  <p className="mt-2 flex items-center gap-1.5 text-[10px] text-[#778280]"><Icon name="map" size={12} /> {selected.location}</p>
                </div>
              </div>

              <div className="mt-7 grid grid-cols-3 overflow-hidden rounded-xl border border-[#DCE4F0] bg-white">
                {[[selected.value, 'Est. value'], [selected.stage, 'Project stage'], [selected.units, 'Development']].map(([value, label]) => (
                  <div key={label} className="border-r border-[#E5E8E2] p-4 last:border-0">
                    <div className="font-display text-[14px] font-semibold">{value}</div>
                    <div className="mt-1.5 text-[8px] uppercase tracking-wider text-[#8A9492]">{label}</div>
                  </div>
                ))}
              </div>

              <section className="mt-7">
                <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#6F7B78]">Statutory proposal</div>
                <p className="mt-3 text-[11px] leading-6 text-[#5E6B69]">{selected.description}</p>
                <div className="mt-4 rounded-xl border border-[#DCE4F0] bg-white p-4">
                  {[['Application reference', selected.id], ['Local authority', selected.council], ['Publication date', selected.date], ['Project ID', selected.projectId || 'Not supplied'], ['County / region', `${selected.county || '—'} / ${selected.region || '—'}`], ['Project category', selected.category || '—']].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between border-b border-[#ECEEEA] py-2.5 text-[10px] last:border-0">
                      <span className="text-[#8A9492]">{label}</span><span className="font-medium text-[#354240]">{value}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-7">
                <div className="flex items-center justify-between">
                  <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#6F7B78]">Architect / planning agent</div>
                  <span className={`flex items-center gap-1 text-[8px] font-bold ${selected.email || selected.phone ? 'text-[#43815A]' : 'text-[#A16207]'}`}><span className={`h-1.5 w-1.5 rounded-full ${selected.email || selected.phone ? 'bg-[#5FA871]' : 'bg-[#FACC15]'}`} /> {selected.email && selected.phone ? 'DIRECT CONTACT' : selected.email || selected.phone ? 'PARTIAL CONTACT' : 'NOT PUBLISHED'}</span>
                </div>
                <div className="mt-3 rounded-xl border border-[#DCE4F0] bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-[#BDD8FF] text-[10px] font-bold">{selected.architect.split(' ').map((name) => name[0]).join('')}</div>
                    <div className="flex-1">
                      <div className="font-display text-[13px] font-semibold">{selected.architect}</div>
                      <div className="mt-1 text-[9px] text-[#7A8583]">Director · {selected.practice}</div>
                    </div>
                    <button className="grid h-8 w-8 place-items-center rounded-lg border border-[#DCE1DA] text-[#687471]"><Icon name="external" size={13} /></button>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <a href={selected.email ? `mailto:${selected.email}` : undefined} className="flex items-center gap-2 rounded-lg bg-[#F0F4FA] px-3 py-2.5 text-[9px] text-[#52627A]"><Icon name="mail" size={12} /><span className="truncate">{selected.email || 'Email not published'}</span></a>
                    <a href={selected.phone ? `tel:${selected.phone}` : undefined} className="flex items-center gap-2 rounded-lg bg-[#F0F4FA] px-3 py-2.5 text-[9px] text-[#52627A]"><Icon name="phone" size={12} />{selected.phone || 'Phone not published'}</a>
                  </div>
                  <div className="mt-3 border-t border-[#EEF2F7] pt-3 text-[9px] leading-relaxed text-[#718096]">{selected.architectAddress || 'Agent address not published in source record'}</div>
                </div>
              </section>

              <section className="mt-7">
                <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#6F7B78]">Applicant / developer</div>
                <div className="mt-3 rounded-xl border border-[#DCE4F0] bg-white p-4">
                  <div className="text-[12px] font-semibold text-[#1E293B]">{selected.applicant || 'Applicant not published'}</div>
                  <div className="mt-2 text-[9px] leading-relaxed text-[#718096]">{selected.applicantAddress || 'Applicant address not published in source record'}</div>
                </div>
              </section>

              {Object.keys(selected.raw).length > 0 && (
                <details className="mt-7 overflow-hidden rounded-xl border border-[#DCE4F0] bg-white">
                  <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-[9px] font-bold uppercase tracking-[0.12em] text-[#52627A]">
                    Complete 44-column source record
                    <span className="rounded-full bg-[#EFF6FF] px-2 py-1 text-[8px] text-[#2563EB]">{Object.values(selected.raw).filter(Boolean).length} populated</span>
                  </summary>
                  <div className="max-h-80 overflow-y-auto border-t border-[#EEF2F7] px-4">
                    {Object.entries(selected.raw).map(([field, value]) => (
                      <div key={field} className="grid grid-cols-[145px_1fr] gap-3 border-b border-[#F1F5F9] py-2.5 text-[8px] last:border-0">
                        <span className="font-semibold text-[#64748B]">{field}</span>
                        <span className={value ? 'break-words text-[#334155]' : 'italic text-[#CBD5E1]'}>{value || 'Not published'}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              <div className="mt-7 flex gap-3">
                <button disabled={!can('campaigns.write')} onClick={() => { notify(`${selected.title} noted for the next campaign draft`); setSelected(null) }} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#172554] px-4 py-3 text-[10px] font-semibold text-white hover:bg-[#1E3A8A] disabled:cursor-not-allowed disabled:opacity-40"><Icon name="send" size={14} /> Add to campaign</button>
                <button onClick={() => { void toggleSave(selected.id) }} className="rounded-lg border border-[#D7DCD5] bg-white px-4 py-3 text-[10px] font-semibold text-[#596562] hover:bg-[#F0F3ED]">{saved.includes(selected.id) ? 'Saved' : 'Save lead'}</button>
              </div>
              {selected.portalUrl && <a href={selected.portalUrl} target="_blank" rel="noreferrer" className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#DCE4F0] bg-white py-3 text-[9px] font-semibold text-[#2563EB]">Open council planning record <Icon name="external" size={12} /></a>}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

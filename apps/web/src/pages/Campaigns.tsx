import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import type { Scheme } from '@planningpal/shared'
import { EmptyState, LoadingBlock } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { PageIntro } from '../components/PageIntro'
import { api, type Campaign, type ContactGroup } from '../lib/api'
import { notify } from '../lib/notify'

function presentStatus(status: string) {
  if (status === 'live') return 'Live'
  if (status === 'paused') return 'Paused'
  if (status === 'draft') return 'Draft'
  return status
}

const DEFAULT_SUBJECT = 'Approved planning scheme — {{companyName}}'
const DEFAULT_BODY =
  'Hi {{firstName}},\n\nNoticed your recently approved scheme and wanted to share how we support RIBA Stage 3–4 packages across {{companyName}}.\n\nWould a brief 10-minute call this week be useful?'
const MERGE_TAGS = ['{{firstName}}', '{{lastName}}', '{{companyName}}', '{{jobTitle}}'] as const

function parseLeadLines(raw: string) {
  const results: { email: string; firstName?: string; lastName?: string; company?: string; title?: string }[] = []
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    const columns = line.split(/\t|,/).map((part) => part.trim()).filter(Boolean)
    if (columns.length >= 2 && columns[0]?.includes('@') && !columns[1]?.includes('@')) {
      const [email, firstName, lastName, company, title] = columns
      results.push({
        email: email!,
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
        ...(company ? { company } : {}),
        ...(title ? { title } : {}),
      })
      continue
    }
    for (const token of line.split(/[\s,;]+/)) {
      const email = token.trim()
      if (email.includes('@')) results.push({ email })
    }
  }
  return results
}

export function Campaigns({
  settingsOpen,
  setSettingsOpen,
  createSignal,
  canWrite = true,
  data = [],
}: {
  settingsOpen: boolean
  setSettingsOpen: (open: boolean) => void
  createSignal: number
  canWrite?: boolean
  data?: Scheme[]
}) {
  const [campaigns, setCampaigns] = useState<(Campaign & { status: string })[]>([])
  const [editor, setEditor] = useState<number | null>(null)
  const [campaignName, setCampaignName] = useState('')
  const [campaignRegion, setCampaignRegion] = useState('London')
  const [emailSubject, setEmailSubject] = useState(DEFAULT_SUBJECT)
  const [emailBody, setEmailBody] = useState(DEFAULT_BODY)
  const [delayDays, setDelayDays] = useState(2)
  const [stopOnReply, setStopOnReply] = useState(true)
  const [domainMode, setDomainMode] = useState<'add' | 'buy' | null>(null)
  const [ownedDomain, setOwnedDomain] = useState('')
  const [dailyLimit, setDailyLimit] = useState(30)
  const [warmup, setWarmup] = useState(true)
  const [domains, setDomains] = useState<{ id: string; name: string; inboxes: number; health: string; status: string }[]>([])
  const [trackingDomain, setTrackingDomain] = useState('click.yourcompany.co.uk')
  const [leadText, setLeadText] = useState('')
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')

  // Contact addition sub-modes
  const [contactMode, setContactMode] = useState<'group' | 'schemes' | 'csv'>('group')
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [isSubmittingLeads, setIsSubmittingLeads] = useState(false)
  const [schemeSearch, setSchemeSearch] = useState('')
  const [selectedSchemeEmails, setSelectedSchemeEmails] = useState<Set<string>>(new Set())

  useEffect(() => {
    void Promise.all([api.campaigns(), api.domains(), api.campaignSettings(), api.contactGroups().catch(() => ({ data: [] }))])
      .then(([campaignRows, domainRows, settings, groupsRes]) => {
        setCampaigns(campaignRows.data.map((campaign) => ({ ...campaign, status: presentStatus(campaign.status) })))
        setDomains(domainRows.data)
        setDailyLimit(settings.dailyLimit)
        setWarmup(settings.warmup)
        setTrackingDomain(settings.trackingDomain || 'click.yourcompany.co.uk')
        setContactGroups(groupsRes.data)
        if (groupsRes.data.length > 0) {
          setSelectedGroupId(groupsRes.data[0].id)
        }
        setLoadState('ready')
      })
      .catch(() => setLoadState('error'))
  }, [])

  const primaryDomain = domains[0]?.name || 'yourcompany.co.uk'
  const lookalikeDomains = [
    `outreach-${primaryDomain}`,
    `mail-${primaryDomain}`,
    `get-${primaryDomain}`,
    `connect-${primaryDomain}`,
  ]
  const activeInboxes = domains.reduce((total, domain) => total + domain.inboxes, 0)

  // Extract unique contacts from schemes
  const schemeContacts = useMemo(() => {
    const map = new Map<string, { email: string; name: string; practice: string; schemeTitle: string; council: string }>()
    for (const item of data) {
      const email = item.email?.trim().toLowerCase()
      if (email && email.includes('@') && !map.has(email)) {
        map.set(email, {
          email,
          name: item.architect && item.architect !== 'Contact not published' ? item.architect : item.applicant || 'Contact',
          practice: item.practice || '',
          schemeTitle: item.title || '',
          council: item.council || '',
        })
      }
    }
    return Array.from(map.values())
  }, [data])

  const filteredSchemeContacts = useMemo(() => {
    if (!schemeSearch.trim()) return schemeContacts.slice(0, 50)
    const q = schemeSearch.toLowerCase()
    return schemeContacts
      .filter((c) => c.name.toLowerCase().includes(q) || c.practice.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.council.toLowerCase().includes(q))
      .slice(0, 50)
  }, [schemeContacts, schemeSearch])

  const openEditor = (index: number) => {
    setEditor(index)
    setCampaignName(index >= 0 ? campaigns[index].name : '')
    setCampaignRegion(index >= 0 && (campaigns[index].region || campaigns[index].name.includes('Surrey')) ? (campaigns[index].region || 'South East') : 'London')
    if (index === -1) {
      setEmailSubject(DEFAULT_SUBJECT)
      setEmailBody(DEFAULT_BODY)
      setDelayDays(2)
      setStopOnReply(true)
    }
    setLeadText('')
    setSelectedSchemeEmails(new Set())
    // Refresh contact groups when opening campaign editor
    void api.contactGroups().then((res) => {
      setContactGroups(res.data)
      if (res.data.length > 0 && !selectedGroupId) {
        setSelectedGroupId(res.data[0].id)
      }
    }).catch(() => {})
  }

  const saveCampaign = () => {
    if (!canWrite || !campaignName.trim()) return
    const payload = {
      name: campaignName.trim(),
      region: campaignRegion,
      ...(emailSubject.trim() ? { subject: emailSubject.trim() } : {}),
      ...(emailBody.trim() ? { body: emailBody.trim() } : {}),
      delayDays,
      stopOnReply,
    }
    const action = editor === -1 ? api.createCampaign(payload) : api.updateCampaign(campaigns[editor!].id, payload)
    void action.then((saved) => {
      const next = { ...saved, status: presentStatus(saved.status) }
      if (editor === -1) setCampaigns((items) => [...items, next])
      else setCampaigns((items) => items.map((item, index) => index === editor ? next : item))
      notify(editor === -1 ? 'Campaign created with sequence' : 'Campaign configuration saved')
      setEditor(null)
    }).catch(() => notify('Could not save the campaign'))
  }

  const handleAddCsvLeads = async () => {
    if (editor === null || editor < 0) return
    const campaign = campaigns[editor]
    if (!campaign) return
    const leads = parseLeadLines(leadText)
    if (!leads.length) {
      notify('Please enter or paste at least one valid email address.')
      return
    }
    setIsSubmittingLeads(true)
    try {
      const result = await api.addCampaignLeads(campaign.id, leads)
      setCampaigns((items) => items.map((item) => item.id === campaign.id ? { ...item, contacts: item.contacts + result.added } : item))
      notify(`${result.added} contact${result.added === 1 ? '' : 's'} added to campaign!`)
      setLeadText('')
    } catch (error: unknown) {
      notify(error instanceof Error ? error.message : 'Could not add contacts to campaign')
    } finally {
      setIsSubmittingLeads(false)
    }
  }

  const handleImportGroup = async () => {
    if (editor === null || editor < 0 || !selectedGroupId) return
    const campaign = campaigns[editor]
    if (!campaign) return
    setIsSubmittingLeads(true)
    try {
      const result = await api.importGroupToCampaign(campaign.id, selectedGroupId)
      setCampaigns((items) => items.map((item) => item.id === campaign.id ? { ...item, contacts: item.contacts + result.added } : item))
      notify(`${result.added} contact${result.added === 1 ? '' : 's'} imported from "${result.groupName}"!`)
    } catch (error: unknown) {
      notify(error instanceof Error ? error.message : 'Could not import contact group')
    } finally {
      setIsSubmittingLeads(false)
    }
  }

  const handleAddSelectedSchemeContacts = async () => {
    if (editor === null || editor < 0) return
    const campaign = campaigns[editor]
    if (!campaign || selectedSchemeEmails.size === 0) {
      notify('Please select at least one contact.')
      return
    }
    const selectedLeads = schemeContacts
      .filter((c) => selectedSchemeEmails.has(c.email))
      .map((c) => {
        const parts = c.name.split(' ')
        return {
          email: c.email,
          firstName: parts[0] || undefined,
          lastName: parts.slice(1).join(' ') || undefined,
          company: c.practice || undefined,
          title: 'Planning Contact',
        }
      })
    setIsSubmittingLeads(true)
    try {
      const result = await api.addCampaignLeads(campaign.id, selectedLeads)
      setCampaigns((items) => items.map((item) => item.id === campaign.id ? { ...item, contacts: item.contacts + result.added } : item))
      notify(`${result.added} contact${result.added === 1 ? '' : 's'} from PlanningPal added to campaign!`)
      setSelectedSchemeEmails(new Set())
    } catch (error: unknown) {
      notify(error instanceof Error ? error.message : 'Could not add contacts')
    } finally {
      setIsSubmittingLeads(false)
    }
  }

  const addOwnedDomain = (event: FormEvent) => {
    event.preventDefault()
    const domain = ownedDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    if (!domain || domains.some((item) => item.name === domain)) return
    void api.addDomain({ name: domain, inboxes: 0, health: 'Setup', status: 'Verifying' }).then((created) => {
      setDomains((items) => [...items, created])
      setOwnedDomain('')
      setDomainMode(null)
      notify(`${domain} added for DNS verification`)
    }).catch(() => notify('Could not add that domain'))
  }

  const buyDomain = (domain: string) => {
    void api.addDomain({ name: domain, inboxes: 0, health: 'Setup', status: 'Provisioning' }).then((created) => {
      setDomains((items) => [...items, created])
      setDomainMode(null)
      notify(`${domain} purchased and provisioning started`)
    }).catch(() => notify('Could not provision that domain'))
  }

  const lastCreateSignal = useRef(createSignal)
  useEffect(() => {
    if (!canWrite || lastCreateSignal.current === createSignal) return
    lastCreateSignal.current = createSignal
    openEditor(-1)
  }, [createSignal])

  const parsedCsvCount = useMemo(() => parseLeadLines(leadText).length, [leadText])

  return (
    <>
      <PageIntro eyebrow="PlanningPal Campaigns" title="Campaigns" description="Coordinate RIBA-timed outreach through the PlanningPal campaign engine, across isolated sending domains." />
      {settingsOpen && <section className="mb-5 rounded-xl border border-[#BFDBFE] bg-white p-5">
        <div className="flex items-start justify-between"><div><h3 className="font-display text-[14px] font-semibold">Global campaign settings</h3><p className="mt-1 text-[8px] text-[#94A3B8]">Controls apply to all active sending inboxes.</p></div><button onClick={() => setSettingsOpen(false)} className="text-[#94A3B8]"><Icon name="close" size={13} /></button></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <label className="rounded-lg bg-[#F8FAFD] p-3 text-[8px] font-bold uppercase tracking-wider text-[#64748B]">Daily limit per inbox<div className="mt-2 flex items-center gap-3"><input type="range" min="10" max="40" value={dailyLimit} onChange={(event) => setDailyLimit(Number(event.target.value))} className="flex-1 accent-[#2563EB]" /><span className="text-[10px] font-semibold text-[#2563EB]">{dailyLimit}</span></div></label>
          <button onClick={() => setWarmup((enabled) => !enabled)} className={`flex items-center justify-between rounded-lg p-3 text-left ${warmup ? 'bg-[#ECFDF5] text-[#047857]' : 'bg-[#F1F5F9] text-[#64748B]'}`}><div><div className="text-[8px] font-bold uppercase tracking-wider">Automated warm-up</div><div className="mt-1 text-[8px] opacity-70">Maintain mailbox reputation</div></div><span className="text-[8px] font-bold">{warmup ? 'ON' : 'OFF'}</span></button>
          <div className="rounded-lg bg-[#F8FAFD] p-3"><div className="text-[8px] font-bold uppercase tracking-wider text-[#64748B]">Tracking domain</div><div className="mt-2 text-[9px] font-semibold text-[#334155]">{trackingDomain}</div><div className="mt-1 text-[7px] text-[#15803D]">Verified</div></div>
        </div>
        <button disabled={!canWrite} onClick={() => { void api.saveCampaignSettings({ dailyLimit, warmup }).then(() => notify('Campaign settings saved')).catch(() => notify('Could not save campaign settings')) }} className="mt-4 rounded-lg bg-[#172554] px-4 py-2.5 text-[8px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Save campaign settings</button>
      </section>}
      {loadState === 'loading' && <LoadingBlock label="Loading campaigns" />}
      {loadState === 'error' && <EmptyState kind="error" title="Campaigns could not be loaded." action={{ label: 'Try again', onClick: () => window.location.reload() }} />}
      {loadState === 'ready' && <>
      <div className="grid gap-3 sm:grid-cols-3">
        {[[String(activeInboxes), 'Active inboxes', domains.length ? `${domains.length} sending domains` : 'No domains yet'], [domains.length ? '—' : '—', 'Inbox placement', domains.length ? 'Measured after the first send' : 'No sends yet'], [`${dailyLimit}/day`, 'Sending limit', 'Per inbox']].map(([value, label, note]) => <div key={label} className="rounded-xl border border-[#DCE4F0] bg-white p-5"><div className="font-display text-2xl font-semibold">{value}</div><div className="mt-2 text-[10px] font-semibold text-[#52627A]">{label}</div><div className="mt-1 text-[9px] text-[#94A3B8]">{note}</div></div>)}
      </div>
      {campaigns.length === 0 && <div className="mt-5"><EmptyState icon="send" title="No campaigns yet." action={canWrite ? { label: 'Create a campaign', onClick: () => openEditor(-1) } : undefined} /></div>}
      {campaigns.length > 0 && <div className="mt-5 overflow-hidden rounded-xl border border-[#DCE4F0] bg-white">
        <div className="grid grid-cols-[minmax(250px,1.5fr)_repeat(5,minmax(80px,.5fr))_140px] bg-[#F8FAFD] px-5 py-3 text-[8px] font-bold uppercase tracking-wider text-[#94A3B8]"><span>Campaign</span><span>Contacts</span><span>Sent</span><span>Open rate</span><span>Reply rate</span><span>Meetings</span><span>Actions</span></div>
        {campaigns.map((campaign, campaignIndex) => {
          const isPaused = campaign.status === 'Paused'
          const isDraft = campaign.status === 'Draft'
          return <div key={campaign.id || campaign.name} className="grid grid-cols-[minmax(250px,1.5fr)_repeat(5,minmax(80px,.5fr))_140px] items-center border-t border-[#EEF2F7] px-5 py-5 text-[10px]">
            <div><div className="font-display text-[12px] font-semibold">{campaign.name}</div><div className={`mt-1.5 inline-flex items-center gap-1.5 text-[8px] font-bold ${campaign.status === 'Live' && !isPaused ? 'text-[#36805A]' : 'text-[#94A3B8]'}`}><i className={`h-1.5 w-1.5 rounded-full ${campaign.status === 'Live' && !isPaused ? 'bg-[#4ADE80]' : 'bg-[#CBD5E1]'}`} />{isPaused ? 'Paused' : campaign.status}</div></div>
            <span>{campaign.contacts.toLocaleString()}</span><span>{campaign.sent}</span><span className="font-semibold">{campaign.open}</span><span>{campaign.reply}</span><span className="font-semibold text-[#2563EB]">{campaign.meetings}</span>
            <div className="flex gap-1.5">
              <button onClick={() => openEditor(campaignIndex)} className="rounded-md border border-[#DCE4F0] px-2 py-1.5 text-[8px] font-semibold text-[#64748B]">Manage</button>
              <button disabled={!canWrite} onClick={() => {
                if (!canWrite) return
                const action = isPaused || isDraft ? api.resumeCampaign(campaign.id) : api.pauseCampaign(campaign.id)
                void action.then((saved) => {
                  setCampaigns((items) => items.map((item) => item.id === campaign.id ? { ...saved, status: presentStatus(saved.status) } : item))
                  notify(isDraft ? 'Campaign launched' : isPaused ? 'Campaign resumed' : 'Campaign paused')
                }).catch(() => notify('Could not update the campaign'))
              }} className={`rounded-md px-2 py-1.5 text-[8px] font-semibold ${isDraft ? 'bg-[#ECFDF5] text-[#15803D]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>{isDraft ? 'Launch' : isPaused ? 'Resume' : 'Pause'}</button>
            </div>
          </div>
        })}
      </div>}
      <div className="mt-5 rounded-xl border border-[#DCE4F0] bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-display text-[14px] font-semibold">Sending domains</h3><p className="mt-1 text-[9px] text-[#94A3B8]">Lookalike domains protect {primaryDomain} and isolate sender reputation.</p></div><div className="flex gap-2"><button onClick={() => setDomainMode(domainMode === 'add' ? null : 'add')} className="rounded-lg border border-[#DCE4F0] px-3 py-2 text-[8px] font-semibold text-[#52627A]">Add owned domain</button><button onClick={() => setDomainMode(domainMode === 'buy' ? null : 'buy')} className="rounded-lg bg-[#172554] px-3 py-2 text-[8px] font-semibold text-white">Buy lookalike domain</button></div></div>
        {domainMode === 'add' && <form onSubmit={addOwnedDomain} className="mt-4 flex gap-2 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] p-3"><input required value={ownedDomain} onChange={(event) => setOwnedDomain(event.target.value)} className="min-w-0 flex-1 rounded-md border border-[#DCE4F0] bg-white px-3 text-[9px] outline-none" placeholder="your-domain.co.uk" /><button type="submit" className="rounded-md bg-[#172554] px-4 py-2.5 text-[8px] font-semibold text-white">Add & verify</button></form>}
        {domainMode === 'buy' && <div className="mt-4 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-4"><div className="flex items-center justify-between"><div><div className="text-[9px] font-semibold text-[#1D4ED8]">Available lookalike domains</div><div className="mt-1 text-[8px] text-[#64748B]">£19/year each · DNS and SSL provisioned automatically</div></div><button onClick={() => setDomainMode(null)} className="text-[#94A3B8]"><Icon name="close" size={12} /></button></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{lookalikeDomains.filter((domain) => !domains.some((item) => item.name === domain)).map((domain) => <div key={domain} className="flex items-center justify-between rounded-lg bg-white p-3"><div><div className="text-[9px] font-semibold text-[#334155]">{domain}</div><div className="mt-1 text-[7px] text-[#15803D]">Available</div></div><button onClick={() => buyDomain(domain)} className="rounded-md bg-[#172554] px-3 py-2 text-[8px] font-semibold text-white">Buy £19</button></div>)}</div></div>}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{domains.length === 0 && <div className="sm:col-span-2 lg:col-span-4"><EmptyState icon="mail" title="No sending domains yet." action={{ label: 'Add a domain', onClick: () => setDomainMode('add') }} /></div>}{domains.map((domain) => <div key={domain.name} className="rounded-lg border border-[#E2E8F0] p-3"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="truncate text-[9px] font-semibold">{domain.name}</div><div className={`mt-1 text-[7px] font-semibold ${domain.status === 'Healthy' ? 'text-[#15803D]' : 'text-[#C2410C]'}`}>{domain.status}</div></div><i className={`mt-1 h-2 w-2 shrink-0 rounded-full ${domain.status === 'Healthy' ? 'bg-[#4ADE80]' : 'bg-[#FB923C]'}`} /></div><div className="mt-3 flex items-center justify-between border-t border-[#EEF2F7] pt-2"><span className="text-[8px] text-[#94A3B8]">{domain.inboxes} inboxes · {domain.health}</span><button onClick={() => { void api.removeDomain(domain.id).then(() => { setDomains((items) => items.filter((item) => item.id !== domain.id)); notify(`${domain.name} removed`) }).catch(() => notify('Could not remove that domain')) }} className="text-[7px] font-semibold text-[#B91C1C]">Remove</button></div></div>)}</div>
      </div>
      </>}
      {editor !== null && <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-[#0F172A]/55 p-4" onMouseDown={() => setEditor(null)}>
        <form onSubmit={(event) => { event.preventDefault(); saveCampaign() }} onMouseDown={(event) => event.stopPropagation()} className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between"><div><div className="text-[9px] font-bold uppercase tracking-wider text-[#2563EB]">{editor === -1 ? 'New outbound campaign' : 'Campaign settings'}</div><h3 className="mt-2 font-display text-xl font-semibold">{editor === -1 ? 'Create campaign' : 'Configure campaign'}</h3></div><button type="button" onClick={() => setEditor(null)} className="grid h-8 w-8 place-items-center rounded-full bg-[#F1F5F9] text-[#64748B]"><Icon name="close" size={14} /></button></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="block text-[9px] font-bold uppercase tracking-wider text-[#64748B]">Campaign name<input autoFocus value={campaignName} onChange={(event) => setCampaignName(event.target.value)} className="mt-2 w-full rounded-lg border border-[#DCE4F0] px-3 py-2.5 text-[10px] font-normal normal-case tracking-normal outline-none focus:border-[#2563EB]" placeholder="e.g. London approved schemes" /></label>
            <label className="block text-[9px] font-bold uppercase tracking-wider text-[#64748B]">Target region<select value={campaignRegion} onChange={(event) => setCampaignRegion(event.target.value)} className="mt-2 w-full rounded-lg border border-[#DCE4F0] bg-white px-3 py-2.5 text-[10px] font-normal normal-case tracking-normal outline-none"><option>London</option><option>South East</option></select></label>
          </div>
          <label className="mt-4 block text-[9px] font-bold uppercase tracking-wider text-[#64748B]">Email subject<input value={emailSubject} onChange={(event) => setEmailSubject(event.target.value)} className="mt-2 w-full rounded-lg border border-[#DCE4F0] px-3 py-2.5 text-[10px] font-normal normal-case tracking-normal outline-none focus:border-[#2563EB]" placeholder="Approved planning scheme — {{companyName}}" /></label>
          <div className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">Sequence email copy</span>
              <div className="flex flex-wrap gap-1">
                {MERGE_TAGS.map((tag) => <button key={tag} type="button" onClick={() => setEmailBody((prev) => `${prev}${prev.endsWith(' ') || !prev ? '' : ' '}${tag}`)} className="rounded bg-[#EFF6FF] px-1.5 py-0.5 text-[8px] font-semibold text-[#1D4ED8]">{tag}</button>)}
              </div>
            </div>
            <textarea value={emailBody} onChange={(event) => setEmailBody(event.target.value)} rows={4} className="mt-2 w-full resize-none rounded-lg border border-[#DCE4F0] p-3 text-[10px] font-normal normal-case tracking-normal outline-none focus:border-[#2563EB]" placeholder="Write your outreach email. Line breaks are formatted automatically." />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="rounded-lg bg-[#F8FAFD] p-2.5 text-[8px] font-bold uppercase tracking-wider text-[#64748B]">Follow-up delay (days)<input type="number" min={0} max={30} value={delayDays} onChange={(event) => setDelayDays(Math.max(0, Number(event.target.value) || 0))} className="mt-1.5 w-full rounded border border-[#DCE4F0] bg-white px-2.5 py-1.5 text-[10px] font-normal normal-case tracking-normal outline-none" /></label>
            <button type="button" onClick={() => setStopOnReply((enabled) => !enabled)} className={`flex items-center justify-between rounded-lg p-2.5 text-left ${stopOnReply ? 'bg-[#ECFDF5] text-[#047857]' : 'bg-[#F1F5F9] text-[#64748B]'}`}><div><div className="text-[8px] font-bold uppercase tracking-wider">Stop on reply</div><div className="mt-1 text-[8px] opacity-75">Pause sequence when prospect replies</div></div><span className="text-[8px] font-bold">{stopOnReply ? 'ON' : 'OFF'}</span></button>
          </div>
          <div className="mt-3 rounded-lg bg-[#F8FAFD] px-3 py-2 text-[8px] text-[#64748B]">Schedule: Weekdays 09:00–17:00 UK time · {dailyLimit}/day per inbox · Open & link tracking enabled</div>

          {/* Add Contacts Section */}
          {editor !== null && editor >= 0 && (
            <div className="mt-5 rounded-xl border border-[#DCE4F0] bg-[#FAFBFD] p-4">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#172554]">Add contacts to campaign</span>
                <div className="flex rounded-lg border border-[#DCE4F0] bg-white p-0.5 text-[8px]">
                  <button
                    type="button"
                    onClick={() => setContactMode('group')}
                    className={`rounded px-2.5 py-1 font-semibold ${contactMode === 'group' ? 'bg-[#172554] text-white' : 'text-[#64748B]'}`}
                  >
                    From Group
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactMode('schemes')}
                    className={`rounded px-2.5 py-1 font-semibold ${contactMode === 'schemes' ? 'bg-[#172554] text-white' : 'text-[#64748B]'}`}
                  >
                    PlanningPal
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactMode('csv')}
                    className={`rounded px-2.5 py-1 font-semibold ${contactMode === 'csv' ? 'bg-[#172554] text-white' : 'text-[#64748B]'}`}
                  >
                    CSV / Text
                  </button>
                </div>
              </div>

              {contactMode === 'group' && (
                <div className="mt-3">
                  <div className="text-[8px] text-[#64748B]">Select an organized contact group to add in bulk:</div>
                  {contactGroups.length === 0 ? (
                    <div className="mt-2 rounded-lg border border-dashed border-[#CBD5E1] p-3 text-center text-[9px] text-[#94A3B8]">
                      No contact groups created yet. You can create groups in the Contacts tab or import via CSV/Schemes.
                    </div>
                  ) : (
                    <div className="mt-2 flex flex-col gap-2">
                      <select
                        value={selectedGroupId}
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        className="w-full rounded-lg border border-[#DCE4F0] bg-white px-3 py-2 text-[10px] text-[#1E293B] outline-none"
                      >
                        {contactGroups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.name} ({group.memberCount} contact{group.memberCount === 1 ? '' : 's'})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={isSubmittingLeads || !selectedGroupId}
                        onClick={handleImportGroup}
                        className="mt-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#172554] py-2.5 text-[9px] font-semibold text-white disabled:opacity-50"
                      >
                        {isSubmittingLeads ? 'Importing contacts...' : 'Import group contacts into campaign'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {contactMode === 'schemes' && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[8px] text-[#64748B]">
                    <span>Select contacts from approved schemes ({schemeContacts.length} found):</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedSchemeEmails.size === filteredSchemeContacts.length) {
                          setSelectedSchemeEmails(new Set())
                        } else {
                          setSelectedSchemeEmails(new Set(filteredSchemeContacts.map((c) => c.email)))
                        }
                      }}
                      className="text-[#2563EB] hover:underline"
                    >
                      {selectedSchemeEmails.size === filteredSchemeContacts.length ? 'Deselect all' : 'Select all shown'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={schemeSearch}
                    onChange={(e) => setSchemeSearch(e.target.value)}
                    placeholder="Search by architect, firm, email or council..."
                    className="mt-1.5 w-full rounded border border-[#DCE4F0] bg-white px-2.5 py-1.5 text-[9px] outline-none"
                  />
                  <div className="mt-2 max-h-36 overflow-y-auto rounded border border-[#E2E8F0] bg-white">
                    {filteredSchemeContacts.length === 0 ? (
                      <div className="p-3 text-center text-[8px] text-[#94A3B8]">No contacts match your search.</div>
                    ) : (
                      filteredSchemeContacts.map((contact) => {
                        const isChecked = selectedSchemeEmails.has(contact.email)
                        return (
                          <label
                            key={contact.email}
                            className={`flex cursor-pointer items-center justify-between border-b border-[#F1F5F9] px-2.5 py-1.5 text-[9px] hover:bg-[#F8FAFD] ${isChecked ? 'bg-[#EFF6FF]' : ''}`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  setSelectedSchemeEmails((prev) => {
                                    const next = new Set(prev)
                                    if (next.has(contact.email)) next.delete(contact.email)
                                    else next.add(contact.email)
                                    return next
                                  })
                                }}
                                className="h-3.5 w-3.5 rounded border-[#CBD5E1] text-[#2563EB]"
                              />
                              <div>
                                <div className="font-semibold text-[#1E293B]">{contact.name}</div>
                                <div className="text-[8px] text-[#64748B]">{contact.practice || contact.email} {contact.council ? `· ${contact.council}` : ''}</div>
                              </div>
                            </div>
                            <span className="text-[8px] text-[#94A3B8]">{contact.email}</span>
                          </label>
                        )
                      })
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={isSubmittingLeads || selectedSchemeEmails.size === 0}
                    onClick={handleAddSelectedSchemeContacts}
                    className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#172554] py-2 text-[9px] font-semibold text-white disabled:opacity-50"
                  >
                    {isSubmittingLeads ? 'Adding contacts...' : `Add ${selectedSchemeEmails.size} selected contact${selectedSchemeEmails.size === 1 ? '' : 's'}`}
                  </button>
                </div>
              )}

              {contactMode === 'csv' && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[8px] text-[#64748B]">
                    <span>Paste emails or CSV rows: email, firstName, lastName, company, title</span>
                    {parsedCsvCount > 0 && (
                      <span className="rounded bg-[#ECFDF5] px-1.5 py-0.5 font-bold text-[#15803D]">
                        {parsedCsvCount} valid email{parsedCsvCount === 1 ? '' : 's'} detected
                      </span>
                    )}
                  </div>
                  <textarea
                    value={leadText}
                    onChange={(event) => setLeadText(event.target.value)}
                    rows={3}
                    className="mt-1.5 w-full resize-none rounded-lg border border-[#DCE4F0] bg-white p-2.5 text-[10px] font-normal normal-case tracking-normal outline-none focus:border-[#2563EB]"
                    placeholder="maya@studio.co.uk, Maya, Patel, Northbank Studio, Project Architect"
                  />
                  <button
                    type="button"
                    disabled={isSubmittingLeads}
                    onClick={handleAddCsvLeads}
                    className="mt-2 w-full rounded-lg border border-[#172554] bg-[#172554] py-2.5 text-[9px] font-semibold text-white transition hover:bg-[#1E3A8A] disabled:opacity-50"
                  >
                    {isSubmittingLeads ? 'Adding contacts...' : 'Add contacts to this campaign'}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="mt-5 flex gap-3">
            <button type="button" onClick={() => setEditor(null)} className="flex-1 rounded-lg border border-[#DCE4F0] py-3 text-[9px] font-semibold text-[#64748B]">
              Cancel
            </button>
            <button type="submit" className="flex-1 rounded-lg bg-[#172554] py-3 text-[9px] font-semibold text-white">
              {editor === -1 ? 'Create campaign' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>}
    </>
  )
}

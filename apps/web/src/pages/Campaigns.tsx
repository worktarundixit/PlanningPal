import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Icon } from '../components/Icon'
import { PageIntro } from '../components/PageIntro'
import { api, type Campaign } from '../lib/api'
import { notify } from '../lib/notify'

function presentStatus(status: string) {
  if (status === 'live') return 'Live'
  if (status === 'paused') return 'Paused'
  if (status === 'draft') return 'Draft'
  return status
}

export function Campaigns({ settingsOpen, setSettingsOpen, createSignal, canWrite = true }: { settingsOpen: boolean; setSettingsOpen: (open: boolean) => void; createSignal: number; canWrite?: boolean }) {
  const [campaigns, setCampaigns] = useState<(Campaign & { status: string })[]>([])
  const [editor, setEditor] = useState<number | null>(null)
  const [campaignName, setCampaignName] = useState('')
  const [campaignRegion, setCampaignRegion] = useState('London')
  const [domainMode, setDomainMode] = useState<'add' | 'buy' | null>(null)
  const [ownedDomain, setOwnedDomain] = useState('')
  const [dailyLimit, setDailyLimit] = useState(30)
  const [warmup, setWarmup] = useState(true)
  const [domains, setDomains] = useState<{ id: string; name: string; inboxes: number; health: string; status: string }[]>([])
  const [trackingDomain, setTrackingDomain] = useState('click.micraft-pipeline.co.uk')
  const [leadText, setLeadText] = useState('')
  useEffect(() => {
    void Promise.all([api.campaigns(), api.domains(), api.campaignSettings()]).then(([campaignRows, domainRows, settings]) => {
      setCampaigns(campaignRows.data.map((campaign) => ({ ...campaign, status: presentStatus(campaign.status) })))
      setDomains(domainRows.data)
      setDailyLimit(settings.dailyLimit)
      setWarmup(settings.warmup)
      setTrackingDomain(settings.trackingDomain)
    }).catch(() => notify('Could not load campaigns'))
  }, [])
  const lookalikeDomains = ['micraft-design.co.uk', 'micraft-studio.co.uk', 'get-micraftdesign.co.uk', 'micraft-projects.com']
  const activeInboxes = domains.reduce((total, domain) => total + domain.inboxes, 0)
  const openEditor = (index: number) => {
    setEditor(index)
    setCampaignName(index >= 0 ? campaigns[index].name : '')
    setCampaignRegion(index >= 0 && campaigns[index].name.includes('Surrey') ? 'South East' : 'London')
  }
  const saveCampaign = () => {
    if (!canWrite || !campaignName.trim()) return
    const persist = editor === -1
      ? api.createCampaign({ name: campaignName, region: campaignRegion })
      : editor !== null ? api.updateCampaign(campaigns[editor].id, { name: campaignName, region: campaignRegion }) : Promise.resolve(null)
    void persist.then((saved) => {
      if (!saved) return
      const next = { ...saved, status: presentStatus(saved.status) }
      if (editor === -1) setCampaigns((items) => [...items, next])
      else setCampaigns((items) => items.map((item, index) => index === editor ? next : item))
      notify(editor === -1 ? 'Campaign created as a draft' : 'Campaign configuration saved')
      setEditor(null)
    }).catch(() => notify('Could not save the campaign'))
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
      <div className="grid gap-3 sm:grid-cols-3">
        {[[String(activeInboxes), 'Active inboxes', `${domains.length} sending domains`], ['98.4%', 'Inbox placement', '+0.6% this week'], [`${dailyLimit}/day`, 'Sending limit', 'Per inbox']].map(([value, label, note]) => <div key={label} className="rounded-xl border border-[#DCE4F0] bg-white p-5"><div className="font-display text-2xl font-semibold">{value}</div><div className="mt-2 text-[10px] font-semibold text-[#52627A]">{label}</div><div className="mt-1 text-[9px] text-[#94A3B8]">{note}</div></div>)}
      </div>
      {campaigns.length === 0 && <div className="mt-5 rounded-xl border border-dashed border-[#DCE4F0] bg-white px-5 py-10 text-center text-[12px] text-[#64748B]">No campaigns yet. Create one when you are ready to send.</div>}
      <div className="mt-5 overflow-hidden rounded-xl border border-[#DCE4F0] bg-white">
        <div className="grid grid-cols-[minmax(250px,1.5fr)_repeat(5,minmax(80px,.5fr))_140px] bg-[#F8FAFD] px-5 py-3 text-[8px] font-bold uppercase tracking-wider text-[#94A3B8]"><span>Campaign</span><span>Contacts</span><span>Sent</span><span>Open rate</span><span>Reply rate</span><span>Meetings</span><span>Actions</span></div>
        {campaigns.map((campaign, campaignIndex) => {
          const isPaused = campaign.status === 'Paused'
          return <div key={campaign.name} className="grid grid-cols-[minmax(250px,1.5fr)_repeat(5,minmax(80px,.5fr))_140px] items-center border-t border-[#EEF2F7] px-5 py-5 text-[10px]">
            <div><div className="font-display text-[12px] font-semibold">{campaign.name}</div><div className={`mt-1.5 inline-flex items-center gap-1.5 text-[8px] font-bold ${campaign.status === 'Live' && !isPaused ? 'text-[#36805A]' : 'text-[#94A3B8]'}`}><i className={`h-1.5 w-1.5 rounded-full ${campaign.status === 'Live' && !isPaused ? 'bg-[#4ADE80]' : 'bg-[#CBD5E1]'}`} />{isPaused ? 'Paused' : campaign.status}</div></div>
            <span>{campaign.contacts.toLocaleString()}</span><span>{campaign.sent}</span><span className="font-semibold">{campaign.open}</span><span>{campaign.reply}</span><span className="font-semibold text-[#2563EB]">{campaign.meetings}</span>
            <div className="flex gap-1.5"><button onClick={() => openEditor(campaignIndex)} className="rounded-md border border-[#DCE4F0] px-2 py-1.5 text-[8px] font-semibold text-[#64748B]">Manage</button>{campaign.status !== 'Draft' && <button disabled={!canWrite} onClick={() => { if (!canWrite) return; const action = isPaused ? api.resumeCampaign(campaign.id) : api.pauseCampaign(campaign.id); void action.then((saved) => setCampaigns((items) => items.map((item) => item.id === campaign.id ? { ...saved, status: presentStatus(saved.status) } : item))).catch(() => notify('Could not update the campaign')) }} className="rounded-md bg-[#F1F5F9] px-2 py-1.5 text-[8px] font-semibold text-[#64748B]">{isPaused ? 'Resume' : 'Pause'}</button>}</div>
          </div>
        })}
      </div>
      <div className="mt-5 rounded-xl border border-[#DCE4F0] bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-display text-[14px] font-semibold">Sending domains</h3><p className="mt-1 text-[9px] text-[#94A3B8]">Lookalike domains protect micraftdesign.co.uk and isolate sender reputation.</p></div><div className="flex gap-2"><button onClick={() => setDomainMode(domainMode === 'add' ? null : 'add')} className="rounded-lg border border-[#DCE4F0] px-3 py-2 text-[8px] font-semibold text-[#52627A]">Add owned domain</button><button onClick={() => setDomainMode(domainMode === 'buy' ? null : 'buy')} className="rounded-lg bg-[#172554] px-3 py-2 text-[8px] font-semibold text-white">Buy lookalike domain</button></div></div>
        {domainMode === 'add' && <form onSubmit={addOwnedDomain} className="mt-4 flex gap-2 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] p-3"><input required value={ownedDomain} onChange={(event) => setOwnedDomain(event.target.value)} className="min-w-0 flex-1 rounded-md border border-[#DCE4F0] bg-white px-3 text-[9px] outline-none" placeholder="your-domain.co.uk" /><button type="submit" className="rounded-md bg-[#172554] px-4 py-2.5 text-[8px] font-semibold text-white">Add & verify</button></form>}
        {domainMode === 'buy' && <div className="mt-4 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-4"><div className="flex items-center justify-between"><div><div className="text-[9px] font-semibold text-[#1D4ED8]">Available lookalike domains</div><div className="mt-1 text-[8px] text-[#64748B]">£19/year each · DNS and SSL provisioned automatically</div></div><button onClick={() => setDomainMode(null)} className="text-[#94A3B8]"><Icon name="close" size={12} /></button></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{lookalikeDomains.filter((domain) => !domains.some((item) => item.name === domain)).map((domain) => <div key={domain} className="flex items-center justify-between rounded-lg bg-white p-3"><div><div className="text-[9px] font-semibold text-[#334155]">{domain}</div><div className="mt-1 text-[7px] text-[#15803D]">Available</div></div><button onClick={() => buyDomain(domain)} className="rounded-md bg-[#172554] px-3 py-2 text-[8px] font-semibold text-white">Buy £19</button></div>)}</div></div>}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{domains.map((domain) => <div key={domain.name} className="rounded-lg border border-[#E2E8F0] p-3"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="truncate text-[9px] font-semibold">{domain.name}</div><div className={`mt-1 text-[7px] font-semibold ${domain.status === 'Healthy' ? 'text-[#15803D]' : 'text-[#C2410C]'}`}>{domain.status}</div></div><i className={`mt-1 h-2 w-2 shrink-0 rounded-full ${domain.status === 'Healthy' ? 'bg-[#4ADE80]' : 'bg-[#FB923C]'}`} /></div><div className="mt-3 flex items-center justify-between border-t border-[#EEF2F7] pt-2"><span className="text-[8px] text-[#94A3B8]">{domain.inboxes} inboxes · {domain.health}</span><button onClick={() => { void api.removeDomain(domain.id).then(() => { setDomains((items) => items.filter((item) => item.id !== domain.id)); notify(`${domain.name} removed`) }).catch(() => notify('Could not remove that domain')) }} className="text-[7px] font-semibold text-[#B91C1C]">Remove</button></div></div>)}</div>
      </div>
      {editor !== null && <div className="fixed inset-0 z-[70] grid place-items-center bg-[#0F172A]/55 p-4" onMouseDown={() => setEditor(null)}>
        <form onSubmit={(event) => { event.preventDefault(); saveCampaign() }} onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between"><div><div className="text-[9px] font-bold uppercase tracking-wider text-[#2563EB]">{editor === -1 ? 'New outbound campaign' : 'Campaign settings'}</div><h3 className="mt-2 font-display text-xl font-semibold">{editor === -1 ? 'Create campaign' : 'Configure campaign'}</h3></div><button type="button" onClick={() => setEditor(null)} className="grid h-8 w-8 place-items-center rounded-full bg-[#F1F5F9] text-[#64748B]"><Icon name="close" size={14} /></button></div>
          <label className="mt-6 block text-[9px] font-bold uppercase tracking-wider text-[#64748B]">Campaign name<input autoFocus value={campaignName} onChange={(event) => setCampaignName(event.target.value)} className="mt-2 w-full rounded-lg border border-[#DCE4F0] px-3 py-3 text-[10px] font-normal normal-case tracking-normal outline-none focus:border-[#2563EB]" placeholder="e.g. London approved schemes" /></label>
          <label className="mt-4 block text-[9px] font-bold uppercase tracking-wider text-[#64748B]">Target region<select value={campaignRegion} onChange={(event) => setCampaignRegion(event.target.value)} className="mt-2 w-full rounded-lg border border-[#DCE4F0] bg-white px-3 py-3 text-[10px] font-normal normal-case tracking-normal outline-none"><option>London</option><option>South East</option></select></label>
          <div className="mt-4 rounded-lg bg-[#F8FAFD] p-3 text-[9px] leading-relaxed text-[#64748B]">Matching approved schemes and verified contacts will be added after the campaign is saved.</div>
          {editor !== null && editor >= 0 && <label className="mt-4 block text-[9px] font-bold uppercase tracking-wider text-[#64748B]">Add contacts<textarea value={leadText} onChange={(event) => setLeadText(event.target.value)} rows={3} className="mt-2 w-full resize-none rounded-lg border border-[#DCE4F0] p-3 text-[10px] font-normal normal-case tracking-normal outline-none" placeholder="one email per line" /></label>}
          {editor !== null && editor >= 0 && <button type="button" onClick={() => {
            const leads = leadText.split(/[\s,;]+/).map((email) => email.trim()).filter((email) => email.includes('@')).map((email) => ({ email }))
            const campaign = campaigns[editor]
            if (!campaign || !leads.length) return
            void api.addCampaignLeads(campaign.id, leads).then((result) => { notify(`${result.added} contacts added`); setLeadText('') }).catch((error: unknown) => notify(error instanceof Error ? error.message : 'Could not add contacts'))
          }} className="mt-3 w-full rounded-lg border border-[#DCE4F0] py-2.5 text-[9px] font-semibold text-[#172554]">Add contacts to this campaign</button>}
          <div className="mt-6 flex gap-3"><button type="button" onClick={() => setEditor(null)} className="flex-1 rounded-lg border border-[#DCE4F0] py-3 text-[9px] font-semibold text-[#64748B]">Cancel</button><button type="submit" className="flex-1 rounded-lg bg-[#172554] py-3 text-[9px] font-semibold text-white">{editor === -1 ? 'Create draft' : 'Save changes'}</button></div>
        </form>
      </div>}
    </>
  )
}

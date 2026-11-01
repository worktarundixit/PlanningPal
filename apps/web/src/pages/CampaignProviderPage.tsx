import { useEffect, useState, type FormEvent } from 'react'
import { PageIntro } from '../components/PageIntro'
import { api, type CampaignMapping, type ProviderWorkspace } from '../lib/api'
import { notify } from '../lib/notify'

const healthCopy: Record<string, string> = {
  ok: 'Connected',
  attention: 'Needs attention',
  unknown: 'Not checked',
}

const eventCopy: Record<string, string> = {
  registered: 'Events connected',
  unavailable: 'Events need a plan that supports them',
  not_configured: 'Event secret is not configured',
  error: 'Events need attention',
  sandbox: 'Sandbox',
  unknown: 'Not checked',
}

export function CampaignProviderPage() {
  const [hint, setHint] = useState('')
  const [configured, setConfigured] = useState(false)
  const [mode, setMode] = useState<'sandbox' | 'live'>('sandbox')
  const [apiKey, setApiKey] = useState('')
  const [workspaces, setWorkspaces] = useState<ProviderWorkspace[]>([])
  const [mappings, setMappings] = useState<CampaignMapping[]>([])
  const [drafts, setDrafts] = useState<Record<string, { providerWorkspaceId: string; trackingDomain: string }>>({})

  const load = () =>
    Promise.all([api.campaignProvider(), api.providerWorkspaces(), api.campaignMappings()])
      .then(([settings, workspaceList, mappingList]) => {
        setHint(settings.hint)
        setConfigured(settings.configured)
        setMode(settings.mode)
        setWorkspaces(workspaceList.data)
        setMappings(mappingList.data)
        setDrafts(Object.fromEntries(mappingList.data.map((item) => [item.organisationId, { providerWorkspaceId: item.providerWorkspaceId, trackingDomain: item.trackingDomain }])))
      })
      .catch((error: unknown) => notify(error instanceof Error ? error.message : 'Could not load campaign provider settings'))

  useEffect(() => { void load() }, [])

  const saveKey = (event: FormEvent) => {
    event.preventDefault()
    void api.saveCampaignProvider(apiKey).then((settings) => {
      setHint(settings.hint)
      setConfigured(settings.configured)
      setMode(settings.mode)
      setApiKey('')
      notify(settings.configured ? 'Agency key saved' : 'Agency key removed. Sandbox mode is on.')
      void load()
    }).catch((error: unknown) => notify(error instanceof Error ? error.message : 'Could not save the agency key'))
  }

  const saveMapping = (organisationId: string) => {
    const draft = drafts[organisationId]
    if (!draft?.providerWorkspaceId.trim()) return notify('Enter a provider workspace id')
    void api.saveCampaignMapping({ organisationId, providerWorkspaceId: draft.providerWorkspaceId.trim(), trackingDomain: draft.trackingDomain })
      .then(() => { notify('Client mapping saved'); void load() })
      .catch((error: unknown) => notify(error instanceof Error ? error.message : 'Could not save that mapping'))
  }

  return (
    <>
      <PageIntro
        eyebrow="Hitcaliber only"
        title="Campaign provider"
        description="One agency key runs every client workspace. Clients only see PlanningPal Campaigns. The key is encrypted on the server and is not shown again after you save it."
      />
      <div className="mb-5 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-4 text-[10px] leading-relaxed text-[#92400E]">
        Each client needs a custom tracking domain configured in the provider so tracking links stay on your domain. Webhooks require a provider plan that supports them. New workspaces are not created from here — map an existing one, or paste its id.
      </div>
      <section className="rounded-xl border border-[#DCE4F0] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-[14px] font-semibold">Agency API key</h3>
            <p className="mt-1 text-[9px] text-[#94A3B8]">{configured ? `Saved ${hint}` : 'No key saved. The campaign engine is in sandbox mode.'}</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[8px] font-bold ${mode === 'live' ? 'bg-[#ECFDF5] text-[#15803D]' : 'bg-[#EFF6FF] text-[#1D4ED8]'}`}>{mode === 'live' ? 'Live' : 'Sandbox'}</span>
        </div>
        <form onSubmit={saveKey} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input type="password" autoComplete="off" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="Paste the agency key" className="min-w-0 flex-1 rounded-lg border border-[#DCE4F0] px-3 py-3 text-[11px] outline-none" />
          <button type="submit" className="rounded-lg bg-[#172554] px-4 py-3 text-[10px] font-semibold text-white">Save key</button>
          {configured && <button type="button" onClick={() => { setApiKey(''); void api.saveCampaignProvider('').then(() => { notify('Agency key removed'); void load() }) }} className="rounded-lg border border-[#DCE4F0] px-4 py-3 text-[10px] font-semibold text-[#64748B]">Remove</button>}
        </form>
      </section>
      <section className="mt-5 overflow-hidden rounded-xl border border-[#DCE4F0] bg-white">
        <div className="border-b border-[#EEF2F7] px-5 py-4">
          <h3 className="font-display text-[14px] font-semibold">Client workspaces</h3>
          <p className="mt-1 text-[9px] text-[#94A3B8]">Map each PlanningPal client to a provider workspace and store the tracking domain.</p>
        </div>
        <div className="divide-y divide-[#EEF2F7]">
          {mappings.map((mapping) => {
            const draft = drafts[mapping.organisationId] ?? { providerWorkspaceId: '', trackingDomain: '' }
            return (
              <div key={mapping.organisationId} className="grid gap-3 px-5 py-4 lg:grid-cols-[180px_1fr_180px_140px_auto] lg:items-end">
                <div>
                  <div className="text-[10px] font-semibold text-[#334155]">{mapping.organisationName}</div>
                  <div className="mt-1 text-[8px] font-semibold text-[#64748B]">{healthCopy[mapping.health] ?? 'Needs attention'}</div>
                  <div className="mt-1 text-[8px] text-[#94A3B8]">{eventCopy[mapping.webhookStatus] ?? 'Not checked'}</div>
                </div>
                <label className="text-[8px] font-bold uppercase tracking-wider text-[#64748B]">Provider workspace
                  <input list={`workspaces-${mapping.organisationId}`} value={draft.providerWorkspaceId} onChange={(event) => setDrafts((items) => ({ ...items, [mapping.organisationId]: { ...draft, providerWorkspaceId: event.target.value } }))} className="mt-2 w-full rounded-lg border border-[#DCE4F0] px-3 py-2.5 text-[10px] font-normal normal-case tracking-normal outline-none" placeholder="Choose or paste an id" />
                  <datalist id={`workspaces-${mapping.organisationId}`}>{workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}</datalist>
                </label>
                <label className="text-[8px] font-bold uppercase tracking-wider text-[#64748B]">Tracking domain
                  <input value={draft.trackingDomain} onChange={(event) => setDrafts((items) => ({ ...items, [mapping.organisationId]: { ...draft, trackingDomain: event.target.value } }))} className="mt-2 w-full rounded-lg border border-[#DCE4F0] px-3 py-2.5 text-[10px] font-normal normal-case tracking-normal outline-none" placeholder="track.client.co.uk" />
                </label>
                <div className="text-[8px] text-[#94A3B8]">{mapping.status === 'mapped' ? 'Mapped' : 'Not mapped'}</div>
                <button type="button" onClick={() => saveMapping(mapping.organisationId)} className="rounded-lg bg-[#172554] px-3 py-2.5 text-[9px] font-semibold text-white">Save mapping</button>
              </div>
            )
          })}
        </div>
      </section>
    </>
  )
}

import { useEffect, useState, type FormEvent } from 'react'
import { EmptyState, LoadingBlock } from '../components/EmptyState'
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
  const [drafts, setDrafts] = useState<Record<string, { providerWorkspaceId: string; trackingDomain: string; workspaceApiKey: string }>>({})
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  const load = () =>
    Promise.all([api.campaignProvider(), api.providerWorkspaces(), api.campaignMappings()])
      .then(([settings, workspaceList, mappingList]) => {
        setHint(settings.hint)
        setConfigured(settings.configured)
        setMode(settings.mode)
        setWorkspaces(workspaceList.data)
        setMappings(mappingList.data)
        setDrafts(Object.fromEntries(mappingList.data.map((item) => [item.organisationId, { providerWorkspaceId: item.providerWorkspaceId, trackingDomain: item.trackingDomain, workspaceApiKey: '' }])))
        setStatus('ready')
      })
      .catch(() => setStatus('error'))

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
    const hasWorkspaceId = Boolean(draft?.providerWorkspaceId.trim())
    const hasWorkspaceKey = Boolean(draft?.workspaceApiKey.trim())
    if (!hasWorkspaceId && !hasWorkspaceKey && !configured) return notify('Enter a provider workspace id or paste a workspace API key')
    void api.saveCampaignMapping({
      organisationId,
      providerWorkspaceId: draft?.providerWorkspaceId.trim() ?? '',
      trackingDomain: draft?.trackingDomain ?? '',
      ...(hasWorkspaceKey ? { workspaceApiKey: draft.workspaceApiKey.trim() } : {}),
    })
      .then(() => { notify('Client mapping saved'); void load() })
      .catch((error: unknown) => notify(error instanceof Error ? error.message : 'Could not save that mapping'))
  }

  return (
    <>
      <PageIntro
        eyebrow="Hitcaliber only"
        title="Campaign provider"
        description="Connect the v2 campaign engine once at agency level or attach dedicated workspace-scoped keys per client. Clients only see PlanningPal Campaigns. Keys are encrypted on the server and never shown again after saving."
      />
      <div className="mb-5 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-4 text-[10px] leading-relaxed text-[#92400E]">
        Create a v2 API key with <span className="font-semibold">campaigns:all</span>, <span className="font-semibold">leads:all</span>, <span className="font-semibold">webhooks:all</span>, <span className="font-semibold">workspaces:read</span>, and <span className="font-semibold">workspace_group_members:read</span> scopes. Because v2 keys are scoped to the workspace where they are minted, you can also paste a client sub-workspace API key on any row below to isolate its campaigns, contacts, and webhooks (leaving the workspace ID blank will detect it automatically).
      </div>
      <section className="rounded-xl border border-[#DCE4F0] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-[14px] font-semibold">Agency API key (v2 Bearer)</h3>
            <p className="mt-1 text-[9px] text-[#94A3B8]">{configured ? `Saved ${hint} · ${workspaces.length} workspace${workspaces.length === 1 ? '' : 's'} available` : 'No key saved. The campaign engine is in sandbox mode.'}</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[8px] font-bold ${mode === 'live' ? 'bg-[#ECFDF5] text-[#15803D]' : 'bg-[#EFF6FF] text-[#1D4ED8]'}`}>{mode === 'live' ? 'Live' : 'Sandbox'}</span>
        </div>
        <form onSubmit={saveKey} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input type="password" autoComplete="off" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="Paste the v2 agency API key" className="min-w-0 flex-1 rounded-lg border border-[#DCE4F0] px-3 py-3 text-[11px] outline-none" />
          <button type="submit" className="rounded-lg bg-[#172554] px-4 py-3 text-[10px] font-semibold text-white">Save key</button>
          {configured && <button type="button" onClick={() => { setApiKey(''); void api.saveCampaignProvider('').then(() => { notify('Agency key removed'); void load() }) }} className="rounded-lg border border-[#DCE4F0] px-4 py-3 text-[10px] font-semibold text-[#64748B]">Remove</button>}
        </form>
      </section>
      <section className="mt-5 overflow-hidden rounded-xl border border-[#DCE4F0] bg-white">
        <div className="border-b border-[#EEF2F7] px-5 py-4">
          <h3 className="font-display text-[14px] font-semibold">Client workspaces</h3>
          <p className="mt-1 text-[9px] text-[#94A3B8]">Map each PlanningPal client to a provider workspace UUID, optional dedicated workspace API key, and custom tracking domain.</p>
        </div>
        <div className="divide-y divide-[#EEF2F7]">
          {status === 'loading' && <div className="p-4"><LoadingBlock label="Loading client mappings" /></div>}
          {status === 'error' && <div className="p-4"><EmptyState kind="error" title="Client mappings could not be loaded." action={{ label: 'Try again', onClick: () => void load() }} /></div>}
          {status === 'ready' && mappings.length === 0 && <div className="p-4"><EmptyState icon="briefcase" title="No client workspaces to map yet." /></div>}
          {mappings.map((mapping) => {
            const draft = drafts[mapping.organisationId] ?? { providerWorkspaceId: '', trackingDomain: '', workspaceApiKey: '' }
            return (
              <div key={mapping.organisationId} className="grid gap-3 px-5 py-4 lg:grid-cols-[170px_1fr_1fr_170px_110px_auto] lg:items-end">
                <div>
                  <div className="text-[10px] font-semibold text-[#334155]">{mapping.organisationName}</div>
                  <div className="mt-1 text-[8px] font-semibold text-[#64748B]">{healthCopy[mapping.health] ?? 'Needs attention'}</div>
                  <div className="mt-1 text-[8px] text-[#94A3B8]">{eventCopy[mapping.webhookStatus] ?? 'Not checked'}</div>
                </div>
                <label className="text-[8px] font-bold uppercase tracking-wider text-[#64748B]">Provider workspace
                  <input list={`workspaces-${mapping.organisationId}`} value={draft.providerWorkspaceId} onChange={(event) => setDrafts((items) => ({ ...items, [mapping.organisationId]: { ...draft, providerWorkspaceId: event.target.value } }))} className="mt-2 w-full rounded-lg border border-[#DCE4F0] px-3 py-2.5 text-[10px] font-normal normal-case tracking-normal outline-none" placeholder="Choose, paste UUID, or auto-detect" />
                  <datalist id={`workspaces-${mapping.organisationId}`}>{workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}</datalist>
                </label>
                <label className="text-[8px] font-bold uppercase tracking-wider text-[#64748B]">Workspace API key {mapping.keyHint ? `(${mapping.keyHint})` : '(optional)'}
                  <input type="password" autoComplete="off" value={draft.workspaceApiKey} onChange={(event) => setDrafts((items) => ({ ...items, [mapping.organisationId]: { ...draft, workspaceApiKey: event.target.value } }))} className="mt-2 w-full rounded-lg border border-[#DCE4F0] px-3 py-2.5 text-[10px] font-normal normal-case tracking-normal outline-none" placeholder={mapping.keyHint ? `Saved ${mapping.keyHint} — paste to replace` : 'Uses agency key unless set'} />
                </label>
                <label className="text-[8px] font-bold uppercase tracking-wider text-[#64748B]">Tracking domain
                  <input value={draft.trackingDomain} onChange={(event) => setDrafts((items) => ({ ...items, [mapping.organisationId]: { ...draft, trackingDomain: event.target.value } }))} className="mt-2 w-full rounded-lg border border-[#DCE4F0] px-3 py-2.5 text-[10px] font-normal normal-case tracking-normal outline-none" placeholder="track.client.co.uk" />
                </label>
                <div className="text-[8px] text-[#94A3B8]">
                  <div>{mapping.status === 'mapped' ? 'Mapped' : 'Not mapped'}</div>
                  <div className="mt-0.5 text-[7px]">{mapping.keyHint ? `Dedicated key ${mapping.keyHint}` : 'Agency key'}</div>
                </div>
                <button type="button" onClick={() => saveMapping(mapping.organisationId)} className="rounded-lg bg-[#172554] px-3 py-2.5 text-[9px] font-semibold text-white">Save mapping</button>
              </div>
            )
          })}
        </div>
      </section>
    </>
  )
}

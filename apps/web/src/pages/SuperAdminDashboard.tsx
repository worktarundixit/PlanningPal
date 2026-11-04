import { useEffect, useState } from 'react'
import type { Scheme } from '@planningpal/shared'
import { Icon } from '../components/Icon'
import { Ingestion } from './Ingestion'
import { CampaignProviderPage } from './CampaignProviderPage'
import { PlanningExplorer } from './PlanningExplorer'
import { UploadPlanningDataModal } from '../components/UploadPlanningDataModal'
import { api, type ClientOnboarding, setActiveWorkspaceId } from '../lib/api'
import { notify } from '../lib/notify'

export function SuperAdminDashboard() {
  const [tab, setTab] = useState<'clients' | 'ingestion' | 'provider' | 'leads'>('clients')
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(() => new Set(['clients']))
  const [clients, setClients] = useState<ClientOnboarding[]>([])
  const [loading, setLoading] = useState(true)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  // Form state for + Add New Customer
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [coverage, setCoverage] = useState<'CATEGORY_3' | 'ALL_UK'>('CATEGORY_3')
  const [sendEmail, setSendEmail] = useState(true)
  const [emailSentStatus, setEmailSentStatus] = useState<boolean | null>(null)
  const [createdInviteUrl, setCreatedInviteUrl] = useState('')
  const [sendingInviteId, setSendingInviteId] = useState<string | null>(null)

  // Global leads explorer state
  const [leads, setLeads] = useState<Scheme[]>([])
  const [_selectedScheme, setSelectedScheme] = useState<Scheme | null>(null)

  const loadClients = () => {
    setLoading(true)
    api.onboardingClients()
      .then((res) => {
        setClients(res.data)
      })
      .catch(() => notify('Could not load client list'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadClients()
    api.leads()
      .then((res) => setLeads(res.data))
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    setVisitedTabs((prev) => {
      if (prev.has(tab)) return prev
      const next = new Set(prev)
      next.add(tab)
      return next
    })
  }, [tab])

  const resetAddModal = () => {
    setFirstName('')
    setLastName('')
    setEmail('')
    setCompanyName('')
    setCoverage('CATEGORY_3')
    setSendEmail(true)
    setCreatedInviteUrl('')
    setEmailSentStatus(null)
    setAddModalOpen(false)
  }

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !email.trim() || !companyName.trim()) return
    setBusy(true)
    try {
      const res = await api.createOnboardingClient({
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        email: email.trim().toLowerCase(),
        companyName: companyName.trim(),
        coverage,
        sendEmail,
      })
      const fullInvite = res.inviteUrl || `${window.location.origin}/accept-invite?token=${res.inviteToken || res.token}`
      setCreatedInviteUrl(fullInvite)
      setEmailSentStatus(res.emailSent)
      notify(`Customer workspace created for ${companyName}${res.emailSent ? ' & invite email sent' : ''}`)
      loadClients()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not create customer')
    } finally {
      setBusy(false)
    }
  }

  const handleSendInviteEmail = async (clientId: string) => {
    setSendingInviteId(clientId)
    try {
      const res = await api.resendClientInvite(clientId)
      notify(`Invitation email sent to ${res.email}`)
      loadClients()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not send invite email')
    } finally {
      setSendingInviteId(null)
    }
  }

  const openClientView = (workspaceId: string) => {
    setActiveWorkspaceId(workspaceId)
    window.location.assign('/app')
  }

  const copyInvite = (url: string) => {
    void navigator.clipboard.writeText(url).then(() => {
      notify('Invite link copied to clipboard')
    })
  }

  return (
    <div className="flex min-h-screen bg-[#F4F7FB] text-[#172033]">
      {/* Super Admin Sidebar */}
      <aside className="w-64 shrink-0 border-r border-[#DCE4F0] bg-[#0F172A] text-white">
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#2563EB] text-xs font-bold text-white">
              SA
            </span>
            <div>
              <div className="text-xs font-bold tracking-wider uppercase text-[#93C5FD]">Super Admin</div>
              <div className="text-[10px] text-white/60">Platform Console</div>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1.5">
          <button
            onClick={() => setTab('clients')}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
              tab === 'clients' ? 'bg-[#2563EB] text-white' : 'text-white/70 hover:bg-white/5'
            }`}
          >
            <Icon name="users" size={15} /> Clients & Onboarding
          </button>
          <button
            onClick={() => setTab('ingestion')}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
              tab === 'ingestion' ? 'bg-[#2563EB] text-white' : 'text-white/70 hover:bg-white/5'
            }`}
          >
            <Icon name="download" size={15} /> Ingestion & 380 LPAs
          </button>
          <button
            onClick={() => setTab('provider')}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
              tab === 'provider' ? 'bg-[#2563EB] text-white' : 'text-white/70 hover:bg-white/5'
            }`}
          >
            <Icon name="briefcase" size={15} /> Campaign Provider
          </button>
          <button
            onClick={() => setTab('leads')}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
              tab === 'leads' ? 'bg-[#2563EB] text-white' : 'text-white/70 hover:bg-white/5'
            }`}
          >
            <Icon name="search" size={15} /> Global Lead Explorer
          </button>
        </nav>

        <div className="p-4 mt-8 border-t border-white/10">
          <button
            onClick={() => {
              setActiveWorkspaceId(null)
              window.location.assign('/app')
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white/90 hover:bg-white/10"
          >
            <Icon name="external" size={13} /> Switch to Client App
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <header className="flex h-16 items-center justify-between border-b border-[#DCE4F0] bg-white px-8">
          <div>
            <h1 className="text-base font-semibold text-[#172554]">
              {tab === 'clients' && 'Customer Workspaces & Onboarding'}
              {tab === 'ingestion' && 'Planning Ingestion & Council Health'}
              {tab === 'provider' && 'Campaign Delivery Provider Setup'}
              {tab === 'leads' && 'Global Planning Database & Dossiers'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {(tab === 'ingestion' || tab === 'leads') && (
              <button
                onClick={() => setUploadModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-[#172554] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#1E3A8A]"
              >
                <Icon name="plus" size={13} /> Upload Planning Data
              </button>
            )}
            {tab === 'clients' && (
              <button
                onClick={() => {
                  setCreatedInviteUrl('')
                  setAddModalOpen(true)
                }}
                className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#1D4ED8]"
              >
                <span className="text-sm leading-none">+</span> Add New Customer
              </button>
            )}
          </div>
        </header>

        <div className="p-8">
          {visitedTabs.has('clients') && (
            <div className={tab === 'clients' ? 'space-y-6' : 'hidden'}>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-[#DCE4F0] bg-white p-5 shadow-xs">
                  <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Total Workspaces</div>
                  <div className="mt-2 text-2xl font-bold text-[#172554]">{clients.length}</div>
                </div>
                <div className="rounded-xl border border-[#DCE4F0] bg-white p-5 shadow-xs">
                  <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Completed Onboarding</div>
                  <div className="mt-2 text-2xl font-bold text-[#16A34A]">{clients.filter((c) => c.finished).length}</div>
                </div>
                <div className="rounded-xl border border-[#DCE4F0] bg-white p-5 shadow-xs">
                  <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">In Progress</div>
                  <div className="mt-2 text-2xl font-bold text-[#D97706]">{clients.filter((c) => !c.finished).length}</div>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#DCE4F0] bg-white shadow-xs">
                <div className="border-b border-[#EEF2F7] px-6 py-4">
                  <h3 className="text-sm font-semibold text-[#172554]">Customer Organizations</h3>
                </div>
                {loading ? (
                  <div className="p-8 text-center text-xs text-[#64748B]">Loading workspaces…</div>
                ) : clients.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#64748B]">No customer organizations created yet.</div>
                ) : (
                  <div className="divide-y divide-[#EEF2F7]">
                    {clients.map((client) => (
                      <div key={client.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#172554]">{client.name}</span>
                            <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-semibold text-[#2563EB]">
                              {client.planName}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              client.finished ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#FEF3C7] text-[#B45309]'
                            }`}>
                              {client.finished ? 'Live' : `Onboarding · Step: ${client.step}`}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-[#64748B]">
                            Owner: <span className="text-[#334155] font-medium">{client.ownerName || 'Pending Invite'}</span> · Coverage: {client.coverage}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSendInviteEmail(client.id)}
                            disabled={sendingInviteId === client.id}
                            className="flex items-center gap-1.5 rounded-lg border border-[#DCE4F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#2563EB] hover:bg-[#EFF6FF] disabled:opacity-50"
                            title="Send or resend onboarding invite email via Resend"
                          >
                            <Icon name="mail" size={13} />
                            {sendingInviteId === client.id ? 'Sending…' : 'Send Email'}
                          </button>
                          {client.inviteUrl && (
                            <button
                              onClick={() => copyInvite(client.inviteUrl!)}
                              className="rounded-lg border border-[#DCE4F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#52627A] hover:bg-[#F8FAFC]"
                            >
                              Copy Invite Link
                            </button>
                          )}
                          <button
                            onClick={() => openClientView(client.id)}
                            className="flex items-center gap-1.5 rounded-lg bg-[#172554] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#1E3A8A]"
                          >
                            Open Client View <Icon name="arrow" size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {visitedTabs.has('ingestion') && (
            <div className={tab === 'ingestion' ? '' : 'hidden'}>
              <Ingestion />
            </div>
          )}
          {visitedTabs.has('provider') && (
            <div className={tab === 'provider' ? '' : 'hidden'}>
              <CampaignProviderPage />
            </div>
          )}
          {visitedTabs.has('leads') && (
            <div className={tab === 'leads' ? '' : 'hidden'}>
              <PlanningExplorer
                data={leads}
                onOpen={setSelectedScheme}
                onSave={() => {}}
                saved={[]}
                canSave={false}
                canExport={true}
                canCampaign={false}
              />
            </div>
          )}
        </div>
      </main>

      {/* Add New Customer Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={resetAddModal}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#EEF2F7] pb-4">
              <h3 className="text-base font-bold text-[#172554]">+ Add New Customer Workspace</h3>
              <button onClick={resetAddModal} className="text-[#94A3B8] hover:text-[#64748B]">
                <Icon name="close" size={16} />
              </button>
            </div>

            {!createdInviteUrl ? (
              <form onSubmit={handleAddCustomer} className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    First Name
                    <input
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. David"
                      className="mt-1.5 w-full rounded-lg border border-[#DCE4F0] px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
                    />
                  </label>
                  <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    Last Name
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Miller"
                      className="mt-1.5 w-full rounded-lg border border-[#DCE4F0] px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
                    />
                  </label>
                </div>

                <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  Client Email Address
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="david@millergroup.co.uk"
                    className="mt-1.5 w-full rounded-lg border border-[#DCE4F0] px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
                  />
                </label>

                <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  Company / Organization Name
                  <input
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Miller Construction Ltd"
                    className="mt-1.5 w-full rounded-lg border border-[#DCE4F0] px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
                  />
                </label>

                <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  Coverage Plan
                  <select
                    value={coverage}
                    onChange={(e) => setCoverage(e.target.value as 'CATEGORY_3' | 'ALL_UK')}
                    className="mt-1.5 w-full rounded-lg border border-[#DCE4F0] bg-white px-3 py-2 text-sm outline-none"
                  >
                    <option value="CATEGORY_3">Regional / Category 3 Tier</option>
                    <option value="ALL_UK">All UK / Nationwide 380 LPAs</option>
                  </select>
                </label>

                <label className="flex items-center gap-2.5 pt-1 text-xs font-medium text-[#334155] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <span>Send invitation email immediately to client email</span>
                </label>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#EEF2F7]">
                  <button
                    type="button"
                    onClick={resetAddModal}
                    className="rounded-lg border border-[#DCE4F0] px-4 py-2 text-xs font-semibold text-[#64748B]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-lg bg-[#2563EB] px-5 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8] disabled:opacity-50"
                  >
                    {busy ? 'Creating Workspace…' : 'Create & Generate Invite Link'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-4 text-xs text-[#166534]">
                  <p className="font-semibold">Customer workspace created successfully!</p>
                  <p className="mt-1 text-[11px] leading-relaxed">
                    {emailSentStatus
                      ? `Invitation email has been sent to ${email}. You can also share the direct link below with ${firstName} ${lastName}:`
                      : `Share this invite link with ${firstName} ${lastName} (${email}). When they click it, their name will be pre-filled and they will be guided through their workspace onboarding checklist.`}
                  </p>
                </div>

                <div className="rounded-lg border border-[#DCE4F0] bg-[#F8FAFC] p-3 text-xs break-all font-mono text-[#334155]">
                  {createdInviteUrl}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => copyInvite(createdInviteUrl)}
                    className="flex-1 rounded-lg bg-[#2563EB] py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
                  >
                    Copy Invite Link
                  </button>
                  <button
                    onClick={resetAddModal}
                    className="rounded-lg border border-[#DCE4F0] px-4 py-2 text-xs font-semibold text-[#64748B]"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <UploadPlanningDataModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => {
          api.leads().then((res) => setLeads(res.data)).catch(() => {})
        }}
      />
    </div>
  )
}

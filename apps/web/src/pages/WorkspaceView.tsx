import { useEffect, useState } from 'react'
import type { Scheme, UserProfile } from '@planningpal/shared'
import type { CrmTab, ReportsTab, SetupTab } from '../types'
import { Billing } from './Billing'
import { CampaignProviderPage } from './CampaignProviderPage'
import { Campaigns } from './Campaigns'
import { DeliveryHub } from './DeliveryHub'
import { Ingestion } from './Ingestion'
import { IntentBoard } from './IntentBoard'
import { PersonaStudio } from './PersonaStudio'
import { PlanningExplorer } from './PlanningExplorer'
import { ProfilePage } from './ProfilePage'
import { Reports } from './Reports'
import { SavedSchemes } from './SavedSchemes'
import { Settings } from './SettingsPage'
import { TeamManagement } from './TeamManagement'

export function WorkspaceView({ active, data, crmTab, setCrmTab, setInboxUnread, reportsTab, setupTab, campaignSettingsOpen, setCampaignSettingsOpen, campaignCreateSignal, profile, setProfile, saved, onOpen, onSave, canSave = true, canExport = true, canCampaign = true, canCrm = true, canSettings = true, canTeam = true, actorRole = null, onNavigate }: {
  active: string
  data: Scheme[]
  crmTab: CrmTab
  setCrmTab: (tab: CrmTab) => void
  setInboxUnread: (count: number) => void
  reportsTab: ReportsTab
  setupTab: SetupTab
  campaignSettingsOpen: boolean
  setCampaignSettingsOpen: (open: boolean) => void
  campaignCreateSignal: number
  profile: UserProfile
  setProfile: (profile: UserProfile) => void
  saved: string[]
  onOpen: (scheme: Scheme) => void
  onSave: (id: string) => void
  canSave?: boolean
  canExport?: boolean
  canCampaign?: boolean
  canCrm?: boolean
  canSettings?: boolean
  canTeam?: boolean
  actorRole?: string | null
  onNavigate?: (screen: string) => void
}) {
  const [visited, setVisited] = useState<Set<string>>(() => new Set([active]))

  useEffect(() => {
    setVisited((prev) => {
      if (prev.has(active)) return prev
      const next = new Set(prev)
      next.add(active)
      return next
    })
  }, [active])

  return (
    <div className="mx-auto max-w-[1600px] p-4 sm:p-7 lg:p-9">
      {visited.has('Planning search') && (
        <div className={active === 'Planning search' ? '' : 'hidden'}>
          <PlanningExplorer data={data} onOpen={onOpen} onSave={onSave} saved={saved} canSave={canSave} canExport={canExport} canCampaign={canCampaign} onNavigate={onNavigate} />
        </div>
      )}
      {visited.has('Saved schemes') && (
        <div className={active === 'Saved schemes' ? '' : 'hidden'}>
          <SavedSchemes data={data} onOpen={onOpen} onSave={onSave} saved={saved} canSave={canSave} onNavigate={onNavigate} />
        </div>
      )}
      {visited.has('Campaigns') && (
        <div className={active === 'Campaigns' ? '' : 'hidden'}>
          <Campaigns settingsOpen={campaignSettingsOpen} setSettingsOpen={setCampaignSettingsOpen} createSignal={campaignCreateSignal} canWrite={canCampaign} />
        </div>
      )}
      {visited.has('CRM & intent') && (
        <div className={active === 'CRM & intent' ? '' : 'hidden'}>
          <IntentBoard data={data} onOpen={onOpen} crmTab={crmTab} setCrmTab={setCrmTab} setInboxUnread={setInboxUnread} canWrite={canCrm} onNavigate={onNavigate} />
        </div>
      )}
      {visited.has('Reports & delivery') && (
        <div className={active === 'Reports & delivery' ? '' : 'hidden'}>
          {reportsTab === 'reports' ? <Reports onNavigate={onNavigate} /> : <DeliveryHub onNavigate={onNavigate} />}
        </div>
      )}
      {visited.has('Workspace setup') && (
        <div className={active === 'Workspace setup' ? '' : 'hidden'}>
          {setupTab === 'persona' ? <PersonaStudio canWrite={canSettings} /> : setupTab === 'settings' ? <Settings canWrite={canSettings} /> : <TeamManagement canManage={canTeam} actorRole={actorRole} />}
        </div>
      )}
      {visited.has('Ingestion') && (
        <div className={active === 'Ingestion' ? '' : 'hidden'}>
          <Ingestion />
        </div>
      )}
      {visited.has('Campaign provider') && (
        <div className={active === 'Campaign provider' ? '' : 'hidden'}>
          <CampaignProviderPage />
        </div>
      )}
      {visited.has('Billing') && (
        <div className={active === 'Billing' ? '' : 'hidden'}>
          <Billing />
        </div>
      )}
      {visited.has('My profile') && (
        <div className={active === 'My profile' ? '' : 'hidden'}>
          <ProfilePage profile={profile} onSave={setProfile} />
        </div>
      )}
    </div>
  )
}

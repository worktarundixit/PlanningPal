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
  return (
    <div className="mx-auto max-w-[1600px] p-4 sm:p-7 lg:p-9">
      {active === 'Planning search' && <PlanningExplorer data={data} onOpen={onOpen} onSave={onSave} saved={saved} canSave={canSave} canExport={canExport} canCampaign={canCampaign} onNavigate={onNavigate} />}
      {active === 'Saved schemes' && <SavedSchemes data={data} onOpen={onOpen} onSave={onSave} saved={saved} canSave={canSave} onNavigate={onNavigate} />}
      {active === 'Campaigns' && <Campaigns settingsOpen={campaignSettingsOpen} setSettingsOpen={setCampaignSettingsOpen} createSignal={campaignCreateSignal} canWrite={canCampaign} />}
      {active === 'CRM & intent' && <IntentBoard data={data} onOpen={onOpen} crmTab={crmTab} setCrmTab={setCrmTab} setInboxUnread={setInboxUnread} canWrite={canCrm} onNavigate={onNavigate} />}
      {active === 'Reports & delivery' && (reportsTab === 'reports' ? <Reports onNavigate={onNavigate} /> : <DeliveryHub onNavigate={onNavigate} />)}
      {active === 'Workspace setup' && (setupTab === 'persona' ? <PersonaStudio canWrite={canSettings} /> : setupTab === 'settings' ? <Settings canWrite={canSettings} /> : <TeamManagement canManage={canTeam} actorRole={actorRole} />)}
      {active === 'Ingestion' && <Ingestion />}
      {active === 'Campaign provider' && <CampaignProviderPage />}
      {active === 'Billing' && <Billing />}
      {active === 'My profile' && <ProfilePage profile={profile} onSave={setProfile} />}
    </div>
  )
}

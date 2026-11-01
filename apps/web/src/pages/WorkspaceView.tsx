import type { Scheme, UserProfile } from '@planningpal/shared'
import type { CrmTab, ReportsTab, SetupTab } from '../types'
import { Billing } from './Billing'
import { Campaigns } from './Campaigns'
import { DeliveryHub } from './DeliveryHub'
import { IntentBoard } from './IntentBoard'
import { PersonaStudio } from './PersonaStudio'
import { PlanningExplorer } from './PlanningExplorer'
import { ProfilePage } from './ProfilePage'
import { Reports } from './Reports'
import { SavedSchemes } from './SavedSchemes'
import { Settings } from './SettingsPage'
import { TeamManagement } from './TeamManagement'

export function WorkspaceView({ active, data, crmTab, setCrmTab, setInboxUnread, reportsTab, setupTab, campaignSettingsOpen, setCampaignSettingsOpen, campaignCreateSignal, profile, setProfile, saved, onOpen, onSave }: {
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
}) {
  return (
    <div className="mx-auto max-w-[1600px] p-4 sm:p-7 lg:p-9">
      {active === 'Planning search' && <PlanningExplorer data={data} onOpen={onOpen} onSave={onSave} saved={saved} />}
      {active === 'Saved schemes' && <SavedSchemes data={data} onOpen={onOpen} onSave={onSave} saved={saved} />}
      {active === 'Campaigns' && <Campaigns settingsOpen={campaignSettingsOpen} setSettingsOpen={setCampaignSettingsOpen} createSignal={campaignCreateSignal} />}
      {active === 'CRM & intent' && <IntentBoard data={data} onOpen={onOpen} crmTab={crmTab} setCrmTab={setCrmTab} setInboxUnread={setInboxUnread} />}
      {active === 'Reports & delivery' && (reportsTab === 'reports' ? <Reports /> : <DeliveryHub />)}
      {active === 'Workspace setup' && (setupTab === 'persona' ? <PersonaStudio /> : setupTab === 'settings' ? <Settings /> : <TeamManagement />)}
      {active === 'Billing' && <Billing />}
      {active === 'My profile' && <ProfilePage profile={profile} onSave={setProfile} />}
    </div>
  )
}

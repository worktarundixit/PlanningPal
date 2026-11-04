import { useEffect, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { PageIntro } from '../components/PageIntro'
import { api } from '../lib/api'
import { notify } from '../lib/notify'

function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false
  const sortedA = [...a].sort()
  const sortedB = [...b].sort()
  return sortedA.every((val, idx) => val === sortedB[idx])
}

export function Settings({ canWrite = true }: { canWrite?: boolean }) {
  const [alerts, setAlerts] = useState(true)
  const [savedAlerts, setSavedAlerts] = useState(true)
  const [settingsStatus, setSettingsStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [territories, setTerritories] = useState<string[]>([])
  const [savedTerritories, setSavedTerritories] = useState<string[]>([])
  const [trades, setTrades] = useState<string[]>([])
  const [savedTrades, setSavedTrades] = useState<string[]>([])
  const [radius, setRadius] = useState(25)
  const [savedRadius, setSavedRadius] = useState(25)

  // Loading/saving states
  const [isSavingTerritories, setIsSavingTerritories] = useState(false)
  const [isSavingTrades, setIsSavingTrades] = useState(false)
  const [isSavingAlerts, setIsSavingAlerts] = useState(false)
  const [isSavingAll, setIsSavingAll] = useState(false)

  useEffect(() => {
    void api.workspace().then((workspace) => {
      setTerritories(workspace.territories)
      setSavedTerritories(workspace.territories)
      setTrades(workspace.trades)
      setSavedTrades(workspace.trades)
      setRadius(workspace.radius)
      setSavedRadius(workspace.radius)
      setAlerts(workspace.signalAlerts)
      setSavedAlerts(workspace.signalAlerts)
      setSettingsStatus('ready')
    }).catch(() => setSettingsStatus('error'))
  }, [])

  const [territoryPicker, setTerritoryPicker] = useState(false)
  const [upgradeSuccess, setUpgradeSuccess] = useState(false)
  const territoryOptions = ['Surrey', 'Berkshire', 'Greater London', 'Kent', 'Essex', 'Hampshire', 'Sussex', 'Buckinghamshire', 'Hertfordshire', 'Oxfordshire']
  const additionalCount = Math.max(0, territories.length - 3)
  const territoryRate = additionalCount >= 5 ? 119 : additionalCount >= 3 ? 149 : additionalCount === 2 ? 179 : additionalCount === 1 ? 199 : 0
  const monthlyTerritoryCost = additionalCount * territoryRate

  const toggleTerritory = (territory: string) =>
    setTerritories((items) => items.includes(territory) ? items.filter((item) => item !== territory) : [...items, territory])

  useEffect(() => {
    if (!upgradeSuccess) return
    const timer = window.setTimeout(() => setUpgradeSuccess(false), 4500)
    return () => window.clearTimeout(timer)
  }, [upgradeSuccess])

  // Dirty state checks
  const isTerritoryDirty = !arraysEqual(territories, savedTerritories) || radius !== savedRadius
  const isTradesDirty = !arraysEqual(trades, savedTrades)
  const isAlertsDirty = alerts !== savedAlerts
  const isAnyDirty = isTerritoryDirty || isTradesDirty || isAlertsDirty

  // Section Save Handlers
  const handleSaveTerritories = async () => {
    if (!canWrite) return
    setIsSavingTerritories(true)
    try {
      await api.saveWorkspace({ territories, radius })
      setSavedTerritories([...territories])
      setSavedRadius(radius)
      notify('Target territories and operating radius saved')
    } catch {
      notify('Could not save territories')
    } finally {
      setIsSavingTerritories(false)
    }
  }

  const handleSaveTrades = async () => {
    if (!canWrite) return
    setIsSavingTrades(true)
    try {
      await api.saveWorkspace({ trades })
      setSavedTrades([...trades])
      notify('Trade specialisms saved')
    } catch {
      notify('Could not save trade specialisms')
    } finally {
      setIsSavingTrades(false)
    }
  }

  const handleToggleAlerts = async () => {
    if (!canWrite) return
    const nextAlerts = !alerts
    setAlerts(nextAlerts)
    setIsSavingAlerts(true)
    try {
      await api.saveWorkspace({ signalAlerts: nextAlerts })
      setSavedAlerts(nextAlerts)
      notify(`Signal alerts ${nextAlerts ? 'enabled' : 'disabled'}`)
    } catch {
      setAlerts(savedAlerts)
      notify('Could not save alert settings')
    } finally {
      setIsSavingAlerts(false)
    }
  }

  const handleSaveAll = async () => {
    if (!canWrite) return
    setIsSavingAll(true)
    try {
      await api.saveWorkspace({ territories, trades, radius, signalAlerts: alerts })
      setSavedTerritories([...territories])
      setSavedRadius(radius)
      setSavedTrades([...trades])
      setSavedAlerts(alerts)
      notify('All workspace settings saved')
    } catch {
      notify('Could not save workspace settings')
    } finally {
      setIsSavingAll(false)
    }
  }

  return (
    <>
      {upgradeSuccess && (
        <div className="fixed right-5 top-24 z-[70] w-[320px] max-w-[calc(100vw-40px)] rounded-xl border border-[#BBF7D0] bg-white p-4 shadow-2xl animate-slide-in">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#16A34A] text-[14px] font-bold text-white">✓</div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold text-[#166534]">Territory upgrade confirmed</div>
              <div className="mt-1 text-[9px] leading-relaxed text-[#64748B]">{additionalCount} {additionalCount === 1 ? 'territory' : 'territories'} added · +£{monthlyTerritoryCost}/mo</div>
              <div className="mt-1 text-[8px] text-[#94A3B8]">Next invoice: £{(2950 + monthlyTerritoryCost).toLocaleString()} on 01 July 2025</div>
            </div>
            <button onClick={() => setUpgradeSuccess(false)} className="text-[#94A3B8]" aria-label="Dismiss success message"><Icon name="close" size={13} /></button>
          </div>
        </div>
      )}

      <PageIntro
        eyebrow="Workspace configuration"
        title="Workspace settings"
        description="Manage your territory coverage, trade specialisms and intent alerts."
        action={
          <button
            disabled={!canWrite || !isAnyDirty || isSavingAll}
            onClick={handleSaveAll}
            className={`rounded-lg px-4 py-2.5 text-[9px] font-semibold transition ${
              isAnyDirty
                ? 'bg-[#172554] text-white hover:bg-[#1E3A8A] shadow-sm'
                : 'bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0] cursor-default'
            }`}
          >
            {isSavingAll ? 'Saving all...' : isAnyDirty ? 'Save all changes' : 'All changes saved ✓'}
          </button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          {/* TARGET TERRITORIES CARD */}
          <section className="rounded-xl border border-[#DCE4F0] bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-[14px] font-semibold">Target territories</h3>
                <p className="mt-1 text-[9px] text-[#94A3B8]">Team Plan includes three active territories.</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[8px] font-bold ${territories.length <= 3 ? 'bg-[#ECFDF5] text-[#15803D]' : 'bg-[#EFF6FF] text-[#1D4ED8]'}`}>
                {territories.length} selected
              </span>
            </div>

            {settingsStatus === 'error' && (
              <div className="mt-4"><EmptyState kind="error" title="Workspace settings could not be loaded." action={{ label: 'Try again', onClick: () => window.location.reload() }} /></div>
            )}
            {settingsStatus === 'ready' && territories.length === 0 && (
              <div className="mt-4"><EmptyState icon="map" title="No target regions are selected yet." action={{ label: 'Set up your ICP', onClick: () => setTerritoryPicker(true) }} /></div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {territories.map((territory, index) => (
                <button
                  key={territory}
                  onClick={() => toggleTerritory(territory)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-[9px] font-semibold ${index < 3 ? 'bg-[#EFF6FF] text-[#1D4ED8]' : 'bg-[#EDE9FE] text-[#6D28D9]'}`}
                >
                  {territory}<span className="text-current/50">×</span>
                </button>
              ))}
              <button
                onClick={() => setTerritoryPicker((open) => !open)}
                className="rounded-full border border-dashed border-[#93C5FD] px-3 py-2 text-[9px] font-semibold text-[#2563EB]"
              >
                + Add territory
              </button>
            </div>

            {territoryPicker && (
              <div className="mt-4 rounded-xl border border-[#DCE4F0] bg-[#F8FAFD] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">Choose territories</div>
                  <button onClick={() => setTerritoryPicker(false)} className="text-[#94A3B8]"><Icon name="close" size={13} /></button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {territoryOptions.map((territory) => (
                    <label
                      key={territory}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-[9px] font-medium ${
                        territories.includes(territory) ? 'border-[#93C5FD] bg-[#EFF6FF] text-[#1D4ED8]' : 'border-[#E2E8F0] bg-white text-[#52627A]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={territories.includes(territory)}
                        onChange={() => toggleTerritory(territory)}
                        className="accent-[#2563EB]"
                      />
                      {territory}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 border-t border-[#EEF2F7] pt-4">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-semibold text-[#52627A]">Operating radius from Guildford</label>
                <span className="text-[9px] font-bold text-[#2563EB]">{radius} miles</span>
              </div>
              <input
                type="range"
                value={radius}
                onChange={(event) => setRadius(Number(event.target.value))}
                min="5"
                max="100"
                step="5"
                className="mt-3 w-full accent-[#2563EB]"
              />
            </div>

            {/* SEPARATE SAVE FOR TERRITORIES & RADIUS */}
            <div className="mt-5 flex items-center justify-between border-t border-[#EEF2F7] pt-4">
              <div className="text-[10px]">
                {isTerritoryDirty ? (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[#D97706]">
                    <span className="h-2 w-2 rounded-full bg-[#F59E0B] animate-pulse" />
                    Unsaved territory or radius changes
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-medium text-[#16A34A]">
                    ✓ Territories & radius saved
                  </span>
                )}
              </div>
              <button
                type="button"
                disabled={!canWrite || !isTerritoryDirty || isSavingTerritories}
                onClick={handleSaveTerritories}
                className={`rounded-lg px-4 py-2 text-[10px] font-semibold transition ${
                  isTerritoryDirty
                    ? 'bg-[#172554] text-white hover:bg-[#1E3A8A] shadow-sm'
                    : 'bg-[#F1F5F9] text-[#94A3B8] cursor-default'
                }`}
              >
                {isSavingTerritories ? 'Saving...' : isTerritoryDirty ? 'Save territories & radius' : 'Saved ✓'}
              </button>
            </div>
          </section>

          {/* TRADE SPECIALISMS CARD */}
          <section className="rounded-xl border border-[#DCE4F0] bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-[14px] font-semibold">Trade specialisms</h3>
                <p className="mt-1 text-[9px] text-[#94A3B8]">Select the trades your firm covers to filter matched planning schemes.</p>
              </div>
              <span className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-[8px] font-bold text-[#52627A]">
                {trades.length} active
              </span>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {['Groundworks', 'RC Frame', 'Civil Engineering', 'Drainage', 'Structural Steel', 'MEP'].map((trade) => (
                <label key={trade} className="flex items-center gap-3 rounded-lg bg-[#F8FAFD] p-3 text-[9px] text-[#52627A] cursor-pointer hover:bg-[#F1F5F9]">
                  <input
                    type="checkbox"
                    checked={trades.includes(trade)}
                    onChange={() => setTrades((items) => items.includes(trade) ? items.filter((item) => item !== trade) : [...items, trade])}
                    className="accent-[#2563EB]"
                  />
                  {trade}
                </label>
              ))}
            </div>

            {/* SEPARATE SAVE FOR TRADE SPECIALISMS */}
            <div className="mt-5 flex items-center justify-between border-t border-[#EEF2F7] pt-4">
              <div className="text-[10px]">
                {isTradesDirty ? (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[#D97706]">
                    <span className="h-2 w-2 rounded-full bg-[#F59E0B] animate-pulse" />
                    Unsaved trade changes
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-medium text-[#16A34A]">
                    ✓ Trade specialisms saved
                  </span>
                )}
              </div>
              <button
                type="button"
                disabled={!canWrite || !isTradesDirty || isSavingTrades}
                onClick={handleSaveTrades}
                className={`rounded-lg px-4 py-2 text-[10px] font-semibold transition ${
                  isTradesDirty
                    ? 'bg-[#172554] text-white hover:bg-[#1E3A8A] shadow-sm'
                    : 'bg-[#F1F5F9] text-[#94A3B8] cursor-default'
                }`}
              >
                {isSavingTrades ? 'Saving...' : isTradesDirty ? 'Save trade specialisms' : 'Saved ✓'}
              </button>
            </div>
          </section>
        </div>

        {/* SIDEBAR CARDS */}
        <div className="space-y-5 lg:sticky lg:top-[96px] lg:self-start">
          <section className={`overflow-hidden rounded-xl border bg-white ${additionalCount > 0 ? 'border-[#93C5FD]' : 'border-[#DCE4F0]'}`}>
            <div className={additionalCount > 0 ? 'bg-[#EFF6FF] p-4' : 'bg-[#F8FAFD] p-4'}>
              <div className="flex items-center justify-between">
                <div className={`text-[8px] font-bold uppercase tracking-wider ${additionalCount > 0 ? 'text-[#2563EB]' : 'text-[#64748B]'}`}>Next invoice adjustment</div>
                <span className={`rounded-full px-2.5 py-1 text-[7px] font-bold ${additionalCount > 0 ? 'bg-white text-[#1D4ED8]' : 'bg-[#E2E8F0] text-[#64748B]'}`}>
                  {additionalCount > 0 ? 'PENDING CONFIRMATION' : 'NO CHANGES'}
                </span>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <div className="font-display text-[23px] font-semibold text-[#172033]">{additionalCount > 0 ? `+£${monthlyTerritoryCost}` : '£0'}</div>
                  <div className="mt-1 text-[8px] text-[#64748B]">monthly adjustment · VAT excluded</div>
                </div>
                <span className="text-[9px] font-semibold text-[#52627A]">{additionalCount} paid {additionalCount === 1 ? 'territory' : 'territories'}</span>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-2 border-b border-[#EEF2F7] pb-3">
                <div className="flex justify-between text-[9px]"><span className="text-[#64748B]">Team Plan</span><span className="font-semibold">£2,950/mo</span></div>
                <div className="flex justify-between text-[9px]"><span className="text-[#64748B]">3 included territories</span><span className="font-semibold text-[#15803D]">Included</span></div>
                {territories.slice(3).map((territory) => (
                  <div key={territory} className="flex justify-between text-[9px]">
                    <span className="truncate pr-3 text-[#64748B]">+ {territory}</span>
                    <span className="font-semibold">£{territoryRate}/mo</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <div className="text-[8px] uppercase tracking-wider text-[#94A3B8]">Projected next invoice</div>
                  <div className="mt-1 text-[8px] text-[#94A3B8]">Due 01 July 2025</div>
                </div>
                <div className="font-display text-[18px] font-semibold">£{(2950 + monthlyTerritoryCost).toLocaleString()}</div>
              </div>
              <div className={`mt-3 rounded-lg p-3 text-[8px] leading-relaxed ${additionalCount > 0 ? 'bg-[#FFF7ED] text-[#9A3412]' : 'bg-[#F8FAFD] text-[#64748B]'}`}>
                {additionalCount > 0 ? `Your ${additionalCount} additional ${additionalCount === 1 ? 'territory is' : 'territories are'} charged at £${territoryRate} each per month. Nothing is billed until you confirm.` : 'Your Team Plan includes three territories. Add more to preview the recurring charge here before confirming.'}
              </div>
              <button
                disabled={additionalCount === 0}
                onClick={() => setUpgradeSuccess(true)}
                className="mt-3 w-full rounded-lg bg-[#172554] py-3 text-[9px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#E2E8F0] disabled:text-[#94A3B8]"
              >
                {additionalCount > 0 ? 'Confirm & add to next invoice' : 'No billing changes'}
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-[#DCE4F0] bg-white p-5">
            <h3 className="font-display text-[14px] font-semibold">Additional territory pricing</h3>
            <p className="mt-1 text-[8px] text-[#94A3B8]">Volume pricing applies to all paid territories. The best eligible tier is used.</p>
            <div className="mt-4 space-y-2">
              {[['1 territory', '£199'], ['2 territories', '£179 each'], ['3–5 territories', '£149 each'], ['5+ territories', '£119 each']].map(([quantity, price]) => (
                <div key={quantity} className="flex justify-between rounded-lg bg-[#F8FAFD] px-3 py-2.5 text-[9px]">
                  <span className="text-[#64748B]">{quantity}</span>
                  <span className="font-semibold text-[#334155]">{price}/mo</span>
                </div>
              ))}
            </div>
          </section>

          {/* SIGNAL ALERTS CARD WITH DIRECT SAVE */}
          <section className="rounded-xl border border-[#DCE4F0] bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[14px] font-semibold">Signal alerts</h3>
              <span className={`text-[9px] font-semibold ${isAlertsDirty ? 'text-[#D97706]' : 'text-[#16A34A]'}`}>
                {isSavingAlerts ? 'Saving...' : isAlertsDirty ? '● Unsaved' : 'Saved ✓'}
              </span>
            </div>
            <p className="mt-2 text-[9px] leading-relaxed text-[#94A3B8]">Notify the team when a prospect opens 3+ times or clicks a capability deck.</p>
            <button
              disabled={isSavingAlerts}
              onClick={handleToggleAlerts}
              className={`mt-4 flex w-full items-center justify-between rounded-lg p-3 text-[9px] font-semibold transition ${
                alerts ? 'bg-[#ECFDF5] text-[#047857]' : 'bg-[#F1F5F9] text-[#64748B]'
              }`}
            >
              <span>Real-time push alerts</span>
              <span>{isSavingAlerts ? 'Saving...' : alerts ? 'On (Click to Turn Off)' : 'Off (Click to Turn On)'}</span>
            </button>
          </section>
        </div>
      </div>
    </>
  )
}

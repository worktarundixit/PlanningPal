import { useEffect, useState, type FormEvent } from 'react'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { PageIntro } from '../components/PageIntro'
import { api } from '../lib/api'
import { notify } from '../lib/notify'
import type { UserProfile } from '@planningpal/shared'

export function ProfilePage({ profile, onSave }: { profile: UserProfile; onSave: (profile: UserProfile) => void }) {
  const [draft, setDraft] = useState(profile)
  const [twoFactorModal, setTwoFactorModal] = useState(false)
  const [setupData, setSetupData] = useState<{ secret: string; otpauthUrl: string; currentCodeHint?: string } | null>(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [busy2fa, setBusy2fa] = useState(false)

  useEffect(() => {
    setDraft(profile)
  }, [profile])

  const save = (event: FormEvent) => {
    event.preventDefault()
    onSave(draft)
    notify('Profile updated')
  }

  const handleStart2fa = async () => {
    setBusy2fa(true)
    try {
      const res = await api.setupTwoFactor()
      setSetupData(res)
      setTwoFactorModal(true)
    } catch {
      notify('Could not initiate 2FA setup')
    } finally {
      setBusy2fa(false)
    }
  }

  const handleConfirm2fa = async (e: FormEvent) => {
    e.preventDefault()
    setBusy2fa(true)
    try {
      const res = await api.verifyTwoFactor(verifyCode)
      setBackupCodes(res.backupCodes)
      setDraft((prev) => ({ ...prev, twoFactorEnabled: true }))
      notify('Two-factor authentication enabled!')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Invalid 6-digit verification code')
    } finally {
      setBusy2fa(false)
    }
  }

  const handleDisable2fa = async () => {
    setBusy2fa(true)
    try {
      await api.disableTwoFactor()
      setDraft((prev) => ({ ...prev, twoFactorEnabled: false }))
      setSetupData(null)
      setBackupCodes([])
      setTwoFactorModal(false)
      notify('Two-factor authentication disabled')
    } catch {
      notify('Could not disable 2FA')
    } finally {
      setBusy2fa(false)
    }
  }

  return (
    <>
      <PageIntro eyebrow="PlanningPal account" title="My profile" description="Manage your personal details, contact numbers, notification preferences, and account security." />
      {!draft.name && <div className="mb-5"><EmptyState icon="users" title="Add your name and job role to finish your profile." /></div>}
      <form onSubmit={save} className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="rounded-xl border border-[#DCE4F0] bg-white p-6">
            <div className="flex items-center gap-4 border-b border-[#EEF2F7] pb-5">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-[#DBEAFE] font-display text-[17px] font-semibold text-[#1D4ED8]">
                {draft.name ? draft.name.split(' ').map((name) => name[0]).join('').slice(0, 2) : 'ME'}
              </div>
              <div>
                <h3 className="font-display text-[16px] font-semibold">{draft.name || 'Your Profile'}</h3>
                <p className="mt-1 text-[9px] text-[#94A3B8]">{draft.email}</p>
                <button type="button" onClick={() => notify('Profile image selector opened')} className="mt-2 text-[8px] font-semibold text-[#2563EB]">Change profile image</button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">
                First name
                <input
                  value={draft.firstName || ''}
                  onChange={(event) => setDraft((item) => ({ ...item, firstName: event.target.value }))}
                  placeholder="First name"
                  className="mt-2 w-full rounded-lg border border-[#DCE4F0] px-3 py-3 text-[10px] font-normal normal-case tracking-normal outline-none focus:border-[#2563EB]"
                />
              </label>
              <label className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">
                Last name
                <input
                  value={draft.lastName || ''}
                  onChange={(event) => setDraft((item) => ({ ...item, lastName: event.target.value }))}
                  placeholder="Last name"
                  className="mt-2 w-full rounded-lg border border-[#DCE4F0] px-3 py-3 text-[10px] font-normal normal-case tracking-normal outline-none focus:border-[#2563EB]"
                />
              </label>
              <label className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">
                Primary email address
                <input
                  required
                  type="email"
                  value={draft.email}
                  readOnly
                  className="mt-2 w-full rounded-lg border border-[#DCE4F0] bg-[#F8FAFC] px-3 py-3 text-[10px] text-[#64748B] outline-none"
                />
              </label>
              <label className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">
                Secondary email (optional)
                <input
                  type="email"
                  value={draft.secondaryEmail || ''}
                  onChange={(event) => setDraft((item) => ({ ...item, secondaryEmail: event.target.value }))}
                  placeholder="backup@company.co.uk"
                  className="mt-2 w-full rounded-lg border border-[#DCE4F0] px-3 py-3 text-[10px] font-normal normal-case tracking-normal outline-none focus:border-[#2563EB]"
                />
              </label>
              <label className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">
                Contact number
                <input
                  value={draft.phone || ''}
                  onChange={(event) => setDraft((item) => ({ ...item, phone: event.target.value }))}
                  placeholder="07700 900123"
                  className="mt-2 w-full rounded-lg border border-[#DCE4F0] px-3 py-3 text-[10px] font-normal normal-case tracking-normal outline-none focus:border-[#2563EB]"
                />
              </label>
              <label className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">
                Job role
                <input
                  required
                  value={draft.role}
                  onChange={(event) => setDraft((item) => ({ ...item, role: event.target.value }))}
                  placeholder="Estimator, director"
                  className="mt-2 w-full rounded-lg border border-[#DCE4F0] px-3 py-3 text-[10px] font-normal normal-case tracking-normal outline-none focus:border-[#2563EB]"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-[#EEF2F7] pt-5">
              <button type="button" onClick={() => setDraft(profile)} className="rounded-lg border border-[#DCE4F0] px-4 py-2.5 text-[9px] font-semibold text-[#64748B]">Discard changes</button>
              <button type="submit" className="rounded-lg bg-[#172554] px-5 py-2.5 text-[9px] font-semibold text-white hover:bg-[#1E3A8A]">Save profile</button>
            </div>
          </section>

          <section className="rounded-xl border border-[#DCE4F0] bg-white p-6">
            <h3 className="font-display text-[14px] font-semibold">Email & Notification preferences</h3>
            <p className="mt-1 text-[9px] text-[#94A3B8]">Choose which PlanningPal alerts reach your inbox.</p>
            <div className="mt-4 space-y-1">
              <label className="flex items-center justify-between rounded-lg p-3 hover:bg-[#F8FAFD]">
                <div>
                  <div className="text-[10px] font-semibold text-[#334155]">High-intent alerts</div>
                  <div className="mt-1 text-[8px] text-[#94A3B8]">Real-time alert when a planning lead opens 3+ times or clicks your outreach</div>
                </div>
                <input
                  type="checkbox"
                  checked={draft.emailPreferences?.highIntent ?? true}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    emailPreferences: { ...(prev.emailPreferences ?? { taskReminders: true, weeklyDigest: false }), highIntent: e.target.checked },
                  }))}
                  className="h-4 w-4 accent-[#2563EB]"
                />
              </label>

              <label className="flex items-center justify-between rounded-lg p-3 hover:bg-[#F8FAFD]">
                <div>
                  <div className="text-[10px] font-semibold text-[#334155]">Task & follow-up reminders</div>
                  <div className="mt-1 text-[8px] text-[#94A3B8]">Daily summary of scheduled calls, bid deadlines, and overdue items</div>
                </div>
                <input
                  type="checkbox"
                  checked={draft.emailPreferences?.taskReminders ?? true}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    emailPreferences: { ...(prev.emailPreferences ?? { highIntent: true, weeklyDigest: false }), taskReminders: e.target.checked },
                  }))}
                  className="h-4 w-4 accent-[#2563EB]"
                />
              </label>

              <label className="flex items-center justify-between rounded-lg p-3 hover:bg-[#F8FAFD]">
                <div>
                  <div className="text-[10px] font-semibold text-[#334155]">Weekly planning digest</div>
                  <div className="mt-1 text-[8px] text-[#94A3B8]">Weekly digest of new approved schemes matching your territory ICP</div>
                </div>
                <input
                  type="checkbox"
                  checked={draft.emailPreferences?.weeklyDigest ?? false}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    emailPreferences: { ...(prev.emailPreferences ?? { highIntent: true, taskReminders: true }), weeklyDigest: e.target.checked },
                  }))}
                  className="h-4 w-4 accent-[#2563EB]"
                />
              </label>
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-xl border border-[#DCE4F0] bg-white p-5">
            <div className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">Workspace</div>
            <div className="mt-4 rounded-lg bg-[#F8FAFD] p-4">
              <div className="font-display text-[14px] font-semibold">{draft.company}</div>
              <div className="mt-1 text-[8px] text-[#94A3B8]">PlanningPal Workspace</div>
            </div>
          </section>

          <section className="rounded-xl border border-[#DCE4F0] bg-white p-5">
            <h3 className="font-display text-[14px] font-semibold">Security & 2FA</h3>
            <div className="mt-4 space-y-3">
              <button type="button" onClick={() => notify('Password reset email sent')} className="flex w-full items-center justify-between rounded-lg border border-[#E2E8F0] p-3 text-left">
                <div>
                  <div className="text-[9px] font-semibold text-[#334155]">Password</div>
                  <div className="mt-1 text-[8px] text-[#94A3B8]">Protected via Supabase Auth</div>
                </div>
                <span className="text-[8px] font-semibold text-[#2563EB]">Reset</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (draft.twoFactorEnabled) {
                    if (confirm('Disable Two-Factor Authentication for your account?')) {
                      void handleDisable2fa()
                    }
                  } else {
                    void handleStart2fa()
                  }
                }}
                className="flex w-full items-center justify-between rounded-lg border border-[#E2E8F0] p-3 text-left"
              >
                <div>
                  <div className="text-[9px] font-semibold text-[#334155]">Two-factor authentication (TOTP)</div>
                  <div className="mt-1 text-[8px] text-[#94A3B8]">{draft.twoFactorEnabled ? 'Enabled for your account' : 'Add Google/Apple Authenticator protection'}</div>
                </div>
                <span className={`rounded-full px-2 py-1 text-[7px] font-bold ${draft.twoFactorEnabled ? 'bg-[#ECFDF5] text-[#15803D]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                  {draft.twoFactorEnabled ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-[#DCE4F0] bg-white p-5">
            <h3 className="font-display text-[14px] font-semibold">Active session</h3>
            <div className="mt-4 flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#EFF6FF] text-[#2563EB]"><Icon name="grid" size={14} /></div>
              <div className="flex-1">
                <div className="text-[9px] font-semibold text-[#334155]">Current browser session</div>
                <div className="mt-1 text-[8px] text-[#94A3B8]">United Kingdom · Active now</div>
              </div>
              <span className="h-2 w-2 rounded-full bg-[#4ADE80]" />
            </div>
          </section>
        </div>
      </form>

      {/* 2FA Setup Modal */}
      {twoFactorModal && setupData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={() => setTwoFactorModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#EEF2F7] pb-3">
              <h3 className="text-sm font-bold text-[#172554]">Enable Two-Factor Authentication</h3>
              <button onClick={() => setTwoFactorModal(false)} className="text-[#94A3B8]"><Icon name="close" size={14} /></button>
            </div>

            {backupCodes.length === 0 ? (
              <form onSubmit={handleConfirm2fa} className="mt-4 space-y-4">
                <p className="text-xs text-[#52627A] leading-relaxed">
                  Scan this QR key in your authenticator app (Google Authenticator, 1Password, etc.) or paste the key below:
                </p>

                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-center">
                  <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Secret Key</div>
                  <div className="mt-1 font-mono text-sm font-bold tracking-widest text-[#1E293B] select-all">
                    {setupData.secret}
                  </div>
                  {setupData.currentCodeHint && (
                    <div className="mt-2 text-[10px] text-[#94A3B8]">
                      (Development hint: valid code is <span className="font-mono font-bold text-[#2563EB]">{setupData.currentCodeHint}</span> or 123456)
                    </div>
                  )}
                </div>

                <label className="block text-xs font-semibold text-[#334155]">
                  Enter 6-digit Code to Confirm
                  <input
                    required
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="123456"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#DCE4F0] px-3 py-2 text-center font-mono text-base tracking-widest outline-none focus:border-[#2563EB]"
                  />
                </label>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#EEF2F7]">
                  <button type="button" onClick={() => setTwoFactorModal(false)} className="rounded-lg border border-[#DCE4F0] px-4 py-2 text-xs font-semibold text-[#64748B]">Cancel</button>
                  <button type="submit" disabled={busy2fa || verifyCode.length < 6} className="rounded-lg bg-[#2563EB] px-5 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8] disabled:opacity-50">
                    {busy2fa ? 'Verifying…' : 'Verify & Enable'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-xs text-[#166534]">
                  <span className="font-bold">2FA is now active!</span> Save these single-use backup codes in a safe place:
                </div>
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-[#F8FAFC] p-3 font-mono text-xs text-[#334155]">
                  {backupCodes.map((code, idx) => (
                    <div key={idx} className="rounded bg-white p-1.5 text-center border border-[#E2E8F0]">{code}</div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setTwoFactorModal(false)}
                  className="w-full rounded-lg bg-[#172554] py-2 text-xs font-semibold text-white"
                >
                  I have saved my backup codes
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}


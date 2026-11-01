import { useState, type FormEvent } from 'react'
import { Icon } from '../components/Icon'
import { PageIntro } from '../components/PageIntro'
import { notify } from '../lib/notify'
import type { UserProfile } from '@planningpal/shared'

export function ProfilePage({ profile, onSave }: { profile: UserProfile; onSave: (profile: UserProfile) => void }) {
  const [draft, setDraft] = useState(profile)
  const [twoFactor, setTwoFactor] = useState(false)
  const save = (event: FormEvent) => {
    event.preventDefault()
    onSave(draft)
    notify('Profile updated')
  }
  return (
    <>
      <PageIntro eyebrow="PlanningPal account" title="My profile" description="Manage your personal details, workspace identity and account security." />
      <form onSubmit={save} className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="rounded-xl border border-[#DCE4F0] bg-white p-6">
            <div className="flex items-center gap-4 border-b border-[#EEF2F7] pb-5">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-[#DBEAFE] font-display text-[17px] font-semibold text-[#1D4ED8]">{draft.name.split(' ').map((name) => name[0]).join('').slice(0, 2)}</div>
              <div><h3 className="font-display text-[16px] font-semibold">{draft.name}</h3><p className="mt-1 text-[9px] text-[#94A3B8]">{draft.email}</p><button type="button" onClick={() => notify('Profile image selector opened')} className="mt-2 text-[8px] font-semibold text-[#2563EB]">Change profile image</button></div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">Full name<input required value={draft.name} onChange={(event) => setDraft((item) => ({ ...item, name: event.target.value }))} className="mt-2 w-full rounded-lg border border-[#DCE4F0] px-3 py-3 text-[10px] font-normal normal-case tracking-normal outline-none focus:border-[#2563EB]" /></label>
              <label className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">Email address<input required type="email" value={draft.email} onChange={(event) => setDraft((item) => ({ ...item, email: event.target.value }))} className="mt-2 w-full rounded-lg border border-[#DCE4F0] px-3 py-3 text-[10px] font-normal normal-case tracking-normal outline-none focus:border-[#2563EB]" /></label>
              <label className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">Role<input required value={draft.role} onChange={(event) => setDraft((item) => ({ ...item, role: event.target.value }))} className="mt-2 w-full rounded-lg border border-[#DCE4F0] px-3 py-3 text-[10px] font-normal normal-case tracking-normal outline-none focus:border-[#2563EB]" /></label>
              <label className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">Company<input required value={draft.company} onChange={(event) => setDraft((item) => ({ ...item, company: event.target.value }))} className="mt-2 w-full rounded-lg border border-[#DCE4F0] px-3 py-3 text-[10px] font-normal normal-case tracking-normal outline-none focus:border-[#2563EB]" /></label>
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t border-[#EEF2F7] pt-5"><button type="button" onClick={() => setDraft(profile)} className="rounded-lg border border-[#DCE4F0] px-4 py-2.5 text-[9px] font-semibold text-[#64748B]">Discard changes</button><button type="submit" className="rounded-lg bg-[#172554] px-5 py-2.5 text-[9px] font-semibold text-white">Save profile</button></div>
          </section>
          <section className="rounded-xl border border-[#DCE4F0] bg-white p-6"><h3 className="font-display text-[14px] font-semibold">Email preferences</h3><p className="mt-1 text-[9px] text-[#94A3B8]">Choose which PlanningPal updates reach your inbox.</p><div className="mt-4 space-y-1">{[['High-intent alerts', 'When a contact opens 3+ times or clicks a deck'], ['Task reminders', 'Daily summary of calls and follow-ups due'], ['Weekly planning digest', 'New approved schemes in selected regions']].map(([label, description]) => <label key={label} className="flex items-center justify-between rounded-lg p-3 hover:bg-[#F8FAFD]"><div><div className="text-[10px] font-semibold text-[#334155]">{label}</div><div className="mt-1 text-[8px] text-[#94A3B8]">{description}</div></div><input type="checkbox" defaultChecked className="h-4 w-4 accent-[#2563EB]" /></label>)}</div></section>
        </div>
        <div className="space-y-5">
          <section className="rounded-xl border border-[#DCE4F0] bg-white p-5"><div className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">Workspace</div><div className="mt-4 rounded-lg bg-[#F8FAFD] p-4"><div className="font-display text-[14px] font-semibold">{draft.company}</div><div className="mt-1 text-[8px] text-[#94A3B8]">Team Plan · Account owner</div></div></section>
          <section className="rounded-xl border border-[#DCE4F0] bg-white p-5"><h3 className="font-display text-[14px] font-semibold">Security</h3><div className="mt-4 space-y-3"><button type="button" onClick={() => notify('Password reset email sent')} className="flex w-full items-center justify-between rounded-lg border border-[#E2E8F0] p-3 text-left"><div><div className="text-[9px] font-semibold text-[#334155]">Password</div><div className="mt-1 text-[8px] text-[#94A3B8]">Last changed 42 days ago</div></div><span className="text-[8px] font-semibold text-[#2563EB]">Change</span></button><button type="button" onClick={() => setTwoFactor((enabled) => !enabled)} className="flex w-full items-center justify-between rounded-lg border border-[#E2E8F0] p-3 text-left"><div><div className="text-[9px] font-semibold text-[#334155]">Two-factor authentication</div><div className="mt-1 text-[8px] text-[#94A3B8]">{twoFactor ? 'Enabled for your account' : 'Add an extra layer of security'}</div></div><span className={`rounded-full px-2 py-1 text-[7px] font-bold ${twoFactor ? 'bg-[#ECFDF5] text-[#15803D]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>{twoFactor ? 'ON' : 'OFF'}</span></button></div></section>
          <section className="rounded-xl border border-[#DCE4F0] bg-white p-5"><h3 className="font-display text-[14px] font-semibold">Active session</h3><div className="mt-4 flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-[#EFF6FF] text-[#2563EB]"><Icon name="grid" size={14} /></div><div className="flex-1"><div className="text-[9px] font-semibold text-[#334155]">Current browser</div><div className="mt-1 text-[8px] text-[#94A3B8]">United Kingdom · Active now</div></div><span className="h-2 w-2 rounded-full bg-[#4ADE80]" /></div></section>
        </div>
      </form>
    </>
  )
}

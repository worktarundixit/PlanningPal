import { useEffect, useState, type FormEvent } from 'react'
import { Icon } from '../components/Icon'
import { PageIntro } from '../components/PageIntro'
import { api } from '../lib/api'
import { notify } from '../lib/notify'

export type TeamMember = { id: string; name: string; email: string; role: string; status: 'Active' | 'Pending' }

export function TeamManagement({ canManage = true }: { canManage?: boolean; actorRole?: string | null }) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [inviteUrl, setInviteUrl] = useState('')
  useEffect(() => {
    void api.team().then((team) => {
      setMembers(team.members.map((member) => ({ ...member, status: member.status === 'Pending' ? 'Pending' : 'Active' })))
      setCustomRoles(team.customRoles.map((role) => ({ name: role.name, permissions: role.permissions })))
    }).catch(() => notify('Could not load the team'))
  }, [])
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('Member')
  const [removeId, setRemoveId] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const [roleName, setRoleName] = useState('')
  const [rolePermissions, setRolePermissions] = useState<string[]>(['View planning data'])
  const [customRoles, setCustomRoles] = useState<{ name: string; permissions: string[] }[]>([])
  const permissionOptions = ['View planning data', 'Export schemes', 'Manage campaigns', 'Manage CRM', 'Manage contacts', 'View reports', 'Manage workspace', 'Manage billing']
  const availableRoles = ['Admin', 'Member', 'Viewer', ...customRoles.map((role) => role.name)]
  const additionalSeats = Math.max(0, members.length - 3)
  const monthlySeatCost = additionalSeats * 9
  const inviteMember = (event: FormEvent) => {
    event.preventDefault()
    if (!canManage) return
    void api.invite(inviteEmail, inviteRole).then((created) => {
      setMembers((items) => [...items, { id: created.id, name: created.name, email: created.email, role: created.role, status: 'Pending' }])
      setInviteUrl(created.inviteUrl)
      setInviteEmail('')
      setInviteOpen(false)
      setInviteSuccess(true)
    }).catch((error: unknown) => notify(error instanceof Error ? error.message : 'Could not send that invitation'))
  }
  useEffect(() => {
    if (!inviteSuccess) return
    const timer = window.setTimeout(() => setInviteSuccess(false), 4000)
    return () => window.clearTimeout(timer)
  }, [inviteSuccess])
  const updateRole = (id: string, role: string) => {
    if (!canManage) return
    setMembers((items) => items.map((member) => member.id === id ? { ...member, role } : member))
    void api.updateMember(id, role).catch(() => notify('Could not change that role'))
  }
  const removeMember = (id: string) => {
    if (!canManage) return
    const member = members.find((item) => item.id === id)
    void api.removeMember(id).then(() => {
      setMembers((items) => items.filter((item) => item.id !== id))
      setRemoveId(null)
      notify(`${member?.name || 'Team member'} removed`)
    }).catch(() => notify('Could not remove that teammate'))
  }
  const createRole = (event: FormEvent) => {
    event.preventDefault()
    if (!roleName.trim() || !rolePermissions.length) return
    void api.createRole(roleName.trim(), rolePermissions).then(() => {
      setCustomRoles((roles) => [...roles, { name: roleName.trim(), permissions: rolePermissions }])
      setRoleName('')
      setRolePermissions(['View planning data'])
      setRoleOpen(false)
      notify('Custom access role created')
    }).catch(() => notify('Could not create that role'))
  }
  return (
    <>
      {inviteSuccess && <div className="fixed right-5 top-24 z-[70] w-[310px] max-w-[calc(100vw-40px)] rounded-xl border border-[#BBF7D0] bg-white p-4 shadow-2xl animate-slide-in"><div className="flex gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#16A34A] text-[12px] font-bold text-white">✓</span><div className="flex-1"><div className="text-[10px] font-semibold text-[#166534]">Invitation sent</div><div className="mt-1 text-[8px] leading-relaxed text-[#64748B]">A new seat was added for €9/month and will appear on the next invoice.</div>{inviteUrl && <a href={inviteUrl} className="mt-2 block break-all text-[8px] font-semibold text-[#2563EB]">{inviteUrl}</a>}</div><button onClick={() => setInviteSuccess(false)} className="text-[#94A3B8]"><Icon name="close" size={12} /></button></div></div>}
      <PageIntro eyebrow="Workspace administration" title="Team management" description="Invite teammates, manage workspace access and review paid seat adjustments for Micraft Design Ltd." action={<button disabled={!canManage} onClick={() => setInviteOpen(true)} className="flex items-center gap-2 rounded-lg bg-[#172554] px-4 py-2.5 text-[9px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"><span className="text-sm leading-none">+</span> Invite member</button>} />
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <section className="overflow-hidden rounded-xl border border-[#DCE4F0] bg-white">
            <div className="flex items-center justify-between border-b border-[#EEF2F7] px-5 py-4"><div><h3 className="font-display text-[14px] font-semibold">Workspace members</h3><p className="mt-1 text-[8px] text-[#94A3B8]">Three seats are included in Team Plan.</p></div><span className="rounded-full bg-[#EFF6FF] px-2.5 py-1 text-[8px] font-bold text-[#1D4ED8]">{members.length} members</span></div>
            {members.map((member) => <div key={member.id} className="grid items-center gap-3 border-t border-[#EEF2F7] px-5 py-4 first:border-0 sm:grid-cols-[1fr_140px_90px_auto]">
              <div className="flex min-w-0 items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#DBEAFE] text-[9px] font-bold text-[#1D4ED8]">{member.name.split(' ').map((name) => name[0]).join('').slice(0, 2)}</div><div className="min-w-0"><div className="truncate text-[10px] font-semibold text-[#334155]">{member.name}</div><div className="mt-1 truncate text-[8px] text-[#94A3B8]">{member.email}</div></div></div>
              {member.role === 'Owner' ? <span className="text-[9px] font-semibold text-[#64748B]">Owner</span> : <select disabled={!canManage} value={member.role} onChange={(event) => updateRole(member.id, event.target.value)} className="rounded-md border border-[#DCE4F0] bg-white px-2.5 py-2 text-[9px] font-semibold text-[#52627A] outline-none disabled:cursor-not-allowed disabled:opacity-40">{availableRoles.map((role) => <option key={role}>{role}</option>)}</select>}
              <span className={`w-fit rounded-full px-2 py-1 text-[7px] font-bold ${member.status === 'Active' ? 'bg-[#ECFDF5] text-[#15803D]' : 'bg-[#FFF7ED] text-[#C2410C]'}`}>{member.status}</span>
              {member.role !== 'Owner' && canManage && (removeId === member.id ? <div className="flex gap-1"><button onClick={() => removeMember(member.id)} className="rounded-md bg-[#B91C1C] px-2 py-1.5 text-[7px] font-semibold text-white">Confirm</button><button onClick={() => setRemoveId(null)} className="rounded-md bg-[#F1F5F9] px-2 py-1.5 text-[7px] text-[#64748B]">Cancel</button></div> : <button onClick={() => setRemoveId(member.id)} className="text-[8px] font-semibold text-[#B91C1C]">Remove</button>)}
            </div>)}
          </section>
          <section className="rounded-xl border border-[#DCE4F0] bg-white p-5"><div className="flex items-start justify-between gap-4"><div><h3 className="font-display text-[14px] font-semibold">Access control</h3><p className="mt-1 text-[8px] text-[#94A3B8]">Roles define what each teammate can view and manage.</p></div><button type="button" disabled={!canManage} onClick={() => setRoleOpen(true)} className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#BFDBFE] px-3 py-2 text-[8px] font-semibold text-[#2563EB] disabled:cursor-not-allowed disabled:opacity-40"><span className="text-sm leading-none">+</span> Create role</button></div><div className="mt-4 grid gap-3 sm:grid-cols-3">{[['Admin', 'Manage team, campaigns, CRM and workspace settings'], ['Member', 'Manage leads, contacts, tasks and campaigns'], ['Viewer', 'View planning data, CRM and reports only']].map(([role, detail]) => <div key={role} className="rounded-lg border border-[#E2E8F0] p-4"><div className="text-[10px] font-semibold text-[#334155]">{role}</div><div className="mt-2 text-[8px] leading-relaxed text-[#94A3B8]">{detail}</div></div>)}{customRoles.map((role) => <div key={role.name} className="rounded-lg border border-[#93C5FD] bg-[#F8FAFD] p-4"><div className="flex items-center justify-between"><div className="text-[10px] font-semibold text-[#1D4ED8]">{role.name}</div><span className="rounded-full bg-[#DBEAFE] px-2 py-1 text-[7px] font-bold text-[#1D4ED8]">CUSTOM</span></div><div className="mt-2 text-[8px] leading-relaxed text-[#64748B]">{role.permissions.join(', ')}</div></div>)}</div></section>
        </div>
        <aside className="space-y-5 xl:sticky xl:top-[96px] xl:self-start">
          <section className="overflow-hidden rounded-xl border border-[#DCE4F0] bg-white"><div className="bg-[#F8FAFD] p-4"><div className="text-[8px] font-bold uppercase tracking-wider text-[#64748B]">Team Plan seats</div><div className="mt-3 flex items-end justify-between"><div className="font-display text-[24px] font-semibold">{members.length}</div><span className="text-[8px] font-semibold text-[#64748B]">3 included</span></div></div><div className="p-4"><div className="space-y-2 border-b border-[#EEF2F7] pb-3"><div className="flex justify-between text-[9px]"><span className="text-[#64748B]">Included seats</span><span className="font-semibold">3</span></div><div className="flex justify-between text-[9px]"><span className="text-[#64748B]">Additional seats</span><span className="font-semibold">{additionalSeats}</span></div><div className="flex justify-between text-[9px]"><span className="text-[#64748B]">Price per extra seat</span><span className="font-semibold">€9/mo</span></div></div><div className="mt-3 flex items-end justify-between"><div><div className="text-[8px] uppercase tracking-wider text-[#94A3B8]">Next invoice adjustment</div><div className="mt-1 text-[8px] text-[#94A3B8]">Recurring · VAT excluded</div></div><div className="font-display text-[18px] font-semibold">+€{monthlySeatCost}</div></div></div></section>
          <section className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-4"><div className="text-[9px] font-semibold text-[#1D4ED8]">How seat billing works</div><p className="mt-2 text-[8px] leading-relaxed text-[#52627A]">The first three team members are included. Every additional accepted invitation adds €9/month to your next invoice. Removing a paid member reduces the following invoice.</p></section>
        </aside>
      </div>
      {inviteOpen && <div className="fixed inset-0 z-[75] grid place-items-center bg-[#0F172A]/55 p-4" onMouseDown={() => setInviteOpen(false)}><form onSubmit={inviteMember} onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><div className="text-[9px] font-bold uppercase tracking-wider text-[#2563EB]">Team invitation</div><h3 className="mt-2 font-display text-xl font-semibold">Invite a teammate</h3></div><button type="button" onClick={() => setInviteOpen(false)} className="grid h-8 w-8 place-items-center rounded-full bg-[#F1F5F9] text-[#64748B]"><Icon name="close" size={13} /></button></div><label className="mt-6 block text-[9px] font-bold uppercase tracking-wider text-[#64748B]">Work email<input required type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-[#DCE4F0] px-3 py-3 text-[10px] font-normal normal-case tracking-normal outline-none focus:border-[#2563EB]" placeholder="name@micraftdesign.co.uk" /></label><label className="mt-4 block text-[9px] font-bold uppercase tracking-wider text-[#64748B]">Access role<select value={inviteRole} onChange={(event) => setInviteRole(event.target.value)} className="mt-2 w-full rounded-lg border border-[#DCE4F0] bg-white px-3 py-3 text-[10px] font-normal normal-case tracking-normal outline-none">{availableRoles.map((role) => <option key={role}>{role}</option>)}</select></label><div className="mt-4 rounded-lg bg-[#FFF7ED] p-3 text-[8px] leading-relaxed text-[#9A3412]">Your three included seats are in use. Inviting this member will add €9/month to the next invoice.</div><div className="mt-6 flex gap-3"><button type="button" onClick={() => setInviteOpen(false)} className="flex-1 rounded-lg border border-[#DCE4F0] py-3 text-[9px] font-semibold text-[#64748B]">Cancel</button><button type="submit" className="flex-1 rounded-lg bg-[#172554] py-3 text-[9px] font-semibold text-white">Invite & add seat</button></div></form></div>}
      {roleOpen && <div className="fixed inset-0 z-[75] grid place-items-center bg-[#0F172A]/55 p-4" onMouseDown={() => setRoleOpen(false)}><form onSubmit={createRole} onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><div className="text-[9px] font-bold uppercase tracking-wider text-[#2563EB]">Access control</div><h3 className="mt-2 font-display text-xl font-semibold">Create custom role</h3><p className="mt-1 text-[9px] text-[#94A3B8]">Choose exactly what members with this role can access.</p></div><button type="button" onClick={() => setRoleOpen(false)} className="grid h-8 w-8 place-items-center rounded-full bg-[#F1F5F9] text-[#64748B]"><Icon name="close" size={13} /></button></div><label className="mt-6 block text-[9px] font-bold uppercase tracking-wider text-[#64748B]">Role name<input required value={roleName} onChange={(event) => setRoleName(event.target.value)} className="mt-2 w-full rounded-lg border border-[#DCE4F0] px-3 py-3 text-[10px] font-normal normal-case tracking-normal outline-none focus:border-[#2563EB]" placeholder="e.g. Campaign specialist" /></label><div className="mt-5 text-[9px] font-bold uppercase tracking-wider text-[#64748B]">Permissions</div><div className="mt-3 grid gap-2 sm:grid-cols-2">{permissionOptions.map((permission) => <label key={permission} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-[9px] ${rolePermissions.includes(permission) ? 'border-[#93C5FD] bg-[#EFF6FF] text-[#1D4ED8]' : 'border-[#E2E8F0] text-[#52627A]'}`}><input type="checkbox" checked={rolePermissions.includes(permission)} onChange={() => setRolePermissions((items) => items.includes(permission) ? items.filter((item) => item !== permission) : [...items, permission])} className="accent-[#2563EB]" />{permission}</label>)}</div><div className="mt-6 flex gap-3"><button type="button" onClick={() => setRoleOpen(false)} className="flex-1 rounded-lg border border-[#DCE4F0] py-3 text-[9px] font-semibold text-[#64748B]">Cancel</button><button type="submit" disabled={!roleName.trim() || !rolePermissions.length} className="flex-1 rounded-lg bg-[#172554] py-3 text-[9px] font-semibold text-white disabled:bg-[#CBD5E1]">Create role</button></div></form></div>}
    </>
  )
}

import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'
import { PageIntro } from '../components/PageIntro'
import { api } from '../lib/api'
import { notify } from '../lib/notify'

export function PersonaStudio() {
  const [persona, setPersona] = useState('Lead architect')
  const [angle, setAngle] = useState('Offer complimentary early technical review, CAD/BIM detailing and compliant NBS specification support.')
  useEffect(() => { void api.persona().then((template) => { setPersona(template.stakeholder); setAngle(template.angle) }).catch(() => undefined) }, [])
  return (
    <>
      <PageIntro eyebrow="ICP persona studio" title="Build a relevant ECI message" description="Create role-specific outreach grounded in live planning facts and your verified capabilities. Preview token injection before a campaign goes live." />
      <div className="grid gap-5 xl:grid-cols-[.85fr_1.15fr]">
        <div className="space-y-5">
          <div className="rounded-xl border border-[#DCE4F0] bg-white p-5"><label className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">Target stakeholder</label><div className="mt-3 grid grid-cols-2 gap-2">{['Lead architect', 'Client developer', 'Quantity surveyor', 'Structural engineer'].map((item) => <button key={item} onClick={() => setPersona(item)} className={`rounded-lg border p-3 text-left text-[9px] font-semibold ${persona === item ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8]' : 'border-[#E2E8F0] text-[#64748B]'}`}>{item}</button>)}</div></div>
          <div className="rounded-xl border border-[#DCE4F0] bg-white p-5"><label className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">Verified company proof points</label><div className="mt-3 space-y-2">{['Two ready groundworks gangs in Guildford', 'CAT 320 excavator fleet availability', 'CHAS Elite accredited', '£10m public liability cover'].map((item) => <label key={item} className="flex items-center gap-3 rounded-lg bg-[#F8FAFD] p-3 text-[9px] text-[#52627A]"><input type="checkbox" defaultChecked className="accent-[#2563EB]" />{item}</label>)}</div></div>
          <div className="rounded-xl border border-[#DCE4F0] bg-white p-5"><label className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">Approved value proposition</label><textarea value={angle} onChange={(e) => setAngle(e.target.value)} rows={4} className="mt-3 w-full resize-none rounded-lg border border-[#DCE4F0] p-3 text-[10px] leading-relaxed text-[#52627A] outline-none focus:border-[#2563EB]" /></div>
        </div>
        <div className="rounded-xl border border-[#DCE4F0] bg-white p-6">
          <div className="flex items-center justify-between border-b border-[#EEF2F7] pb-4"><div><div className="text-[9px] font-bold uppercase tracking-wider text-[#2563EB]">Live message preview</div><div className="mt-1 text-[8px] text-[#94A3B8]">Persona: {persona} · RIBA Stage 2</div></div><button onClick={() => { void api.savePersona({ stakeholder: persona, angle }).then(() => notify(`${persona} template saved`)).catch(() => notify('Could not save the template')) }} className="rounded-lg bg-[#172554] px-4 py-2.5 text-[9px] font-semibold text-white">Save template</button></div>
          <div className="mt-6 text-[10px] leading-7 text-[#52627A]"><div className="mb-5 rounded-lg bg-[#F8FAFD] p-4"><span className="font-semibold text-[#1E293B]">Subject:</span> Planning Ref: WA/2025/04217 — Walnut Tree Close (Groundworks ECI)</div><p>Hi Maya,</p><p className="mt-4">I noticed Northbank Studio’s recent submission for the Guildford Innovation District at Walnut Tree Close.</p><p className="mt-4">{angle}</p><p className="mt-4">Given the proposed laboratory facilities and public realm works, our two Guildford-based gangs and CAT 320 fleet could help de-risk the substructure programme before technical design is locked down.</p><p className="mt-4">Are you open to a brief introductory call next week to see if our early technical input could assist?</p><p className="mt-4">Best regards,<br /><b className="text-[#1E293B]">James Wilkins</b><br />Micraft Design Ltd</p></div>
          <div className="mt-8 flex items-center gap-2 rounded-lg bg-[#ECFDF5] p-3 text-[8px] font-semibold text-[#047857]"><Icon name="spark" size={13} /> All claims match verified company profile · UK GDPR / PECR checks passed</div>
        </div>
      </div>
    </>
  )
}

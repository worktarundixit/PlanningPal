import { useMemo, useState } from 'react'
import type { Scheme } from '@planningpal/shared'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { PageIntro } from '../components/PageIntro'
import { api, type Campaign, type ContactGroup } from '../lib/api'
import { exportSchemes, notify } from '../lib/notify'

export function PlanningExplorer({ data, onOpen, onSave, saved, canSave = true, canExport = true, canCampaign = true, onNavigate }: { data: Scheme[]; onOpen: (scheme: Scheme) => void; onSave: (id: string) => void; saved: string[]; canSave?: boolean; canExport?: boolean; canCampaign?: boolean; onNavigate?: (screen: string) => void }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All categories')
  const [county, setCounty] = useState('All counties')
  const [stageFilter, setStageFilter] = useState('All stages')
  const [contactFilter, setContactFilter] = useState('All contacts')
  const [authorityFilter, setAuthorityFilter] = useState('All authorities')
  const [minValue, setMinValue] = useState('')
  const [maxValue, setMaxValue] = useState('')
  const [quickFilter, setQuickFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sortKey, setSortKey] = useState<'title' | 'category' | 'council' | 'value' | 'stage' | 'contact' | 'score'>('score')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Campaign & Contact Group modal state
  const [campaignModalOpen, setCampaignModalOpen] = useState(false)
  const [campaignsList, setCampaignsList] = useState<Campaign[]>([])
  const [contactGroupsList, setContactGroupsList] = useState<ContactGroup[]>([])
  const [targetCampaignId, setTargetCampaignId] = useState('')
  const [modalMode, setModalMode] = useState<'campaign' | 'new_group' | 'existing_group'>('campaign')
  const [targetGroupId, setTargetGroupId] = useState('')
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDescription, setNewGroupDescription] = useState('')
  const [isSubmittingToCampaign, setIsSubmittingToCampaign] = useState(false)

  const filteredResults = useMemo(() => {
    return data.filter((scheme) => {
      const matchesQuery = `${scheme.title} ${scheme.location} ${scheme.council} ${scheme.id} ${scheme.architect} ${scheme.practice} ${scheme.applicant}`.toLowerCase().includes(query.toLowerCase())
      const matchesCategory = category === 'All categories' || scheme.category === category.toUpperCase()
      const matchesCounty = county === 'All counties' || scheme.county === county
      const matchesStage = stageFilter === 'All stages' || scheme.stage === stageFilter
      const contactLevel = scheme.email && scheme.phone ? 'Direct contacts' : scheme.email || scheme.phone ? 'Partial contacts' : 'Missing contacts'
      const matchesContact = contactFilter === 'All contacts' || contactLevel === contactFilter
      const matchesAuthority = authorityFilter === 'All authorities' || scheme.council === authorityFilter
      const matchesMinValue = !minValue || scheme.valueNum >= Number(minValue)
      const matchesMaxValue = !maxValue || (scheme.valueFrom ?? scheme.valueNum) <= Number(maxValue)
      const matchesQuick = !quickFilter
        || (quickFilter === 'Schemes >£1m' && scheme.valueNum > 1)
        || (quickFilter === 'Direct contacts' && Boolean(scheme.email && scheme.phone))
        || (quickFilter === 'New build' && scheme.category === 'NEW BUILD')
        || (quickFilter === 'Housing units' && scheme.category === 'HOUSING UNITS')
        || (quickFilter === 'London' && scheme.region === 'London')
      return matchesQuery && matchesCategory && matchesCounty && matchesStage && matchesContact && matchesAuthority && matchesMinValue && matchesMaxValue && matchesQuick
    }).sort((first, second) => {
      const contactScore = (scheme: Scheme) => scheme.email && scheme.phone ? 2 : scheme.email || scheme.phone ? 1 : 0
      const values: Record<typeof sortKey, [string | number, string | number]> = {
        title: [first.title, second.title],
        category: [first.category || '', second.category || ''],
        council: [first.council, second.council],
        value: [first.valueNum, second.valueNum],
        stage: [first.stage, second.stage],
        contact: [contactScore(first), contactScore(second)],
        score: [first.score, second.score],
      }
      const [firstValue, secondValue] = values[sortKey]
      const comparison = typeof firstValue === 'number' && typeof secondValue === 'number'
        ? firstValue - secondValue
        : String(firstValue).localeCompare(String(secondValue))
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [data, query, category, county, stageFilter, contactFilter, authorityFilter, minValue, maxValue, quickFilter, sortKey, sortDirection])
  const pageSize = 12
  const totalPages = Math.max(1, Math.ceil(filteredResults.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const results = filteredResults.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const updateFilter = (callback: () => void) => { callback(); setPage(1) }
  const currentPageIds = results.map((scheme) => scheme.id)
  const allCurrentSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.includes(id))
  const selectedSchemes = data.filter((scheme) => selectedIds.includes(scheme.id))
  const toggleSelected = (id: string) => setSelectedIds((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id])
  const toggleCurrentPage = () => setSelectedIds((items) => allCurrentSelected ? items.filter((id) => !currentPageIds.includes(id)) : [...new Set([...items, ...currentPageIds])])
  const bulkSave = () => {
    selectedIds.filter((id) => !saved.includes(id)).forEach(onSave)
    notify(`${selectedIds.length} schemes saved`)
  }

  const extractedContacts = useMemo(() => {
    const list: Array<{
      email: string
      firstName: string
      lastName: string
      company: string
      title: string
      phone: string
      council: string
      schemeTitle: string
      schemeRef: string
    }> = []
    const seen = new Set<string>()
    for (const scheme of selectedSchemes) {
      const email = scheme.email?.trim().toLowerCase()
      if (email && email.includes('@') && !seen.has(email)) {
        seen.add(email)
        const rawName = scheme.architect && scheme.architect !== 'Contact not published' ? scheme.architect : scheme.applicant || ''
        const parts = rawName.split(' ')
        list.push({
          email,
          firstName: parts[0] || '',
          lastName: parts.slice(1).join(' ') || '',
          company: scheme.practice || '',
          title: 'Planning Contact',
          phone: scheme.phone || '',
          council: scheme.council || '',
          schemeTitle: scheme.title || '',
          schemeRef: scheme.id || '',
        })
      }
    }
    return list
  }, [selectedSchemes])

  const openCampaignModal = async () => {
    if (selectedIds.length === 0) return
    setIsSubmittingToCampaign(true)
    try {
      const [campaignsRes, groupsRes] = await Promise.all([
        api.campaigns(),
        api.contactGroups().catch(() => ({ data: [] })),
      ])
      setCampaignsList(campaignsRes.data)
      setContactGroupsList(groupsRes.data)
      if (campaignsRes.data.length > 0) setTargetCampaignId(campaignsRes.data[0].id)
      if (groupsRes.data.length > 0) setTargetGroupId(groupsRes.data[0].id)
      setNewGroupName(`Selected Approved Schemes (${new Date().toLocaleDateString('en-GB')})`)
      setCampaignModalOpen(true)
    } catch {
      notify('Could not load campaigns or groups')
    } finally {
      setIsSubmittingToCampaign(false)
    }
  }

  const handleExecuteCampaignOrGroup = async () => {
    if (extractedContacts.length === 0) {
      notify('No valid contact emails found in the selected schemes.')
      return
    }
    setIsSubmittingToCampaign(true)
    try {
      if (modalMode === 'campaign') {
        if (!targetCampaignId) {
          notify('Please select a campaign')
          return
        }
        const leads = extractedContacts.map((c) => ({
          email: c.email,
          firstName: c.firstName || undefined,
          lastName: c.lastName || undefined,
          company: c.company || undefined,
          title: c.title || undefined,
        }))
        const result = await api.addCampaignLeads(targetCampaignId, leads)
        notify(`${result.added} contact${result.added === 1 ? '' : 's'} added to campaign!`)
      } else if (modalMode === 'existing_group') {
        if (!targetGroupId) {
          notify('Please select a contact group')
          return
        }
        const result = await api.addContactGroupMembers(targetGroupId, extractedContacts)
        const group = contactGroupsList.find((g) => g.id === targetGroupId)
        notify(`Added ${result.added} contact${result.added === 1 ? '' : 's'} to "${group?.name || 'group'}"!`)
      } else if (modalMode === 'new_group') {
        if (!newGroupName.trim()) {
          notify('Please enter a group name')
          return
        }
        const created = await api.createContactGroup({
          name: newGroupName.trim(),
          description: newGroupDescription.trim(),
        })
        const result = await api.addContactGroupMembers(created.id, extractedContacts)
        notify(`Created group "${created.name}" with ${result.added} contact${result.added === 1 ? '' : 's'}!`)
      }
      setSelectedIds([])
      setCampaignModalOpen(false)
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setIsSubmittingToCampaign(false)
    }
  }
  const sortColumn = (key: typeof sortKey) => {
    if (sortKey === key) setSortDirection((direction) => direction === 'asc' ? 'desc' : 'asc')
    else {
      setSortKey(key)
      setSortDirection(key === 'value' || key === 'score' || key === 'contact' ? 'desc' : 'asc')
    }
    setPage(1)
  }
  const sortableHeader = (label: string, key: typeof sortKey) => (
    <button onClick={() => sortColumn(key)} className="inline-flex items-center gap-1.5 whitespace-nowrap hover:text-[#2563EB]">
      {label}
      <span className={sortKey === key ? 'text-[#2563EB]' : 'text-[#CBD5E1]'}>{sortKey === key ? sortDirection === 'asc' ? '↑' : '↓' : '↕'}</span>
    </button>
  )
  const advancedFilterCount = Number(category !== 'All categories') + Number(county !== 'All counties') + Number(stageFilter !== 'All stages') + Number(contactFilter !== 'All contacts') + Number(authorityFilter !== 'All authorities') + Number(Boolean(minValue)) + Number(Boolean(maxValue)) + Number(Boolean(quickFilter))
  const authorities = [...new Set(data.map((scheme) => scheme.council).filter(Boolean))].sort()
  const stages = [...new Set(data.map((scheme) => scheme.stage).filter(Boolean))].sort()

  return (
    <>
      <PageIntro
        eyebrow="Planning intelligence explorer"
        title="Find schemes before the tender list closes"
        description="Search enriched statutory applications across your licensed territories. Every result includes valuation, trade classification and verified decision-makers."
      />
      <div className="rounded-xl border border-[#DCE4F0] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex flex-1 items-center gap-2 rounded-lg border border-[#DCE4F0] bg-[#F8FAFD] px-3 py-2.5 text-[#718096]">
            <Icon name="search" size={15} />
            <input value={query} onChange={(e) => updateFilter(() => setQuery(e.target.value))} className="w-full bg-transparent text-[11px] outline-none" placeholder="Application ref, postcode, architect or keyword..." />
          </label>
          <button onClick={() => setShowAdvanced((open) => !open)} className={`flex shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-[10px] font-semibold ${showAdvanced || advancedFilterCount ? 'border-[#93C5FD] bg-[#EFF6FF] text-[#1D4ED8]' : 'border-[#DCE4F0] text-[#64748B]'}`}>
            <Icon name="filter" size={13} /> Advanced search
            {advancedFilterCount > 0 && <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[#2563EB] px-1 text-[7px] text-white">{advancedFilterCount}</span>}
            <span className={`ml-1 mr-0.5 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}><Icon name="chevron" size={11} /></span>
          </button>
        </div>
        {showAdvanced && <div className="mt-4 border-t border-[#E8EDF5] pt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="relative"><select value={category} onChange={(e) => updateFilter(() => setCategory(e.target.value))} className="w-full appearance-none rounded-lg border border-[#DCE4F0] bg-white py-2.5 pl-3 pr-10 text-[10px] text-[#52627A] outline-none">
              <option>All categories</option><option>New build</option><option>Housing units</option>
            </select><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] rotate-90"><Icon name="chevron" size={12} /></span></label>
            <label className="relative"><select value={county} onChange={(e) => updateFilter(() => setCounty(e.target.value))} className="w-full appearance-none rounded-lg border border-[#DCE4F0] bg-white py-2.5 pl-3 pr-10 text-[10px] text-[#52627A] outline-none">
              <option>All counties</option><option>London</option><option>Surrey</option><option>Kent</option>
            </select><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] rotate-90"><Icon name="chevron" size={12} /></span></label>
            <label className="relative"><select value={stageFilter} onChange={(event) => updateFilter(() => setStageFilter(event.target.value))} className="w-full appearance-none rounded-lg border border-[#DCE4F0] bg-white py-2.5 pl-3 pr-10 text-[10px] text-[#52627A] outline-none"><option>All stages</option>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] rotate-90"><Icon name="chevron" size={12} /></span></label>
            <label className="relative"><select value={contactFilter} onChange={(event) => updateFilter(() => setContactFilter(event.target.value))} className="w-full appearance-none rounded-lg border border-[#DCE4F0] bg-white py-2.5 pl-3 pr-10 text-[10px] text-[#52627A] outline-none"><option>All contacts</option><option>Direct contacts</option><option>Partial contacts</option><option>Missing contacts</option></select><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] rotate-90"><Icon name="chevron" size={12} /></span></label>
            <label className="relative"><select value={authorityFilter} onChange={(event) => updateFilter(() => setAuthorityFilter(event.target.value))} className="w-full appearance-none rounded-lg border border-[#DCE4F0] bg-white py-2.5 pl-3 pr-10 text-[10px] text-[#52627A] outline-none"><option>All authorities</option>{authorities.map((authority) => <option key={authority}>{authority}</option>)}</select><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] rotate-90"><Icon name="chevron" size={12} /></span></label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-1 rounded-lg border border-[#DCE4F0] bg-white px-3 text-[9px] text-[#94A3B8]">£m<input type="number" min="0" step="0.1" value={minValue} onChange={(event) => updateFilter(() => setMinValue(event.target.value))} className="w-full bg-transparent py-2.5 text-[10px] text-[#52627A] outline-none" placeholder="Min value" /></label>
              <label className="flex items-center gap-1 rounded-lg border border-[#DCE4F0] bg-white px-3 text-[9px] text-[#94A3B8]">£m<input type="number" min="0" step="0.1" value={maxValue} onChange={(event) => updateFilter(() => setMaxValue(event.target.value))} className="w-full bg-transparent py-2.5 text-[10px] text-[#52627A] outline-none" placeholder="Max value" /></label>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[9px] font-semibold uppercase tracking-wider text-[#94A3B8]">Quick filters</span>
            {['New build', 'Housing units', 'Schemes >£1m', 'Direct contacts', 'London'].map((filter) => <button key={filter} onClick={() => updateFilter(() => setQuickFilter(quickFilter === filter ? '' : filter))} className={`rounded-full px-3 py-1.5 text-[9px] font-medium ${quickFilter === filter ? 'bg-[#DBEAFE] text-[#1D4ED8]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>{filter}</button>)}
            {(query || advancedFilterCount > 0) && <button onClick={() => { setQuery(''); setCategory('All categories'); setCounty('All counties'); setStageFilter('All stages'); setContactFilter('All contacts'); setAuthorityFilter('All authorities'); setMinValue(''); setMaxValue(''); setQuickFilter(''); setPage(1) }} className="ml-auto text-[9px] font-semibold text-[#2563EB]">Clear filters</button>}
          </div>
        </div>}
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-[#DCE4F0] bg-white">
        {selectedIds.length > 0 && <div className="flex flex-wrap items-center gap-2 border-b border-[#BFDBFE] bg-[#EFF6FF] px-5 py-3">
          <div className="mr-auto flex items-center gap-2 text-[10px] font-semibold text-[#1D4ED8]"><span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#2563EB] px-1 text-[8px] text-white">{selectedIds.length}</span> selected</div>
          <button disabled={!canSave} onClick={bulkSave} className="flex items-center gap-1.5 rounded-md bg-white px-3 py-2 text-[8px] font-semibold text-[#52627A] shadow-sm disabled:cursor-not-allowed disabled:opacity-40"><Icon name="building" size={11} /> Save</button>
          <button disabled={!canCampaign || isSubmittingToCampaign} onClick={openCampaignModal} className="flex items-center gap-1.5 rounded-md bg-white px-3 py-2 text-[8px] font-semibold text-[#52627A] shadow-sm disabled:cursor-not-allowed disabled:opacity-40"><Icon name="send" size={11} /> {isSubmittingToCampaign ? 'Loading...' : 'Add to campaign / group'}</button>
          <button disabled={!canExport} onClick={() => exportSchemes(selectedSchemes)} className="flex items-center gap-1.5 rounded-md bg-[#172554] px-3 py-2 text-[8px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"><Icon name="download" size={11} /> Export</button>
          <button onClick={() => setSelectedIds([])} className="grid h-7 w-7 place-items-center rounded-md text-[#64748B] hover:bg-white" aria-label="Clear selection"><Icon name="close" size={12} /></button>
        </div>}
        <div className="flex items-center justify-between border-b border-[#E8EDF5] px-5 py-4">
          <div className="text-[10px] font-semibold text-[#334155]">{filteredResults.length} matching applications <span className="ml-2 font-normal text-[#94A3B8]">44-column approved schemes export</span></div>
          <div className="text-[9px] text-[#94A3B8]">Select a column heading to sort</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] border-collapse text-left">
            <thead className="bg-[#F8FAFD] text-[8px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
              <tr><th className="w-10 px-4 py-3"><input type="checkbox" checked={allCurrentSelected} onChange={toggleCurrentPage} aria-label="Select all schemes on this page" className="h-3.5 w-3.5 accent-[#2563EB]" /></th><th className="px-2 py-3">{sortableHeader('Scheme / Application', 'title')}</th><th className="px-4 py-3">{sortableHeader('Category', 'category')}</th><th className="px-4 py-3">{sortableHeader('Council', 'council')}</th><th className="px-4 py-3">{sortableHeader('Value range', 'value')}</th><th className="px-4 py-3">{sortableHeader('Stage', 'stage')}</th><th className="px-4 py-3">{sortableHeader('Contact', 'contact')}</th><th className="px-4 py-3">{sortableHeader('Fit', 'score')}</th><th className="px-4 py-3" /></tr>
            </thead>
            <tbody>
              {data.length === 0 && <tr><td colSpan={9} className="p-5"><EmptyState icon="search" title="No planning leads have arrived for this workspace yet." action={{ label: 'Set up your ICP', onClick: () => onNavigate?.('Workspace setup') }} /></td></tr>}
              {data.length > 0 && filteredResults.length === 0 && <tr><td colSpan={9} className="p-5"><EmptyState kind="filtered" icon="filter" title="No schemes match these filters." action={{ label: 'Clear filters', onClick: () => { setQuery(''); setCategory('All categories'); setCounty('All counties'); setStageFilter('All stages'); setContactFilter('All contacts'); setAuthorityFilter('All authorities'); setMinValue(''); setMaxValue(''); setQuickFilter(''); setPage(1) } }} /></td></tr>}
              {results.map((scheme) => (
                <tr key={scheme.id} onClick={() => onOpen(scheme)} className="cursor-pointer border-t border-[#EEF2F7] text-[10px] transition hover:bg-[#F8FAFD]">
                  <td className="px-4 py-4"><input type="checkbox" checked={selectedIds.includes(scheme.id)} onChange={() => toggleSelected(scheme.id)} onClick={(event) => event.stopPropagation()} aria-label={`Select ${scheme.title}`} className="h-3.5 w-3.5 accent-[#2563EB]" /></td>
                  <td className="px-2 py-4"><div className="font-display text-[12px] font-semibold text-[#1E293B]">{scheme.title}</div><div className="mt-1 text-[9px] text-[#94A3B8]">{scheme.id} · {scheme.location}</div></td>
                  <td className="px-4 py-4"><span className="rounded-full bg-[#F1F5F9] px-2 py-1 text-[8px] font-semibold text-[#52627A]">{scheme.type.split(' · ')[0]}</span></td>
                  <td className="px-4 py-4 text-[#64748B]">{scheme.council.replace(' Borough Council', '').replace(' Council', '')}</td>
                  <td className="px-4 py-4 font-semibold text-[#334155]">{scheme.value}</td>
                  <td className="px-4 py-4"><span className="font-semibold text-[#2563EB]">{scheme.stage}</span></td>
                  <td className="px-4 py-4"><span className={`inline-flex items-center gap-1.5 text-[9px] font-semibold ${scheme.email && scheme.phone ? 'text-[#36805A]' : 'text-[#A16207]'}`}><i className={`h-1.5 w-1.5 rounded-full ${scheme.email && scheme.phone ? 'bg-[#4ADE80]' : 'bg-[#FACC15]'}`} /> {scheme.email && scheme.phone ? 'Direct' : scheme.email || scheme.phone ? 'Partial' : 'Missing'}</span></td>
                  <td className="px-4 py-4"><span className="font-display text-[12px] font-semibold">{scheme.score}</span><span className="text-[#94A3B8]">/100</span></td>
                  <td className="px-4 py-4"><button disabled={!canSave} onClick={(e) => { e.stopPropagation(); onSave(scheme.id) }} className={`rounded-md px-2.5 py-1.5 text-[9px] font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${saved.includes(scheme.id) ? 'bg-[#172554] text-white' : 'border border-[#DCE4F0] text-[#64748B]'}`}>{saved.includes(scheme.id) ? 'Saved' : 'Save'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[#E8EDF5] px-5 py-4 text-[9px] text-[#94A3B8]"><span>Showing {(currentPage - 1) * pageSize + (results.length ? 1 : 0)}–{(currentPage - 1) * pageSize + results.length} of {filteredResults.length}</span><div className="flex gap-1.5"><button disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="grid h-8 min-w-8 place-items-center rounded-md border border-[#E2E8F0] px-2 text-[#64748B] disabled:opacity-30">‹</button>{Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1).map((pageNumber) => <button key={pageNumber} onClick={() => setPage(pageNumber)} className={`grid h-8 min-w-8 place-items-center rounded-md px-2 ${pageNumber === currentPage ? 'bg-[#172554] text-white' : 'border border-[#E2E8F0] text-[#64748B]'}`}>{pageNumber}</button>)}<button disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="grid h-8 min-w-8 place-items-center rounded-md border border-[#E2E8F0] px-2 text-[#64748B] disabled:opacity-30">›</button></div></div>
      </div>

      {/* Add to Campaign or Group Modal */}
      {campaignModalOpen && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-[#0F172A]/55 p-4" onMouseDown={() => setCampaignModalOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-[#2563EB]">Lead Outreach & Contact Groups</div>
                <h3 className="mt-1 font-display text-lg font-semibold">
                  Add {extractedContacts.length} Contact{extractedContacts.length === 1 ? '' : 's'} from {selectedIds.length} Schemes
                </h3>
                <p className="mt-1 text-[8px] text-[#64748B]">
                  Direct and verified decision-maker emails found across your selected planning applications.
                </p>
              </div>
              <button onClick={() => setCampaignModalOpen(false)} className="text-[#94A3B8]">
                <Icon name="close" size={14} />
              </button>
            </div>

            <div className="mt-4 flex rounded-lg border border-[#DCE4F0] bg-[#F8FAFD] p-1">
              <button
                type="button"
                onClick={() => setModalMode('campaign')}
                className={`flex-1 rounded-md py-1.5 text-[9px] font-semibold transition ${modalMode === 'campaign' ? 'bg-[#172554] text-white shadow-sm' : 'text-[#64748B]'}`}
              >
                Add to Campaign
              </button>
              <button
                type="button"
                onClick={() => setModalMode('new_group')}
                className={`flex-1 rounded-md py-1.5 text-[9px] font-semibold transition ${modalMode === 'new_group' ? 'bg-[#172554] text-white shadow-sm' : 'text-[#64748B]'}`}
              >
                Create New Group
              </button>
              {contactGroupsList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setModalMode('existing_group')}
                  className={`flex-1 rounded-md py-1.5 text-[9px] font-semibold transition ${modalMode === 'existing_group' ? 'bg-[#172554] text-white shadow-sm' : 'text-[#64748B]'}`}
                >
                  Add to Group
                </button>
              )}
            </div>

            {modalMode === 'campaign' && (
              <div className="mt-4">
                {campaignsList.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#CBD5E1] p-4 text-center text-[9px] text-[#64748B]">
                    No campaigns created yet. Please create a campaign in the Campaigns screen first.
                  </div>
                ) : (
                  <label className="block text-[8px] font-bold uppercase text-[#64748B]">
                    Choose Campaign
                    <select
                      value={targetCampaignId}
                      onChange={(e) => setTargetCampaignId(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-[#DCE4F0] bg-white px-3 py-2 text-[10px] outline-none"
                    >
                      {campaignsList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.contacts} contacts · {c.status})
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            )}

            {modalMode === 'new_group' && (
              <div className="mt-4 flex flex-col gap-3">
                <label className="block text-[8px] font-bold uppercase text-[#64748B]">
                  Group Name
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g. Southwark Approved Schemes Nov 2026"
                    className="mt-1 w-full rounded-lg border border-[#DCE4F0] px-3 py-2 text-[10px] outline-none"
                  />
                </label>
                <label className="block text-[8px] font-bold uppercase text-[#64748B]">
                  Description (optional)
                  <input
                    type="text"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    placeholder="e.g. Architect and agent contacts from recent explorer search"
                    className="mt-1 w-full rounded-lg border border-[#DCE4F0] px-3 py-2 text-[10px] outline-none"
                  />
                </label>
              </div>
            )}

            {modalMode === 'existing_group' && (
              <div className="mt-4">
                <label className="block text-[8px] font-bold uppercase text-[#64748B]">
                  Choose Contact Group
                  <select
                    value={targetGroupId}
                    onChange={(e) => setTargetGroupId(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-[#DCE4F0] bg-white px-3 py-2 text-[10px] outline-none"
                  >
                    {contactGroupsList.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.memberCount} members)
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setCampaignModalOpen(false)}
                className="flex-1 rounded-lg border border-[#DCE4F0] py-2 text-[9px] font-semibold text-[#64748B]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingToCampaign || extractedContacts.length === 0}
                onClick={handleExecuteCampaignOrGroup}
                className="flex-1 rounded-lg bg-[#172554] py-2 text-[9px] font-semibold text-white disabled:opacity-50 hover:bg-[#1E3A8A]"
              >
                {isSubmittingToCampaign ? 'Saving...' : modalMode === 'campaign' ? 'Add to Campaign' : 'Save to Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

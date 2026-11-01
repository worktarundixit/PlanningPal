import { useState } from 'react'
import type { Scheme } from '@planningpal/shared'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { PageIntro } from '../components/PageIntro'
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

  const filteredResults = data.filter((scheme) => {
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
          <button disabled={!canCampaign} onClick={() => { notify(`${selectedIds.length} schemes added to a campaign draft`); setSelectedIds([]) }} className="flex items-center gap-1.5 rounded-md bg-white px-3 py-2 text-[8px] font-semibold text-[#52627A] shadow-sm disabled:cursor-not-allowed disabled:opacity-40"><Icon name="send" size={11} /> Add to campaign</button>
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
    </>
  )
}

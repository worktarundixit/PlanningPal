import { useMemo, useState } from 'react'
import { Icon } from './Icon'
import { api } from '../lib/api'
import { notify } from '../lib/notify'

const TARGET_FIELDS = [
  { key: 'Application Reference', label: 'Application Reference', required: true, aliases: ['ref', 'reference', 'app_no', 'app ref', 'id', 'application number', 'app_ref'] },
  { key: 'Heading', label: 'Heading / Scheme Title', required: true, aliases: ['title', 'heading', 'scheme', 'project', 'name', 'scheme title'] },
  { key: 'Local Authority', label: 'Local Authority / Council', required: true, aliases: ['council', 'authority', 'local authority', 'lpa', 'borough'] },
  { key: 'Proposal', label: 'Proposal / Description', required: false, aliases: ['description', 'proposal', 'summary', 'details'] },
  { key: 'Site Address', label: 'Site Address / Location', required: false, aliases: ['address', 'site address', 'location', 'site', 'street'] },
  { key: 'County', label: 'County / Region', required: false, aliases: ['county', 'region', 'area'] },
  { key: '£m Value From', label: 'Value From (£m)', required: false, aliases: ['value from', 'min value', 'value_from', 'budget from'] },
  { key: '£m Value To', label: 'Value To (£m)', required: false, aliases: ['value to', 'max value', 'value_to', 'value', 'budget'] },
  { key: 'Project Category', label: 'Project Category', required: false, aliases: ['category', 'project category', 'type', 'sector'] },
  { key: 'Project Stage', label: 'Project Stage', required: false, aliases: ['stage', 'project stage', 'riba stage', 'status'] },
  { key: 'Architect Agent Contact', label: 'Architect / Agent Contact Name', required: false, aliases: ['architect contact', 'agent contact', 'contact', 'architect', 'agent name'] },
  { key: 'Architect Agent', label: 'Architect Practice / Firm', required: false, aliases: ['practice', 'architect agent', 'firm', 'studio', 'agent company'] },
  { key: 'Architect Agent Email', label: 'Architect Email', required: false, aliases: ['architect email', 'agent email', 'email', 'contact email'] },
  { key: 'Architect Agent Phone', label: 'Architect Phone', required: false, aliases: ['architect phone', 'agent phone', 'phone', 'telephone'] },
  { key: 'Client Applicant Contact', label: 'Client / Applicant Contact', required: false, aliases: ['client contact', 'applicant contact', 'client', 'applicant name'] },
  { key: 'Client Applicant', label: 'Client Company', required: false, aliases: ['client company', 'applicant company', 'applicant'] },
  { key: 'URL Link', label: 'Portal URL', required: false, aliases: ['url', 'link', 'portal url', 'portal link'] },
] as const

type TargetKey = (typeof TARGET_FIELDS)[number]['key']

function parseCsv(raw: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length < 1) return { headers: [], rows: [] }

  // Detect delimiter: comma, tab, or semicolon
  const firstLine = lines[0]
  const commaCount = (firstLine.match(/,/g) || []).length
  const tabCount = (firstLine.match(/\t/g) || []).length
  const semiCount = (firstLine.match(/;/g) || []).length
  const delimiter = tabCount > commaCount && tabCount > semiCount ? '\t' : semiCount > commaCount ? ';' : ','

  const parseLine = (line: string): string[] => {
    const tokens: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === delimiter && !inQuotes) {
        tokens.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    tokens.push(current.trim())
    return tokens
  }

  const headers = parseLine(lines[0])
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i])
    if (values.length === 0 || (values.length === 1 && !values[0])) continue
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = values[idx] || ''
    })
    rows.push(row)
  }

  return { headers, rows }
}

export function UploadPlanningDataModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload')
  const [rawText, setRawText] = useState('')
  const [fileName, setFileName] = useState('')
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([])
  const [mappings, setMappings] = useState<Record<TargetKey, string>>({} as Record<TargetKey, string>)
  const [batchName, setBatchName] = useState(`Batch ${new Date().toLocaleDateString('en-GB')}`)
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const [sortField, setSortField] = useState<TargetKey>('Heading')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [previewSearch, setPreviewSearch] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFileChange = (file: File) => {
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = String(e.target?.result || '')
      setRawText(content)
      processRawContent(content)
    }
    reader.readAsText(file)
  }

  const processRawContent = (content: string) => {
    const parsed = parseCsv(content)
    if (parsed.headers.length === 0 || parsed.rows.length === 0) {
      notify('Could not find data rows in this CSV')
      return
    }
    setCsvHeaders(parsed.headers)
    setCsvRows(parsed.rows)

    // Automatically detect best column matches
    const initialMappings: Partial<Record<TargetKey, string>> = {}
    TARGET_FIELDS.forEach((target) => {
      const matched = parsed.headers.find((header) => {
        const lower = header.toLowerCase().trim()
        if (lower === target.key.toLowerCase()) return true
        return target.aliases.some((alias) => lower.includes(alias))
      })
      if (matched) {
        initialMappings[target.key] = matched
      }
    })

    setMappings(initialMappings as Record<TargetKey, string>)
    setStep('mapping')
  }

  const downloadSampleCsv = () => {
    const headers = TARGET_FIELDS.map((f) => f.key).join(',')
    const sampleRow = [
      '26/01248/FUL',
      'Southwark Commercial Mixed-Use Development',
      'London Borough of Southwark',
      'Demolition of existing light industrial unit and erection of a 6-storey workspace development',
      '44 Bermondsey Wall, London SE16',
      'Greater London',
      '4.5',
      '6.2',
      'COMMERCIAL',
      'Approved',
      'Alexander Vance',
      'Vance Studio Architects',
      'alexander@vancestudio.co.uk',
      '+44 20 7946 0192',
      'Marcus Sterling',
      'Sterling Capital Partners',
      'https://planning.southwark.gov.uk/online-applications/',
    ]
      .map((val) => `"${val}"`)
      .join(',')

    const csvContent = `${headers}\n${sampleRow}\n`
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'planningpal_data_template.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  // Pre-mapped objects for preview
  const mappedRecords = useMemo(() => {
    return csvRows.map((row, index) => {
      const mapped: Record<string, string> = { _originalIndex: String(index) }
      TARGET_FIELDS.forEach((tf) => {
        const sourceHeader = mappings[tf.key]
        mapped[tf.key] = sourceHeader ? row[sourceHeader]?.trim() || '' : ''
      })
      return mapped
    })
  }, [csvRows, mappings])

  const proceedToPreview = () => {
    // Validate required fields
    const missing = TARGET_FIELDS.filter((tf) => tf.required && !mappings[tf.key])
    if (missing.length > 0) {
      notify(`Please map required fields: ${missing.map((m) => m.label).join(', ')}`)
      return
    }
    // Select all by default
    setSelectedIndices(new Set(mappedRecords.map((_, i) => i)))
    setStep('preview')
  }

  const filteredAndSortedRecords = useMemo(() => {
    let result = [...mappedRecords]
    if (previewSearch.trim()) {
      const q = previewSearch.toLowerCase()
      result = result.filter((r) =>
        Object.values(r).some((val) => val.toLowerCase().includes(q)),
      )
    }

    result.sort((a, b) => {
      const valA = a[sortField] || ''
      const valB = b[sortField] || ''
      const comparison = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [mappedRecords, previewSearch, sortField, sortDirection])

  const toggleSort = (field: TargetKey) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const toggleSelectAll = () => {
    if (selectedIndices.size === filteredAndSortedRecords.length) {
      setSelectedIndices(new Set())
    } else {
      setSelectedIndices(new Set(filteredAndSortedRecords.map((r) => Number(r._originalIndex))))
    }
  }

  const handleCommitToGlobal = async () => {
    const checkedRows = mappedRecords.filter((_, idx) => selectedIndices.has(idx))
    if (checkedRows.length === 0) {
      notify('Please check at least one row to add to the global database.')
      return
    }

    setIsSubmitting(true)
    try {
      const payloadRecords = checkedRows.map((row) => {
        const clean: Record<string, string> = {}
        TARGET_FIELDS.forEach((tf) => {
          clean[tf.key] = row[tf.key] || ''
        })
        return clean
      })

      const res = await api.uploadPlanningData({
        batchName: batchName.trim() || 'Manual CSV Upload',
        records: payloadRecords,
      })

      notify(`Added to Global Database: ${res.inserted} new schemes imported, ${res.updated} updated!`)
      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Could not upload planning data')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-[#0F172A]/55 p-4" onMouseDown={onClose}>
      <div
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4 bg-[#F8FAFD]">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-[#2563EB]">SuperAdmin Data Pipeline</div>
            <h2 className="text-base font-semibold text-[#172554]">Upload & Stage Planning Data</h2>
          </div>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#64748B]">
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex border-b border-[#EEF2F7] bg-white px-6 py-2.5 text-[10px] font-semibold text-[#64748B]">
          <span className={`flex items-center gap-1.5 ${step === 'upload' ? 'text-[#2563EB]' : 'text-[#1E293B]'}`}>
            <span className={`grid h-4 w-4 place-items-center rounded-full text-[8px] ${step === 'upload' ? 'bg-[#2563EB] text-white' : 'bg-[#E2E8F0]'}`}>1</span>
            Upload File
          </span>
          <span className="mx-3 text-[#CBD5E1]">›</span>
          <span className={`flex items-center gap-1.5 ${step === 'mapping' ? 'text-[#2563EB]' : 'text-[#64748B]'}`}>
            <span className={`grid h-4 w-4 place-items-center rounded-full text-[8px] ${step === 'mapping' ? 'bg-[#2563EB] text-white' : 'bg-[#E2E8F0]'}`}>2</span>
            Map Columns
          </span>
          <span className="mx-3 text-[#CBD5E1]">›</span>
          <span className={`flex items-center gap-1.5 ${step === 'preview' ? 'text-[#2563EB]' : 'text-[#64748B]'}`}>
            <span className={`grid h-4 w-4 place-items-center rounded-full text-[8px] ${step === 'preview' ? 'bg-[#2563EB] text-white' : 'bg-[#E2E8F0]'}`}>3</span>
            Review & Add to Global
          </span>
        </div>

        {/* STEP 1: FILE UPLOAD */}
        {step === 'upload' && (
          <div className="p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-[#52627A]">Choose a CSV file containing planning applications or paste lines below.</span>
              <button
                type="button"
                onClick={downloadSampleCsv}
                className="flex items-center gap-1 text-[10px] font-semibold text-[#2563EB] hover:underline"
              >
                <Icon name="download" size={12} /> Download sample CSV template
              </button>
            </div>

            <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#CBD5E1] rounded-xl p-8 hover:bg-[#F8FAFD] cursor-pointer transition">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-[#EFF6FF] text-[#2563EB] mb-2">
                <Icon name="download" size={20} />
              </div>
              <span className="text-xs font-semibold text-[#1E293B]">
                {fileName ? fileName : 'Click to browse or drop CSV file here'}
              </span>
              <span className="text-[10px] text-[#94A3B8] mt-1">Accepts CSV, TSV or text files with header row</span>
              <input
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFileChange(f)
                }}
                className="hidden"
              />
            </label>

            <div className="mt-4">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                Or paste CSV contents directly:
              </span>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={4}
                placeholder="Application Reference,Heading,Local Authority,Proposal,..."
                className="w-full rounded-lg border border-[#DCE4F0] p-3 text-[10px] font-mono outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="mt-5 flex justify-end">
              <button
                disabled={!rawText.trim()}
                onClick={() => processRawContent(rawText)}
                className="rounded-lg bg-[#172554] px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-40 hover:bg-[#1E3A8A]"
              >
                Next: Map Columns ›
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: COLUMN MAPPING */}
        {step === 'mapping' && (
          <div className="p-6 overflow-y-auto flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-[#1E293B]">Map CSV Columns to PlanningPal Fields</h3>
                <p className="text-[10px] text-[#64748B]">
                  Found {csvRows.length} rows and {csvHeaders.length} columns in {fileName || 'pasted data'}.
                </p>
              </div>
              <label className="flex items-center gap-2 text-xs">
                <span className="text-[9px] font-bold uppercase text-[#64748B]">Batch Name:</span>
                <input
                  type="text"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  className="rounded border border-[#DCE4F0] px-2.5 py-1 text-xs outline-none"
                />
              </label>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 flex-1 overflow-y-auto max-h-[50vh] pr-1">
              {TARGET_FIELDS.map((field) => {
                const currentVal = mappings[field.key] || ''
                return (
                  <div key={field.key} className="flex items-center justify-between rounded-lg border border-[#DCE4F0] bg-[#FAFBFD] p-2.5">
                    <div className="min-w-0 pr-2">
                      <div className="text-[10px] font-semibold text-[#1E293B]">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </div>
                      <div className="text-[8px] text-[#94A3B8]">Target: {field.key}</div>
                    </div>
                    <select
                      value={currentVal}
                      onChange={(e) => setMappings({ ...mappings, [field.key]: e.target.value })}
                      className={`rounded border px-2 py-1 text-[9px] outline-none max-w-[180px] ${
                        currentVal ? 'border-[#2563EB] bg-white font-medium text-[#1E293B]' : 'border-[#CBD5E1] bg-white text-[#94A3B8]'
                      }`}
                    >
                      <option value="">— Skip Field —</option>
                      {csvHeaders.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              })}
            </div>

            <div className="mt-5 flex justify-between border-t border-[#EEF2F7] pt-4">
              <button
                onClick={() => setStep('upload')}
                className="rounded-lg border border-[#DCE4F0] px-4 py-2 text-xs font-semibold text-[#64748B]"
              >
                ‹ Back to Upload
              </button>
              <button
                onClick={proceedToPreview}
                className="rounded-lg bg-[#172554] px-5 py-2 text-xs font-semibold text-white hover:bg-[#1E3A8A]"
              >
                Next: Review & Filter Table ›
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SORTABLE PREVIEW & STAGING TABLE */}
        {step === 'preview' && (
          <div className="p-6 overflow-hidden flex-1 flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-sm font-semibold text-[#1E293B]">
                  Review & Check Staged Records ({selectedIndices.size} of {mappedRecords.length} checked)
                </h3>
                <p className="text-[9px] text-[#64748B]">
                  Click any column heading to sort. Uncheck any row to exclude it from the global import.
                </p>
              </div>
              <input
                type="text"
                value={previewSearch}
                onChange={(e) => setPreviewSearch(e.target.value)}
                placeholder="Search staged rows..."
                className="rounded-lg border border-[#DCE4F0] px-3 py-1.5 text-xs outline-none focus:border-[#2563EB]"
              />
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto rounded-lg border border-[#DCE4F0] bg-white max-h-[50vh]">
              <table className="w-full text-left text-[9px] border-collapse">
                <thead className="sticky top-0 bg-[#F8FAFD] border-b border-[#DCE4F0] text-[8px] font-bold uppercase tracking-wider text-[#64748B] z-10">
                  <tr>
                    <th className="p-2 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIndices.size === filteredAndSortedRecords.length && filteredAndSortedRecords.length > 0}
                        onChange={toggleSelectAll}
                        className="h-3.5 w-3.5 rounded border-[#CBD5E1] text-[#2563EB]"
                      />
                    </th>
                    <th className="p-2 cursor-pointer hover:text-[#2563EB]" onClick={() => toggleSort('Application Reference')}>
                      Ref {sortField === 'Application Reference' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th className="p-2 cursor-pointer hover:text-[#2563EB]" onClick={() => toggleSort('Heading')}>
                      Title / Proposal {sortField === 'Heading' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th className="p-2 cursor-pointer hover:text-[#2563EB]" onClick={() => toggleSort('Local Authority')}>
                      Council {sortField === 'Local Authority' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th className="p-2 cursor-pointer hover:text-[#2563EB]" onClick={() => toggleSort('£m Value To')}>
                      Value {sortField === '£m Value To' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th className="p-2 cursor-pointer hover:text-[#2563EB]" onClick={() => toggleSort('Architect Agent Contact')}>
                      Architect / Contact {sortField === 'Architect Agent Contact' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th className="p-2 cursor-pointer hover:text-[#2563EB]" onClick={() => toggleSort('Architect Agent Email')}>
                      Email {sortField === 'Architect Agent Email' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedRecords.map((row) => {
                    const idx = Number(row._originalIndex)
                    const isChecked = selectedIndices.has(idx)
                    return (
                      <tr
                        key={idx}
                        onClick={() => {
                          setSelectedIndices((prev) => {
                            const next = new Set(prev)
                            if (next.has(idx)) next.delete(idx)
                            else next.add(idx)
                            return next
                          })
                        }}
                        className={`border-b border-[#F1F5F9] cursor-pointer hover:bg-[#F8FAFD] ${
                          isChecked ? 'bg-[#FAFBFD]' : 'opacity-40 bg-[#F1F5F9]'
                        }`}
                      >
                        <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setSelectedIndices((prev) => {
                                const next = new Set(prev)
                                if (next.has(idx)) next.delete(idx)
                                else next.add(idx)
                                return next
                              })
                            }}
                            className="h-3.5 w-3.5 rounded border-[#CBD5E1] text-[#2563EB]"
                          />
                        </td>
                        <td className="p-2 font-mono font-semibold text-[#1E293B]">{row['Application Reference'] || '—'}</td>
                        <td className="p-2 max-w-[200px] truncate" title={row.Proposal || row.Heading}>
                          <div className="font-semibold text-[#1E293B] truncate">{row.Heading || '—'}</div>
                          <div className="text-[7px] text-[#94A3B8] truncate">{row.Proposal}</div>
                        </td>
                        <td className="p-2 text-[#52627A] truncate max-w-[120px]">{row['Local Authority'] || '—'}</td>
                        <td className="p-2 font-semibold text-[#334155]">{row['£m Value To'] ? `£${row['£m Value To']}m` : '—'}</td>
                        <td className="p-2 text-[#52627A] truncate max-w-[120px]">{row['Architect Agent Contact'] || row['Architect Agent'] || '—'}</td>
                        <td className="p-2 text-[#2563EB] truncate max-w-[140px]">{row['Architect Agent Email'] || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="mt-4 flex items-center justify-between border-t border-[#EEF2F7] pt-3">
              <button
                onClick={() => setStep('mapping')}
                className="rounded-lg border border-[#DCE4F0] px-4 py-2 text-xs font-semibold text-[#64748B]"
              >
                ‹ Adjust Mapping
              </button>
              <button
                disabled={isSubmitting || selectedIndices.size === 0}
                onClick={handleCommitToGlobal}
                className="flex items-center gap-2 rounded-lg bg-[#172554] px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50 hover:bg-[#1E3A8A] shadow-sm"
              >
                <Icon name="plus" size={13} />
                {isSubmitting
                  ? 'Adding to Global Database...'
                  : `Add ${selectedIndices.size} Checked to Global Database`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


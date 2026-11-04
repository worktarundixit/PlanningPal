import { useEffect, useState } from 'react'
import type { Scheme } from '@planningpal/shared'
import { EmptyState } from '../components/EmptyState'
import { Icon, type IconName } from '../components/Icon'
import { PageIntro } from '../components/PageIntro'
import { api, type Campaign, type ContactGroup, type ContactGroupMember } from '../lib/api'
import { notify } from '../lib/notify'
import type { BoardCard } from '../types'

export function Contacts({
  data,
  embedded = false,
  crmCards = [],
  onCrmAction,
}: {
  data: Scheme[]
  embedded?: boolean
  crmCards?: BoardCard[]
  onCrmAction?: (type: 'email' | 'call' | 'task' | 'note', card: BoardCard) => void
}) {
  const [mainTab, setMainTab] = useState<'contacts' | 'groups'>('contacts')
  const [filter, setFilter] = useState('All')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [selectedContactIndices, setSelectedContactIndices] = useState<Set<number>>(new Set())

  // Groups state
  const [groups, setGroups] = useState<ContactGroup[]>([])
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [newGroupModal, setNewGroupModal] = useState<{ open: boolean; name: string; description: string; withSelectedContacts?: boolean }>({
    open: false,
    name: '',
    description: '',
    withSelectedContacts: false,
  })
  const [activeGroupMembers, setActiveGroupMembers] = useState<{ group: ContactGroup; members: ContactGroupMember[] } | null>(null)
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)

  // Campaign push modal
  const [campaignPushModal, setCampaignPushModal] = useState<{ open: boolean; groupId?: string; contacts?: Array<{ email: string; name: string; firm: string }> } | null>(null)
  const [campaignsList, setCampaignsList] = useState<Campaign[]>([])
  const [targetCampaignId, setTargetCampaignId] = useState<string>('')
  const [isPushingToCampaign, setIsPushingToCampaign] = useState(false)

  // Add to existing group modal
  const [addToExistingGroupModal, setAddToExistingGroupModal] = useState<boolean>(false)
  const [selectedTargetGroupId, setSelectedTargetGroupId] = useState<string>('')

  const contacts = data.filter((scheme) => scheme.architect !== 'Contact not published').slice(0, 50).map((scheme, index) => ({
    scheme,
    crm: crmCards.find((card) => card.person === scheme.architect) ?? crmCards[index % Math.max(crmCards.length, 1)],
    index,
    confidence: scheme.email && scheme.phone ? 'Verified direct' : 'Studio match',
  }))

  const [selectedContact, setSelectedContact] = useState<(typeof contacts)[number] | null>(null)

  const loadGroups = () => {
    setIsLoadingGroups(true)
    api.contactGroups()
      .then((res) => {
        setGroups(res.data)
        if (res.data.length > 0 && !selectedTargetGroupId) {
          setSelectedTargetGroupId(res.data[0].id)
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingGroups(false))
  }

  useEffect(() => {
    loadGroups()
  }, [])

  const matchesFilter = (contact: (typeof contacts)[number]) =>
    filter === 'All' ||
    (filter === 'Direct' && contact.confidence === 'Verified direct') ||
    (filter === 'Studio match' && contact.confidence === 'Studio match') ||
    (filter === 'High intent' && (contact.crm?.opens ?? 0) >= 3)

  const filteredContacts = contacts.filter(matchesFilter)

  const crmFor = (contact: (typeof contacts)[number]): BoardCard =>
    contact.crm ?? {
      id: `contact-${contact.index}`,
      person: contact.scheme.architect,
      firm: contact.scheme.practice,
      scheme: contact.scheme.title,
      schemeId: contact.scheme.id,
      value: contact.scheme.value,
      opens: 0,
      stage: 0,
      assignee: 'Unassigned',
    }

  const handleSelectAll = () => {
    if (selectedContactIndices.size === filteredContacts.length) {
      setSelectedContactIndices(new Set())
    } else {
      setSelectedContactIndices(new Set(filteredContacts.map((c) => c.index)))
    }
  }

  const getSelectedContactObjects = () => {
    return contacts
      .filter((c) => selectedContactIndices.has(c.index))
      .map((c) => {
        const parts = c.scheme.architect.split(' ')
        return {
          email: c.scheme.email || `${c.scheme.architect.toLowerCase().replace(/[^a-z0-9]/g, '.')}@${(c.scheme.practice || 'studio').toLowerCase().replace(/[^a-z0-9]/g, '')}.co.uk`,
          firstName: parts[0] || '',
          lastName: parts.slice(1).join(' ') || '',
          company: c.scheme.practice || '',
          title: 'Architect',
          phone: c.scheme.phone || '',
          council: c.scheme.council || '',
          schemeTitle: c.scheme.title || '',
          schemeRef: c.scheme.id || '',
        }
      })
  }

  const handleCreateGroup = async () => {
    if (!newGroupModal.name.trim()) {
      notify('Please enter a group name')
      return
    }
    try {
      const created = await api.createContactGroup({
        name: newGroupModal.name.trim(),
        description: newGroupModal.description.trim(),
      })
      if (newGroupModal.withSelectedContacts && selectedContactIndices.size > 0) {
        const members = getSelectedContactObjects()
        await api.addContactGroupMembers(created.id, members)
        notify(`Created group "${created.name}" with ${members.length} contacts!`)
        setSelectedContactIndices(new Set())
      } else {
        notify(`Group "${created.name}" created!`)
      }
      setNewGroupModal({ open: false, name: '', description: '', withSelectedContacts: false })
      loadGroups()
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Could not create group')
    }
  }

  const handleAddToExistingGroup = async () => {
    if (!selectedTargetGroupId) {
      notify('Please select a target group')
      return
    }
    const members = getSelectedContactObjects()
    if (!members.length) return
    try {
      const result = await api.addContactGroupMembers(selectedTargetGroupId, members)
      const targetGroup = groups.find((g) => g.id === selectedTargetGroupId)
      notify(`Added ${result.added} contact${result.added === 1 ? '' : 's'} to "${targetGroup?.name || 'group'}"!`)
      setSelectedContactIndices(new Set())
      setAddToExistingGroupModal(false)
      loadGroups()
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Could not add contacts to group')
    }
  }

  const openCampaignPush = async (groupId?: string) => {
    try {
      const res = await api.campaigns()
      setCampaignsList(res.data)
      if (res.data.length > 0) {
        setTargetCampaignId(res.data[0].id)
      }
      if (groupId) {
        setCampaignPushModal({ open: true, groupId })
      } else {
        const selected = getSelectedContactObjects().map((c) => ({ email: c.email, name: `${c.firstName} ${c.lastName}`.trim(), firm: c.company }))
        setCampaignPushModal({ open: true, contacts: selected })
      }
    } catch {
      notify('Could not load campaigns')
    }
  }

  const executeCampaignPush = async () => {
    if (!campaignPushModal || !targetCampaignId) return
    setIsPushingToCampaign(true)
    try {
      if (campaignPushModal.groupId) {
        const result = await api.importGroupToCampaign(targetCampaignId, campaignPushModal.groupId)
        notify(`${result.added} contact${result.added === 1 ? '' : 's'} imported to campaign!`)
      } else if (campaignPushModal.contacts && campaignPushModal.contacts.length > 0) {
        const leads = campaignPushModal.contacts.map((c) => {
          const parts = c.name.split(' ')
          return {
            email: c.email,
            firstName: parts[0] || undefined,
            lastName: parts.slice(1).join(' ') || undefined,
            company: c.firm || undefined,
            title: 'Architect',
          }
        })
        const result = await api.addCampaignLeads(targetCampaignId, leads)
        notify(`${result.added} contact${result.added === 1 ? '' : 's'} added to campaign!`)
        setSelectedContactIndices(new Set())
      }
      setCampaignPushModal(null)
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Could not add contacts to campaign')
    } finally {
      setIsPushingToCampaign(false)
    }
  }

  const viewGroupMembers = async (group: ContactGroup) => {
    setIsLoadingMembers(true)
    try {
      const res = await api.contactGroupMembers(group.id)
      setActiveGroupMembers({ group, members: res.data })
    } catch {
      notify('Could not load group members')
    } finally {
      setIsLoadingMembers(false)
    }
  }

  const deleteGroup = async (groupId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete group "${name}"?`)) return
    try {
      await api.deleteContactGroup(groupId)
      notify(`Group "${name}" deleted`)
      setGroups((prev) => prev.filter((g) => g.id !== groupId))
      if (activeGroupMembers?.group.id === groupId) {
        setActiveGroupMembers(null)
      }
    } catch {
      notify('Could not delete group')
    }
  }

  return (
    <>
      {!embedded && (
        <PageIntro
          eyebrow="Enriched decision-makers"
          title="Contacts"
          description="Corporate B2B contacts resolved through Companies House, domain matching, MX checks and SMTP verification."
        />
      )}

      {/* Main Tabs Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
        <div className="flex rounded-lg border border-[#DCE4F0] bg-white p-1">
          <button
            onClick={() => setMainTab('contacts')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-[10px] font-semibold transition ${
              mainTab === 'contacts' ? 'bg-[#172554] text-white shadow-sm' : 'text-[#64748B] hover:text-[#172554]'
            }`}
          >
            <Icon name="users" size={13} /> Decision-makers ({contacts.length})
          </button>
          <button
            onClick={() => setMainTab('groups')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-[10px] font-semibold transition ${
              mainTab === 'groups' ? 'bg-[#172554] text-white shadow-sm' : 'text-[#64748B] hover:text-[#172554]'
            }`}
          >
            <Icon name="folder" size={13} /> Contact Groups ({groups.length})
          </button>
        </div>

        {mainTab === 'groups' && (
          <button
            onClick={() => setNewGroupModal({ open: true, name: '', description: '', withSelectedContacts: false })}
            className="flex items-center gap-1.5 rounded-lg bg-[#172554] px-3.5 py-2 text-[9px] font-semibold text-white shadow-sm hover:bg-[#1E3A8A]"
          >
            <Icon name="plus" size={12} /> New Contact Group
          </button>
        )}
      </div>

      {/* TAB 1: CONTACTS */}
      {mainTab === 'contacts' && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {['All', 'Direct', 'Studio match', 'High intent'].map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`rounded-full px-3 py-1.5 text-[9px] font-semibold ${
                    filter === item ? 'bg-[#172554] text-white' : 'border border-[#DCE4F0] bg-white text-[#64748B]'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            {filteredContacts.length > 0 && (
              <button onClick={handleSelectAll} className="text-[9px] font-semibold text-[#2563EB] hover:underline">
                {selectedContactIndices.size === filteredContacts.length ? 'Deselect all' : 'Select all'}
              </button>
            )}
          </div>

          {/* Bulk Selection Bar */}
          {selectedContactIndices.size > 0 && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-2.5 shadow-sm">
              <span className="text-[10px] font-semibold text-[#1D4ED8]">
                {selectedContactIndices.size} contact{selectedContactIndices.size === 1 ? '' : 's'} selected
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setNewGroupModal({ open: true, name: '', description: '', withSelectedContacts: true })}
                  className="flex items-center gap-1.5 rounded-lg bg-[#172554] px-3 py-1.5 text-[8px] font-semibold text-white shadow-sm"
                >
                  <Icon name="folder" size={11} /> Save as New Group
                </button>
                {groups.length > 0 && (
                  <button
                    onClick={() => setAddToExistingGroupModal(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-[#BFDBFE] bg-white px-3 py-1.5 text-[8px] font-semibold text-[#1D4ED8] shadow-sm"
                  >
                    Add to Existing Group
                  </button>
                )}
                <button
                  onClick={() => openCampaignPush()}
                  className="flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-3 py-1.5 text-[8px] font-semibold text-white shadow-sm"
                >
                  <Icon name="send" size={11} /> Add to Campaign
                </button>
                <button
                  onClick={() => setSelectedContactIndices(new Set())}
                  className="rounded-lg p-1 text-[#64748B] hover:bg-white"
                  title="Clear selection"
                >
                  <Icon name="close" size={12} />
                </button>
              </div>
            </div>
          )}

          {contacts.length === 0 && <EmptyState icon="users" title="No decision-maker contacts yet." />}
          {contacts.length > 0 && filteredContacts.length === 0 && (
            <EmptyState kind="filtered" icon="filter" title="No contacts match this filter." action={{ label: 'Clear filter', onClick: () => setFilter('All') }} />
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredContacts.map((contact) => {
              const card = crmFor(contact)
              const isSelected = selectedContactIndices.has(contact.index)
              return (
                <article
                  onClick={() => setSelectedContact(contact)}
                  key={`${contact.scheme.id}-${contact.index}`}
                  className={`flex min-h-[270px] cursor-pointer flex-col rounded-xl border p-5 transition hover:-translate-y-0.5 hover:shadow-lg ${
                    isSelected ? 'border-[#2563EB] bg-[#F8FAFF] shadow-[0_0_0_1px_#2563EB]' : 'border-[#DCE4F0] bg-white shadow-[0_1px_2px_rgba(30,58,138,0.04)] hover:border-[#93C5FD]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation()
                          setSelectedContactIndices((prev) => {
                            const next = new Set(prev)
                            if (next.has(contact.index)) next.delete(contact.index)
                            else next.add(contact.index)
                            return next
                          })
                        }}
                        className="h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB]"
                      />
                      <div
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                          contact.index % 3 === 0
                            ? 'bg-[#DBEAFE] text-[#1D4ED8]'
                            : contact.index % 3 === 1
                            ? 'bg-[#FCE7F3] text-[#9D174D]'
                            : 'bg-[#EDE9FE] text-[#6D28D9]'
                        } text-[10px] font-bold`}
                      >
                        {contact.scheme.architect.split(' ').map((name) => name[0]).join('').slice(0, 2)}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[8px] font-bold ${
                        contact.confidence === 'Verified direct' ? 'bg-[#ECFDF5] text-[#15803D]' : 'bg-[#FFFBEB] text-[#A16207]'
                      }`}
                    >
                      <i className={`h-1.5 w-1.5 rounded-full ${contact.confidence === 'Verified direct' ? 'bg-[#4ADE80]' : 'bg-[#FACC15]'}`} />
                      {contact.confidence}
                    </span>
                  </div>
                  <div className="mt-3">
                    <h3 className="font-display text-[14px] font-semibold text-[#1E293B]">{contact.scheme.architect}</h3>
                    <p className="mt-0.5 text-[9px] text-[#64748B]">Planning contact · {contact.scheme.practice}</p>
                  </div>
                  <div className="mt-3 rounded-lg bg-[#F8FAFD] p-2.5">
                    <div className="text-[7px] font-bold uppercase tracking-wider text-[#94A3B8]">Related approved scheme</div>
                    <div className="mt-1 line-clamp-2 text-[8px] font-medium leading-relaxed text-[#52627A]">{contact.scheme.title}</div>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-[8px]">
                    <span className="text-[#94A3B8]">Last engagement</span>
                    <span className={`font-semibold ${card.opens >= 3 ? 'text-[#C2410C]' : 'text-[#52627A]'}`}>
                      {card.opens ? `${card.opens} opens · ${card.opens >= 3 ? 'High intent' : 'Active'}` : 'No outreach yet'}
                    </span>
                  </div>
                  <div className="mt-auto grid grid-cols-3 gap-2 border-t border-[#EEF2F7] pt-3">
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        onCrmAction?.('email', card)
                      }}
                      className="flex items-center justify-center gap-1 rounded-lg bg-[#172554] py-2 text-[8px] font-semibold text-white"
                    >
                      <Icon name="mail" size={10} /> Email
                    </button>
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        onCrmAction?.('call', card)
                      }}
                      className="flex items-center justify-center gap-1 rounded-lg border border-[#BFDBFE] py-2 text-[8px] font-semibold text-[#2563EB]"
                    >
                      <Icon name="phone" size={10} /> Call
                    </button>
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        setSelectedContact(contact)
                      }}
                      className="flex items-center justify-center gap-1 rounded-lg bg-[#F1F5F9] py-2 text-[8px] font-semibold text-[#52627A]"
                    >
                      Details <Icon name="arrow" size={9} />
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}

      {/* TAB 2: CONTACT GROUPS */}
      {mainTab === 'groups' && (
        <div>
          {isLoadingGroups && <div className="p-8 text-center text-[10px] text-[#64748B]">Loading contact groups...</div>}
          {!isLoadingGroups && groups.length === 0 && (
            <EmptyState
              icon="folder"
              title="No contact groups created yet."
              action={{
                label: 'Create your first group',
                onClick: () => setNewGroupModal({ open: true, name: '', description: '', withSelectedContacts: false }),
              }}
            />
          )}
          {!isLoadingGroups && groups.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => (
                <div key={group.id} className="flex flex-col rounded-xl border border-[#DCE4F0] bg-white p-5 shadow-sm transition hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-[14px] font-semibold text-[#1E293B]">{group.name}</h3>
                      <p className="mt-1 text-[9px] text-[#64748B] line-clamp-2">{group.description || 'No description provided'}</p>
                    </div>
                    <span className="rounded-full bg-[#EFF6FF] px-2.5 py-1 text-[8px] font-bold text-[#1D4ED8]">
                      {group.memberCount} contact{group.memberCount === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="mt-4 text-[7px] text-[#94A3B8]">
                    Created {new Date(group.createdAt).toLocaleDateString('en-GB')}
                  </div>

                  <div className="mt-auto grid grid-cols-3 gap-2 border-t border-[#EEF2F7] pt-4">
                    <button
                      onClick={() => viewGroupMembers(group)}
                      className="flex items-center justify-center gap-1 rounded-lg bg-[#F1F5F9] py-2 text-[8px] font-semibold text-[#52627A] hover:bg-[#E2E8F0]"
                    >
                      <Icon name="users" size={10} /> View
                    </button>
                    <button
                      onClick={() => openCampaignPush(group.id)}
                      className="flex items-center justify-center gap-1 rounded-lg bg-[#172554] py-2 text-[8px] font-semibold text-white hover:bg-[#1E3A8A]"
                    >
                      <Icon name="send" size={10} /> Campaign
                    </button>
                    <button
                      onClick={() => deleteGroup(group.id, group.name)}
                      className="flex items-center justify-center gap-1 rounded-lg border border-[#FCA5A5] py-2 text-[8px] font-semibold text-[#DC2626] hover:bg-[#FEF2F2]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE NEW GROUP MODAL */}
      {newGroupModal.open && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-[#0F172A]/55 p-4" onMouseDown={() => setNewGroupModal({ ...newGroupModal, open: false })}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-[#2563EB]">Contact Management</div>
                <h3 className="mt-1 font-display text-lg font-semibold">
                  {newGroupModal.withSelectedContacts ? `Save ${selectedContactIndices.size} Contacts to Group` : 'Create Contact Group'}
                </h3>
              </div>
              <button onClick={() => setNewGroupModal({ ...newGroupModal, open: false })} className="text-[#94A3B8]">
                <Icon name="close" size={14} />
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <label className="block text-[8px] font-bold uppercase text-[#64748B]">
                Group Name
                <input
                  type="text"
                  autoFocus
                  value={newGroupModal.name}
                  onChange={(e) => setNewGroupModal({ ...newGroupModal, name: e.target.value })}
                  placeholder="e.g. London Residential Architects, Q4 Target"
                  className="mt-1 w-full rounded-lg border border-[#DCE4F0] px-3 py-2 text-[10px] outline-none focus:border-[#2563EB]"
                />
              </label>
              <label className="block text-[8px] font-bold uppercase text-[#64748B]">
                Description (optional)
                <textarea
                  value={newGroupModal.description}
                  onChange={(e) => setNewGroupModal({ ...newGroupModal, description: e.target.value })}
                  rows={2}
                  placeholder="Notes about these contacts, campaign targets, etc."
                  className="mt-1 w-full resize-none rounded-lg border border-[#DCE4F0] p-2.5 text-[10px] outline-none focus:border-[#2563EB]"
                />
              </label>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setNewGroupModal({ ...newGroupModal, open: false })}
                className="flex-1 rounded-lg border border-[#DCE4F0] py-2 text-[9px] font-semibold text-[#64748B]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                className="flex-1 rounded-lg bg-[#172554] py-2 text-[9px] font-semibold text-white hover:bg-[#1E3A8A]"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD TO EXISTING GROUP MODAL */}
      {addToExistingGroupModal && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-[#0F172A]/55 p-4" onMouseDown={() => setAddToExistingGroupModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-[#2563EB]">Group Membership</div>
                <h3 className="mt-1 font-display text-lg font-semibold">Add {selectedContactIndices.size} Contacts to Group</h3>
              </div>
              <button onClick={() => setAddToExistingGroupModal(false)} className="text-[#94A3B8]">
                <Icon name="close" size={14} />
              </button>
            </div>
            <div className="mt-4">
              <label className="block text-[8px] font-bold uppercase text-[#64748B]">
                Select Target Group
                <select
                  value={selectedTargetGroupId}
                  onChange={(e) => setSelectedTargetGroupId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#DCE4F0] bg-white px-3 py-2 text-[10px] outline-none"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.memberCount} members)
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setAddToExistingGroupModal(false)}
                className="flex-1 rounded-lg border border-[#DCE4F0] py-2 text-[9px] font-semibold text-[#64748B]"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToExistingGroup}
                className="flex-1 rounded-lg bg-[#172554] py-2 text-[9px] font-semibold text-white hover:bg-[#1E3A8A]"
              >
                Add Contacts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PUSH TO CAMPAIGN MODAL */}
      {campaignPushModal?.open && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-[#0F172A]/55 p-4" onMouseDown={() => setCampaignPushModal(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-[#2563EB]">Outbound Outreach</div>
                <h3 className="mt-1 font-display text-lg font-semibold">Add to Campaign</h3>
                <p className="mt-1 text-[8px] text-[#64748B]">
                  Contacts will be added to the selected campaign and synced to your email sending engine.
                </p>
              </div>
              <button onClick={() => setCampaignPushModal(null)} className="text-[#94A3B8]">
                <Icon name="close" size={14} />
              </button>
            </div>
            <div className="mt-4">
              {campaignsList.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#CBD5E1] p-4 text-center text-[9px] text-[#64748B]">
                  No campaigns found. Please create a campaign in the Campaigns section first.
                </div>
              ) : (
                <label className="block text-[8px] font-bold uppercase text-[#64748B]">
                  Select Campaign
                  <select
                    value={targetCampaignId}
                    onChange={(e) => setTargetCampaignId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#DCE4F0] bg-white px-3 py-2 text-[10px] outline-none"
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
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setCampaignPushModal(null)}
                className="flex-1 rounded-lg border border-[#DCE4F0] py-2 text-[9px] font-semibold text-[#64748B]"
              >
                Cancel
              </button>
              <button
                disabled={isPushingToCampaign || !targetCampaignId || campaignsList.length === 0}
                onClick={executeCampaignPush}
                className="flex-1 rounded-lg bg-[#172554] py-2 text-[9px] font-semibold text-white disabled:opacity-50 hover:bg-[#1E3A8A]"
              >
                {isPushingToCampaign ? 'Adding...' : 'Add to Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW GROUP MEMBERS DRAWER / MODAL */}
      {activeGroupMembers && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-[#0F172A]/55 p-4" onMouseDown={() => setActiveGroupMembers(null)}>
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-[#2563EB]">Contact Group</div>
                <h3 className="mt-1 font-display text-lg font-semibold">{activeGroupMembers.group.name}</h3>
                <p className="text-[9px] text-[#64748B]">{activeGroupMembers.members.length} contacts saved in this group</p>
              </div>
              <button onClick={() => setActiveGroupMembers(null)} className="text-[#94A3B8]">
                <Icon name="close" size={14} />
              </button>
            </div>

            <div className="mt-3 flex-1 overflow-y-auto">
              {isLoadingMembers ? (
                <div className="p-6 text-center text-[10px] text-[#64748B]">Loading members...</div>
              ) : activeGroupMembers.members.length === 0 ? (
                <div className="p-8 text-center text-[9px] text-[#94A3B8]">This group has no contacts yet.</div>
              ) : (
                <table className="w-full text-left text-[9px]">
                  <thead>
                    <tr className="border-b border-[#F1F5F9] text-[8px] font-bold uppercase tracking-wider text-[#94A3B8]">
                      <th className="py-2">Contact</th>
                      <th className="py-2">Practice</th>
                      <th className="py-2">Email</th>
                      <th className="py-2">Council</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeGroupMembers.members.map((m) => (
                      <tr key={m.id} className="border-b border-[#F8FAFD] hover:bg-[#F8FAFD]">
                        <td className="py-2.5 font-semibold text-[#1E293B]">{m.firstName || m.lastName ? `${m.firstName} ${m.lastName}`.trim() : 'Contact'}</td>
                        <td className="py-2.5 text-[#64748B]">{m.company || '—'}</td>
                        <td className="py-2.5 text-[#2563EB]">{m.email}</td>
                        <td className="py-2.5 text-[#64748B]">{m.council || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="mt-4 flex justify-between border-t border-[#EEF2F7] pt-3">
              <button
                onClick={() => {
                  const gId = activeGroupMembers.group.id
                  setActiveGroupMembers(null)
                  openCampaignPush(gId)
                }}
                className="flex items-center gap-1.5 rounded-lg bg-[#172554] px-4 py-2 text-[9px] font-semibold text-white"
              >
                <Icon name="send" size={11} /> Import Group to Campaign
              </button>
              <button
                onClick={() => setActiveGroupMembers(null)}
                className="rounded-lg border border-[#DCE4F0] px-4 py-2 text-[9px] font-semibold text-[#64748B]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SELECTED CONTACT DETAIL DRAWER */}
      {selectedContact && (() => {
        const scheme = selectedContact.scheme
        const card = crmFor(selectedContact)
        const stageNames = ['New lead', 'Active outreach', 'High intent', 'Warm engagement', 'Tender opportunity']
        const history = [
          { icon: 'users' as IconName, title: 'Contact enriched', detail: `${selectedContact.confidence} · PlanningPal enrichment`, time: scheme.date },
          ...(card.stage >= 1 ? [{ icon: 'send' as IconName, title: 'ECI introduction sent', detail: `Campaign sequence started by ${card.assignee}`, time: '7 days ago' }] : []),
          ...(card.opens > 0 ? [{ icon: 'mail' as IconName, title: `Email opened ${card.opens} time${card.opens === 1 ? '' : 's'}`, detail: card.opens >= 3 ? 'High-intent threshold reached' : 'Engagement recorded', time: '2 hours ago' }] : []),
          ...(card.opens >= 5 ? [{ icon: 'external' as IconName, title: 'Capability deck viewed', detail: 'Portfolio link clicked from campaign email', time: '48 minutes ago' }] : []),
        ]
        return (
          <div className="fixed inset-0 z-[75] flex justify-end bg-[#0F172A]/55 backdrop-blur-[2px]" onMouseDown={() => setSelectedContact(null)}>
            <aside className="h-full w-full max-w-[580px] overflow-y-auto bg-[#F7F9FC] shadow-2xl animate-slide-in" onMouseDown={(event) => event.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#DCE4F0] bg-[#F7F9FC]/95 px-6 py-4 backdrop-blur">
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#2563EB]">CRM contact record</div>
                  <div className="mt-1 text-[9px] text-[#94A3B8]">Synced across Contacts, Intent and Pipeline</div>
                </div>
                <button onClick={() => setSelectedContact(null)} className="grid h-9 w-9 place-items-center rounded-full border border-[#DCE4F0] bg-white text-[#64748B]">
                  <Icon name="close" size={15} />
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#DBEAFE] text-[12px] font-bold text-[#1D4ED8]">
                    {scheme.architect.split(' ').map((name) => name[0]).join('').slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-[22px] font-semibold tracking-[-0.03em]">{scheme.architect}</h2>
                    <p className="mt-1 text-[10px] text-[#64748B]">Planning contact · {scheme.practice}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#ECFDF5] px-2.5 py-1 text-[8px] font-bold text-[#15803D]">{selectedContact.confidence}</span>
                      <span className="rounded-full bg-[#EFF6FF] px-2.5 py-1 text-[8px] font-bold text-[#1D4ED8]">{stageNames[card.stage]}</span>
                      {card.opens >= 3 && <span className="rounded-full bg-[#FFF7ED] px-2.5 py-1 text-[8px] font-bold text-[#C2410C]">High intent · {card.opens} opens</span>}
                    </div>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    [scheme.date, 'Added on'],
                    ['PlanningPal', 'Added by'],
                    [card.assignee, 'Assigned to'],
                    [card.opens ? '2 hours ago' : 'No activity', 'Last engagement'],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-lg border border-[#DCE4F0] bg-white p-3">
                      <div className="truncate text-[9px] font-semibold text-[#334155]">{value}</div>
                      <div className="mt-1 text-[7px] uppercase tracking-wider text-[#94A3B8]">{label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  <button onClick={() => onCrmAction?.('email', card)} className="flex items-center justify-center gap-2 rounded-lg bg-[#172554] py-3 text-[9px] font-semibold text-white">
                    <Icon name="mail" size={13} /> Compose email
                  </button>
                  <button onClick={() => onCrmAction?.('call', card)} className="flex items-center justify-center gap-2 rounded-lg border border-[#BFDBFE] bg-white py-3 text-[9px] font-semibold text-[#2563EB]">
                    <Icon name="phone" size={13} /> Log a call
                  </button>
                  <button onClick={() => onCrmAction?.('task', card)} className="flex items-center justify-center gap-2 rounded-lg border border-[#DCE4F0] bg-white py-3 text-[9px] font-semibold text-[#52627A]">
                    <Icon name="calendar" size={13} /> Add follow-up
                  </button>
                  <button onClick={() => onCrmAction?.('note', card)} className="flex items-center justify-center gap-2 rounded-lg border border-[#DCE4F0] bg-white py-3 text-[9px] font-semibold text-[#52627A]">
                    <Icon name="note" size={13} /> Add CRM note
                  </button>
                </div>
                <section className="mt-7">
                  <div className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#64748B]">Contact details</div>
                  <div className="mt-3 rounded-xl border border-[#DCE4F0] bg-white p-4">
                    {[
                      ['Email', scheme.email || 'Not published'],
                      ['Phone', scheme.phone || 'Not published'],
                      ['Office', scheme.architectAddress || 'Not published'],
                      ['Related scheme', `${scheme.title} · ${scheme.id}`],
                    ].map(([label, value]) => (
                      <div key={label} className="grid grid-cols-[90px_1fr] gap-3 border-b border-[#EEF2F7] py-2.5 text-[9px] last:border-0">
                        <span className="text-[#94A3B8]">{label}</span>
                        <span className="break-words font-medium text-[#52627A]">{value}</span>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="mt-7">
                  <div className="flex items-center justify-between">
                    <div className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#64748B]">Reachout history</div>
                    <span className="text-[8px] text-[#94A3B8]">{history.length} activities</span>
                  </div>
                  <div className="mt-3 rounded-xl border border-[#DCE4F0] bg-white p-4">
                    {history.map((event, index) => (
                      <div key={`${event.title}-${index}`} className="relative flex gap-3 pb-5 last:pb-0">
                        <div className="relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#EFF6FF] text-[#2563EB]">
                          <Icon name={event.icon} size={11} />
                        </div>
                        {index < history.length - 1 && <div className="absolute left-3.5 top-7 h-[calc(100%-20px)] w-px bg-[#E2E8F0]" />}
                        <div className="flex-1">
                          <div className="text-[9px] font-semibold text-[#334155]">{event.title}</div>
                          <div className="mt-1 text-[8px] text-[#94A3B8]">{event.detail}</div>
                        </div>
                        <div className="text-[7px] text-[#94A3B8]">{event.time}</div>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="mt-7">
                  <div className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#64748B]">Internal note</div>
                  <textarea
                    value={notes[scheme.id] || ''}
                    onChange={(event) => setNotes((items) => ({ ...items, [scheme.id]: event.target.value }))}
                    rows={4}
                    className="mt-3 w-full resize-none rounded-xl border border-[#DCE4F0] bg-white p-4 text-[10px] leading-relaxed text-[#52627A] outline-none focus:border-[#2563EB]"
                    placeholder="Add context, objections or next steps for your team…"
                  />
                  <button onClick={() => notify(`Note saved for ${scheme.architect}`)} className="mt-2 rounded-lg bg-[#172554] px-4 py-2.5 text-[9px] font-semibold text-white">
                    Save note
                  </button>
                </section>
              </div>
            </aside>
          </div>
        )
      })()}
    </>
  )
}

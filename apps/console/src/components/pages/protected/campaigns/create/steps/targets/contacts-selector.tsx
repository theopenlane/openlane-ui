'use client'

import React, { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { type ContactWhereInput } from '@repo/codegen/src/schema'
import { useContactsWithFilter } from '@/lib/graphql-hooks/contact'
import { useVendorOptions, VENDOR_ENTITY_TYPE_WHERE } from '@/lib/graphql-hooks/entity'
import { RecipientPicker, type RecipientOption } from './recipient-picker'
import { SelectedTargetsPreview } from './selected-targets-preview'
import { ALL_SCOPE, PICKER_PAGINATION, mergeTargets, removeTarget, toggleTarget, type CampaignTargetEntry } from './target-entry'
import { type TPagination, type TPaginationMeta } from '@repo/ui/pagination-types'

const ANY_VENDOR = 'ANY_VENDOR'

const vendorScopeWhere = (scope: string): ContactWhereInput => {
  if (scope === ALL_SCOPE) return {}
  if (scope === ANY_VENDOR) return { hasEntitiesWith: [VENDOR_ENTITY_TYPE_WHERE] }
  return { hasEntitiesWith: [{ id: scope }] }
}

const toEntry = (option: RecipientOption): CampaignTargetEntry => ({ email: option.email, fullName: option.name, contactID: option.id, source: 'contact' })

interface ContactsSelectorProps {
  targets: CampaignTargetEntry[]
  onTargetsChange: Dispatch<SetStateAction<CampaignTargetEntry[]>>
}

export const ContactsSelector: React.FC<ContactsSelectorProps> = ({ targets, onTargetsChange }) => {
  const [scope, setScope] = useState<string>(ALL_SCOPE)
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState<TPagination>(PICKER_PAGINATION)

  const debouncedSearch = useDebounce(searchText, 300)
  const { vendorOptions } = useVendorOptions()

  const scopeOptions = useMemo(() => [{ label: 'All contacts', value: ALL_SCOPE }, { label: 'All vendor contacts', value: ANY_VENDOR }, ...vendorOptions], [vendorOptions])

  const handleScopeChange = (value: string) => {
    setScope(value)
    setPagination(PICKER_PAGINATION)
  }

  const handleSearchChange = (value: string) => {
    setSearchText(value)
    setPagination(PICKER_PAGINATION)
  }

  const where = useMemo<ContactWhereInput>(
    () => ({
      emailNEQ: '',
      emailNotNil: true,
      ...vendorScopeWhere(scope),
      ...(debouncedSearch.trim() ? { or: [{ fullNameContainsFold: debouncedSearch.trim() }, { emailContainsFold: debouncedSearch.trim() }] } : {}),
    }),
    [scope, debouncedSearch],
  )

  const { contactsNodes, pageInfo, totalCount, isFetching } = useContactsWithFilter({ where, pagination })

  const paginationMeta: TPaginationMeta = { totalCount, pageInfo, isLoading: isFetching }

  const options = useMemo<RecipientOption[]>(
    () => contactsNodes.flatMap((contact) => (contact.email ? [{ id: contact.id, email: contact.email, name: contact.fullName ?? '', meta: contact.company ?? undefined }] : [])),
    [contactsNodes],
  )

  const selectedContacts = useMemo(() => targets.filter((target) => target.source === 'contact'), [targets])

  const handleToggle = useCallback((option: RecipientOption) => onTargetsChange(toggleTarget(targets, toEntry(option))), [targets, onTargetsChange])

  const handleToggleAll = useCallback(
    (pageOptions: RecipientOption[], nextChecked: boolean) => {
      if (nextChecked) {
        onTargetsChange(mergeTargets(targets, pageOptions.map(toEntry)))
      } else {
        const emails = new Set(pageOptions.map((option) => option.email.toLowerCase()))
        onTargetsChange(targets.filter((target) => target.source !== 'contact' || !emails.has(target.email.toLowerCase())))
      }
    },
    [targets, onTargetsChange],
  )

  const handleRemove = useCallback((email: string) => onTargetsChange(removeTarget(targets, email)), [targets, onTargetsChange])

  const handleClear = useCallback(() => onTargetsChange(targets.filter((target) => target.source !== 'contact')), [targets, onTargetsChange])

  return (
    <div className="flex flex-col gap-4">
      <RecipientPicker
        scopeLabel="Vendor"
        scopeValue={scope}
        scopeOptions={scopeOptions}
        onScopeChange={handleScopeChange}
        searchText={searchText}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by name or email..."
        options={options}
        isLoading={isFetching}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={paginationMeta}
        targets={targets}
        onToggle={handleToggle}
        onToggleAll={handleToggleAll}
        emptyLabel="No contacts found."
      />
      <SelectedTargetsPreview title="Selected contacts" targets={selectedContacts} onRemove={handleRemove} onClearAll={handleClear} />
    </div>
  )
}

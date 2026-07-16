'use client'

import React, { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { type ContactWhereInput } from '@repo/codegen/src/schema'
import { useContactsWithFilter, useFetchContacts, type ContactsNodeNonNull } from '@/lib/graphql-hooks/contact'
import { useVendorOptions, VENDOR_ENTITY_TYPE_WHERE } from '@/lib/graphql-hooks/entity'
import { RecipientPicker, type RecipientOption } from './recipient-picker'
import { useBulkAddTargets } from './use-bulk-add-targets'
import { ALL_SCOPE, PICKER_PAGINATION, toggleTarget, type CampaignTargetEntry } from './target-entry'

const ANY_VENDOR = 'ANY_VENDOR'

const vendorScopeWhere = (scope: string): ContactWhereInput => {
  if (scope === ALL_SCOPE) return {}
  if (scope === ANY_VENDOR) return { hasEntitiesWith: [VENDOR_ENTITY_TYPE_WHERE] }
  return { hasEntitiesWith: [{ id: scope }] }
}

const toTargets = (contact: ContactsNodeNonNull): CampaignTargetEntry[] => (contact.email ? [{ email: contact.email, fullName: contact.fullName ?? '', contactID: contact.id, source: 'contact' }] : [])

interface ContactsSelectorProps {
  targets: CampaignTargetEntry[]
  onTargetsChange: Dispatch<SetStateAction<CampaignTargetEntry[]>>
}

export const ContactsSelector: React.FC<ContactsSelectorProps> = ({ targets, onTargetsChange }) => {
  const [scope, setScope] = useState<string>(ALL_SCOPE)
  const [searchText, setSearchText] = useState('')

  const debouncedSearch = useDebounce(searchText, 300)
  const fetchAll = useFetchContacts()
  const { vendorOptions } = useVendorOptions()

  const scopeOptions = useMemo(() => [{ label: 'All contacts', value: ALL_SCOPE }, { label: 'All vendor contacts', value: ANY_VENDOR }, ...vendorOptions], [vendorOptions])

  const where = useMemo<ContactWhereInput>(
    () => ({
      emailNEQ: '',
      emailNotNil: true,
      ...vendorScopeWhere(scope),
      ...(debouncedSearch.trim() ? { or: [{ fullNameContainsFold: debouncedSearch.trim() }, { emailContainsFold: debouncedSearch.trim() }] } : {}),
    }),
    [scope, debouncedSearch],
  )

  const { contactsNodes, totalCount, isLoading } = useContactsWithFilter({ where, pagination: PICKER_PAGINATION })

  const { addAll, isAddingAll } = useBulkAddTargets({ targets, onTargetsChange, where, entityLabel: 'contacts', fetchAll, toTargets })

  const options = useMemo<RecipientOption[]>(
    () => contactsNodes.flatMap((contact) => (contact.email ? [{ id: contact.id, email: contact.email, name: contact.fullName ?? '', meta: contact.company ?? undefined }] : [])),
    [contactsNodes],
  )

  const handleToggle = useCallback(
    (option: RecipientOption) => onTargetsChange(toggleTarget(targets, { email: option.email, fullName: option.name, contactID: option.id, source: 'contact' })),
    [targets, onTargetsChange],
  )

  return (
    <RecipientPicker
      scopeLabel="Vendor"
      scopeValue={scope}
      scopeOptions={scopeOptions}
      onScopeChange={setScope}
      searchText={searchText}
      onSearchChange={setSearchText}
      searchPlaceholder="Search by name or email..."
      options={options}
      isLoading={isLoading}
      totalCount={totalCount}
      targets={targets}
      onToggle={handleToggle}
      onAddAll={addAll}
      isAddingAll={isAddingAll}
      emptyLabel="No contacts found."
    />
  )
}

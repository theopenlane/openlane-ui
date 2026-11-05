'use client'

import React, { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { ContactOrderField, OrderDirection, type ContactOrder, type ContactWhereInput } from '@repo/codegen/src/schema'
import { useFetchAllContacts } from '@/lib/graphql-hooks/contact'
import { emailOrFullNameSearchWhere } from '@/lib/graphql-hooks/identity-holder'
import { useVendorOptions, VENDOR_ENTITY_TYPE_WHERE } from '@/lib/graphql-hooks/entity'
import { RecipientPicker } from './recipient-picker'
import { dedupeRecipientOptions, type RecipientOption } from './recipient-option'
import { SelectedTargetsPreview } from './selected-targets-preview'
import { ALL_FILTER_VALUE, PICKER_PAGINATION, getRecipientDisplayName, mergeTargets, removeTarget, toggleTarget, type CampaignTargetEntry } from './target-entry'
import { normalizeEmail } from '@/lib/validators'
import { sliceByPagination } from '@/utils/pagination'
import { type TPagination, type TPaginationMeta } from '@repo/ui/pagination-types'

const ANY_VENDOR = 'ANY_VENDOR'

const FETCH_PAGE_SIZE = 100

const FETCH_MAX_PAGES = 5

const vendorScopeWhere = (scope: string): ContactWhereInput => {
  if (scope === ALL_FILTER_VALUE) return {}
  if (scope === ANY_VENDOR) return { hasEntitiesWith: [VENDOR_ENTITY_TYPE_WHERE] }
  return { hasEntitiesWith: [{ id: scope }] }
}

const CONTACT_OPTIONS_ORDER: ContactOrder[] = [{ field: ContactOrderField.email, direction: OrderDirection.ASC }]

const toEntry = (option: RecipientOption): CampaignTargetEntry => ({
  email: option.email,
  fullName: getRecipientDisplayName(option.name, option.email),
  contactID: option.id,
  source: 'contact',
})

interface ContactsSelectorProps {
  targets: CampaignTargetEntry[]
  onTargetsChange: Dispatch<SetStateAction<CampaignTargetEntry[]>>
  lockedEmails?: ReadonlySet<string>
}

export const ContactsSelector: React.FC<ContactsSelectorProps> = ({ targets, onTargetsChange, lockedEmails }) => {
  const [scope, setScope] = useState<string>(ALL_FILTER_VALUE)
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState<TPagination>(PICKER_PAGINATION)

  const debouncedSearch = useDebounce(searchText, 300)
  const { vendorOptions } = useVendorOptions()

  const scopeOptions = useMemo(() => [{ label: 'All contacts', value: ALL_FILTER_VALUE }, { label: 'All vendor contacts', value: ANY_VENDOR }, ...vendorOptions], [vendorOptions])

  const resettingPage = (setValue: (value: string) => void) => (value: string) => {
    setValue(value)
    setPagination(PICKER_PAGINATION)
  }

  const where = useMemo<ContactWhereInput>(
    () => ({
      emailNEQ: '',
      emailNotNil: true,
      ...vendorScopeWhere(scope),
      ...(debouncedSearch.trim() ? emailOrFullNameSearchWhere(debouncedSearch.trim()) : {}),
    }),
    [scope, debouncedSearch],
  )

  const { contactsNodes, totalCount, isLoading, isTruncated } = useFetchAllContacts({
    where,
    orderBy: CONTACT_OPTIONS_ORDER,
    pageSize: FETCH_PAGE_SIZE,
    maxPages: FETCH_MAX_PAGES,
  })

  const uniqueOptions = useMemo<RecipientOption[]>(
    () =>
      dedupeRecipientOptions(contactsNodes.flatMap((contact) => (contact.email ? [{ id: contact.id, email: contact.email, name: contact.fullName ?? '', meta: contact.company ?? undefined }] : []))),
    [contactsNodes],
  )

  const pageCount = Math.max(1, Math.ceil(uniqueOptions.length / pagination.pageSize))

  useEffect(() => {
    if (pagination.page > pageCount) {
      setPagination((prev) => ({ ...prev, page: pageCount }))
    }
  }, [pageCount, pagination.page])

  const pageOptions = useMemo(() => sliceByPagination(uniqueOptions, pagination), [uniqueOptions, pagination])

  const paginationMeta: TPaginationMeta = { totalCount: uniqueOptions.length, isLoading }

  const selectedContacts = useMemo(() => targets.filter((target) => target.source === 'contact'), [targets])

  const handleToggle = useCallback((option: RecipientOption) => onTargetsChange((prev) => toggleTarget(prev, toEntry(option))), [onTargetsChange])

  const handleToggleAll = useCallback(
    (optionsOnPage: RecipientOption[], nextChecked: boolean) => {
      const emails = new Set(optionsOnPage.map((option) => normalizeEmail(option.email)))
      onTargetsChange((prev) => (nextChecked ? mergeTargets(prev, optionsOnPage.map(toEntry)) : prev.filter((target) => target.source !== 'contact' || !emails.has(normalizeEmail(target.email)))))
    },
    [onTargetsChange],
  )

  const handleRemove = useCallback((email: string) => onTargetsChange((prev) => removeTarget(prev, email)), [onTargetsChange])

  const handleClear = useCallback(() => onTargetsChange((prev) => prev.filter((target) => target.source !== 'contact')), [onTargetsChange])

  return (
    <div className="flex flex-col gap-4">
      <RecipientPicker
        filters={[{ label: 'Vendor', value: scope, options: scopeOptions, onChange: resettingPage(setScope) }]}
        searchText={searchText}
        onSearchChange={resettingPage(setSearchText)}
        searchPlaceholder="Search by name or email..."
        options={pageOptions}
        isLoading={isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={paginationMeta}
        targets={targets}
        lockedEmails={lockedEmails}
        onToggle={handleToggle}
        onToggleAll={handleToggleAll}
        emptyLabel="No contacts found."
        note={isTruncated ? `Showing ${uniqueOptions.length} unique contacts from the first ${contactsNodes.length} of ${totalCount} matches. Use search to narrow the list.` : undefined}
      />
      <SelectedTargetsPreview title="Selected contacts" targets={selectedContacts} onRemove={handleRemove} onClearAll={handleClear} />
    </div>
  )
}

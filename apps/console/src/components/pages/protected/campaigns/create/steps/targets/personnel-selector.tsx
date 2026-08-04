'use client'

import React, { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { IdentityHolderIdentityHolderType, type IdentityHolderWhereInput } from '@repo/codegen/src/schema'
import { useIdentityHolderOptions } from '@/lib/graphql-hooks/identity-holder'
import { enumToOptions, getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { RecipientPicker } from './recipient-picker'
import { type RecipientOption } from './recipient-option'
import { SelectedTargetsPreview } from './selected-targets-preview'
import { ALL_SCOPE, PICKER_PAGINATION, getRecipientDisplayName, mergeTargets, removeTarget, toggleTarget, type CampaignTargetEntry } from './target-entry'
import { normalizeEmail } from '@/lib/validators'
import { type TPagination } from '@repo/ui/pagination-types'

const scopeOptions = [{ label: 'All personnel', value: ALL_SCOPE }, ...enumToOptions(IdentityHolderIdentityHolderType)]

const toEntry = (option: RecipientOption): CampaignTargetEntry => ({ email: option.email, fullName: getRecipientDisplayName(option.name, option.email), source: 'personnel' })

interface PersonnelSelectorProps {
  targets: CampaignTargetEntry[]
  onTargetsChange: Dispatch<SetStateAction<CampaignTargetEntry[]>>
  lockedEmails?: ReadonlySet<string>
}

export const PersonnelSelector: React.FC<PersonnelSelectorProps> = ({ targets, onTargetsChange, lockedEmails }) => {
  const [scope, setScope] = useState<string>(ALL_SCOPE)
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState<TPagination>(PICKER_PAGINATION)

  const debouncedSearch = useDebounce(searchText, 300)

  const handleScopeChange = (value: string) => {
    setScope(value)
    setPagination(PICKER_PAGINATION)
  }

  const handleSearchChange = (value: string) => {
    setSearchText(value)
    setPagination(PICKER_PAGINATION)
  }

  const where = useMemo<IdentityHolderWhereInput>(
    () => ({
      emailNEQ: '',
      ...(scope !== ALL_SCOPE ? { identityHolderType: scope as IdentityHolderIdentityHolderType } : {}),
      ...(debouncedSearch.trim() ? { or: [{ fullNameContainsFold: debouncedSearch.trim() }, { emailContainsFold: debouncedSearch.trim() }] } : {}),
    }),
    [scope, debouncedSearch],
  )

  const { nodes, isFetching, paginationMeta } = useIdentityHolderOptions({ where, pagination })

  const options = useMemo<RecipientOption[]>(
    () => nodes.flatMap((holder) => (holder.email ? [{ id: holder.id, email: holder.email, name: holder.fullName, meta: getEnumLabel(holder.identityHolderType) }] : [])),
    [nodes],
  )

  const selectedPersonnel = useMemo(() => targets.filter((target) => target.source === 'personnel'), [targets])

  const handleToggle = useCallback((option: RecipientOption) => onTargetsChange((prev) => toggleTarget(prev, toEntry(option))), [onTargetsChange])

  const handleToggleAll = useCallback(
    (optionsOnPage: RecipientOption[], nextChecked: boolean) => {
      const emails = new Set(optionsOnPage.map((option) => normalizeEmail(option.email)))
      onTargetsChange((prev) => (nextChecked ? mergeTargets(prev, optionsOnPage.map(toEntry)) : prev.filter((target) => target.source !== 'personnel' || !emails.has(normalizeEmail(target.email)))))
    },
    [onTargetsChange],
  )

  const handleRemove = useCallback((email: string) => onTargetsChange((prev) => removeTarget(prev, email)), [onTargetsChange])

  const handleClear = useCallback(() => onTargetsChange((prev) => prev.filter((target) => target.source !== 'personnel')), [onTargetsChange])

  return (
    <div className="flex flex-col gap-4">
      <RecipientPicker
        scopeLabel="Personnel type"
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
        lockedEmails={lockedEmails}
        onToggle={handleToggle}
        onToggleAll={handleToggleAll}
        emptyLabel="No personnel found."
      />
      <SelectedTargetsPreview title="Selected personnel" targets={selectedPersonnel} onRemove={handleRemove} onClearAll={handleClear} />
    </div>
  )
}

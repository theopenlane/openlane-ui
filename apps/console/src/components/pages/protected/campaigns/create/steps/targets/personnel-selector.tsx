'use client'

import React, { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { IdentityHolderIdentityHolderType, type IdentityHolderWhereInput } from '@repo/codegen/src/schema'
import { useIdentityHolderOptions, useFetchIdentityHolderOptions, type IdentityHolderOption } from '@/lib/graphql-hooks/identity-holder'
import { enumToOptions, getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { RecipientPicker, type RecipientOption } from './recipient-picker'
import { useBulkAddTargets } from './use-bulk-add-targets'
import { ALL_SCOPE, PICKER_PAGE_SIZE, toggleTarget, type CampaignTargetEntry } from './target-entry'

const scopeOptions = [{ label: 'All personnel', value: ALL_SCOPE }, ...enumToOptions(IdentityHolderIdentityHolderType)]

const toTargets = (holder: IdentityHolderOption): CampaignTargetEntry[] => (holder.email ? [{ email: holder.email, fullName: holder.fullName, source: 'personnel' }] : [])

interface PersonnelSelectorProps {
  targets: CampaignTargetEntry[]
  onTargetsChange: Dispatch<SetStateAction<CampaignTargetEntry[]>>
}

export const PersonnelSelector: React.FC<PersonnelSelectorProps> = ({ targets, onTargetsChange }) => {
  const [scope, setScope] = useState<string>(ALL_SCOPE)
  const [searchText, setSearchText] = useState('')

  const debouncedSearch = useDebounce(searchText, 300)
  const fetchAll = useFetchIdentityHolderOptions()

  const where = useMemo<IdentityHolderWhereInput>(
    () => ({
      emailNEQ: '',
      ...(scope !== ALL_SCOPE ? { identityHolderType: scope as IdentityHolderIdentityHolderType } : {}),
      ...(debouncedSearch.trim() ? { or: [{ fullNameContainsFold: debouncedSearch.trim() }, { emailContainsFold: debouncedSearch.trim() }] } : {}),
    }),
    [scope, debouncedSearch],
  )

  const { nodes, totalCount, isLoading } = useIdentityHolderOptions({ where, first: PICKER_PAGE_SIZE })

  const { addAll, isAddingAll } = useBulkAddTargets({ targets, onTargetsChange, where, entityLabel: 'personnel', fetchAll, toTargets })

  const options = useMemo<RecipientOption[]>(
    () => nodes.flatMap((holder) => (holder.email ? [{ id: holder.id, email: holder.email, name: holder.fullName, meta: getEnumLabel(holder.identityHolderType) }] : [])),
    [nodes],
  )

  const handleToggle = useCallback((option: RecipientOption) => onTargetsChange(toggleTarget(targets, { email: option.email, fullName: option.name, source: 'personnel' })), [targets, onTargetsChange])

  return (
    <RecipientPicker
      scopeLabel="Personnel type"
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
      emptyLabel="No personnel found."
    />
  )
}

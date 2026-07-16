'use client'

import React, { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { IdentityHolderIdentityHolderType, type IdentityHolderWhereInput } from '@repo/codegen/src/schema'
import { useIdentityHolderOptions } from '@/lib/graphql-hooks/identity-holder'
import { enumToOptions, getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { RecipientPicker, type RecipientOption } from './recipient-picker'
import { SelectedTargetsPreview } from './selected-targets-preview'
import { ALL_SCOPE, PICKER_PAGINATION, mergeTargets, removeTarget, toggleTarget, type CampaignTargetEntry } from './target-entry'
import { type TPagination } from '@repo/ui/pagination-types'

const scopeOptions = [{ label: 'All personnel', value: ALL_SCOPE }, ...enumToOptions(IdentityHolderIdentityHolderType)]

const toEntry = (option: RecipientOption): CampaignTargetEntry => ({ email: option.email, fullName: option.name, source: 'personnel' })

interface PersonnelSelectorProps {
  targets: CampaignTargetEntry[]
  onTargetsChange: Dispatch<SetStateAction<CampaignTargetEntry[]>>
}

export const PersonnelSelector: React.FC<PersonnelSelectorProps> = ({ targets, onTargetsChange }) => {
  const [scope, setScope] = useState<string>(ALL_SCOPE)
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState<TPagination>(PICKER_PAGINATION)

  const debouncedSearch = useDebounce(searchText, 300)

  useEffect(() => {
    setPagination(PICKER_PAGINATION)
  }, [scope, debouncedSearch])

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

  const handleToggle = useCallback((option: RecipientOption) => onTargetsChange(toggleTarget(targets, toEntry(option))), [targets, onTargetsChange])

  const handleToggleAll = useCallback(
    (pageOptions: RecipientOption[], nextChecked: boolean) => {
      if (nextChecked) {
        onTargetsChange(mergeTargets(targets, pageOptions.map(toEntry)))
      } else {
        const emails = new Set(pageOptions.map((option) => option.email.toLowerCase()))
        onTargetsChange(targets.filter((target) => target.source !== 'personnel' || !emails.has(target.email.toLowerCase())))
      }
    },
    [targets, onTargetsChange],
  )

  const handleRemove = useCallback((email: string) => onTargetsChange(removeTarget(targets, email)), [targets, onTargetsChange])

  const handleClear = useCallback(() => onTargetsChange(targets.filter((target) => target.source !== 'personnel')), [targets, onTargetsChange])

  return (
    <div className="flex flex-col gap-4">
      <RecipientPicker
        scopeLabel="Personnel type"
        scopeValue={scope}
        scopeOptions={scopeOptions}
        onScopeChange={setScope}
        searchText={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Search by name or email..."
        options={options}
        isLoading={isFetching}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={paginationMeta}
        targets={targets}
        onToggle={handleToggle}
        onToggleAll={handleToggleAll}
        emptyLabel="No personnel found."
      />
      <SelectedTargetsPreview title="Selected personnel" targets={selectedPersonnel} onRemove={handleRemove} onClearAll={handleClear} />
    </div>
  )
}

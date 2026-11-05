'use client'

import React, { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { IdentityHolderIdentityHolderType, IdentityHolderUserStatus, type IdentityHolderWhereInput } from '@repo/codegen/src/schema'
import { emailOrFullNameSearchWhere, useIdentityHolderOptions } from '@/lib/graphql-hooks/identity-holder'
import { enumToOptions, enumValuesToOptions, getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { UserStatusIcon } from '@/components/shared/enum-mapper/user-status-enum'
import { RecipientPicker } from './recipient-picker'
import { type RecipientOption } from './recipient-option'
import { SelectedTargetsPreview } from './selected-targets-preview'
import { ALL_FILTER_VALUE, PICKER_PAGINATION, getRecipientDisplayName, mergeTargets, removeTarget, toggleTarget, type CampaignTargetEntry } from './target-entry'
import { normalizeEmail } from '@/lib/validators'
import { type TPagination } from '@repo/ui/pagination-types'

const scopeOptions = [{ label: 'All personnel', value: ALL_FILTER_VALUE }, ...enumToOptions(IdentityHolderIdentityHolderType)]

const statusOptions = [
  { label: 'All statuses', value: ALL_FILTER_VALUE },
  ...enumValuesToOptions(Object.values(IdentityHolderUserStatus)).map((option) => ({ ...option, icon: <UserStatusIcon status={option.value} /> })),
]

const toEntry = (option: RecipientOption): CampaignTargetEntry => ({ email: option.email, fullName: getRecipientDisplayName(option.name, option.email), source: 'personnel' })

interface PersonnelSelectorProps {
  targets: CampaignTargetEntry[]
  onTargetsChange: Dispatch<SetStateAction<CampaignTargetEntry[]>>
  lockedEmails?: ReadonlySet<string>
}

export const PersonnelSelector: React.FC<PersonnelSelectorProps> = ({ targets, onTargetsChange, lockedEmails }) => {
  const [scope, setScope] = useState<string>(ALL_FILTER_VALUE)
  const [status, setStatus] = useState<string>(IdentityHolderUserStatus.ACTIVE)
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState<TPagination>(PICKER_PAGINATION)

  const debouncedSearch = useDebounce(searchText, 300)

  const resettingPage = (setValue: (value: string) => void) => (value: string) => {
    setValue(value)
    setPagination(PICKER_PAGINATION)
  }

  const where = useMemo<IdentityHolderWhereInput>(
    () => ({
      emailNEQ: '',
      ...(scope !== ALL_FILTER_VALUE ? { identityHolderType: scope as IdentityHolderIdentityHolderType } : {}),
      ...(status !== ALL_FILTER_VALUE ? { status: status as IdentityHolderUserStatus } : {}),
      ...(debouncedSearch.trim() ? emailOrFullNameSearchWhere(debouncedSearch.trim()) : {}),
    }),
    [scope, status, debouncedSearch],
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
        filters={[
          { label: 'Personnel type', value: scope, options: scopeOptions, onChange: resettingPage(setScope) },
          { label: 'Status', value: status, options: statusOptions, onChange: resettingPage(setStatus) },
        ]}
        searchText={searchText}
        onSearchChange={resettingPage(setSearchText)}
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
        emptyLabel={status === ALL_FILTER_VALUE ? 'No personnel found.' : `No ${getEnumLabel(status).toLowerCase()} personnel found. Try All statuses to see everyone.`}
      />
      <SelectedTargetsPreview title="Selected personnel" targets={selectedPersonnel} onRemove={handleRemove} onClearAll={handleClear} />
    </div>
  )
}

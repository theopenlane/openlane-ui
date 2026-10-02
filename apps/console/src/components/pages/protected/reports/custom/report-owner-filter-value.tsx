'use client'

import React, { useMemo, useState } from 'react'
import type { TReportOwnerKind } from '@repo/codegen/src/report-schema.generated'
import { SearchableItemSelect } from '@/components/shared/searchable-item-select/searchable-item-select'
import { ResponsibilityTypeIcon } from '@/components/shared/crud-base/form-fields/responsibility-type-icon'
import { useAsyncCommandSearch } from '@/hooks/useAsyncCommandSearch'
import { useGetGroupNames } from '@/lib/graphql-hooks/group'
import { usePersonnelSelect } from '@/lib/graphql-hooks/identity-holder'
import { useGetOrgMemberships } from '@/lib/graphql-hooks/member'
import { formatList } from '@/utils/strings'
import { fieldOwnerSelections, ownerKinds, ownerSelectionKey, serializeOwnerSelections, type TOwnerFilterField, type TOwnerSelection } from '@/lib/report/report-owner-filters'

type TOwnerItem = { id: string; name: string; selection: TOwnerSelection }

type TReportOwnerFilterValueProps = {
  field: TOwnerFilterField
  value: string
  onChange: (value: string) => void
}

const KIND_LABELS: Record<TReportOwnerKind, string> = { user: 'users', group: 'groups', personnel: 'personnel', string: 'names' }

const toItem = (selection: TOwnerSelection): TOwnerItem => ({ id: ownerSelectionKey(selection), name: selection.displayName || selection.value, selection })

const toItems = (type: TReportOwnerKind, options: { value: string; label: string }[]): TOwnerItem[] => options.map((option) => toItem({ type, value: option.value, displayName: option.label }))

const ReportOwnerFilterValue: React.FC<TReportOwnerFilterValueProps> = ({ field, value, onChange }) => {
  const [open, setOpen] = useState(false)
  const { user, group, personnel, string } = field.owner
  const { setSearchText, term, debouncedTerm, getIsSearching } = useAsyncCommandSearch()

  const { members, isFetching: isFetchingUsers } = useGetOrgMemberships({
    where: debouncedTerm ? { hasUserWith: [{ or: [{ displayNameContainsFold: debouncedTerm }, { emailContainsFold: debouncedTerm }] }] } : undefined,
    enabled: open && !!user,
  })
  const { groups, isFetching: isFetchingGroups } = useGetGroupNames({
    where: debouncedTerm ? { or: [{ displayNameContainsFold: debouncedTerm }, { nameContainsFold: debouncedTerm }] } : undefined,
    enabled: open && !!group,
  })
  const { personnelOptions, isFetching: isFetchingPersonnel } = usePersonnelSelect({ searchText: debouncedTerm, enabled: open && !!personnel })

  const isSearching = getIsSearching(isFetchingUsers, isFetchingGroups, isFetchingPersonnel)

  const selected = useMemo(() => fieldOwnerSelections(field, value).map(toItem), [field, value])

  const serverItems = useMemo(
    () => [
      ...(user
        ? toItems(
            'user',
            members.map((member) => ({ value: member.user.id, label: member.user.displayName || member.user.email })),
          )
        : []),
      ...(group
        ? toItems(
            'group',
            groups.map((item) => ({ value: item.id, label: item.displayName || item.name })),
          )
        : []),
      ...(personnel ? toItems('personnel', personnelOptions) : []),
    ],
    [group, groups, members, personnel, personnelOptions, user],
  )

  const items = useMemo(() => [...(isSearching ? [] : serverItems), ...(string && term ? [toItem({ type: 'string', value: term, displayName: term })] : [])], [isSearching, serverItems, string, term])

  const itemsById = useMemo(() => new Map([...selected, ...items].map((item) => [item.id, item])), [items, selected])

  const handleSelectedIdsChange = (ids: string[]) =>
    onChange(serializeOwnerSelections(ids.map((id) => itemsById.get(id)?.selection).filter((selection): selection is TOwnerSelection => selection !== undefined)))

  const searchLabel = formatList(
    ownerKinds(field).map((kind) => KIND_LABELS[kind]),
    'disjunction',
  )

  return (
    <SearchableItemSelect
      selectedIds={selected.map((item) => item.id)}
      onSelectedIdsChange={handleSelectedIdsChange}
      items={items}
      knownItems={selected}
      isLoading={isSearching}
      icon={(item) => <ResponsibilityTypeIcon type={item.selection.type} />}
      placeholder="Select values"
      searchPlaceholder={`Search ${searchLabel}`}
      onSearchTextChange={setSearchText}
      onOpenChange={setOpen}
    />
  )
}

export default ReportOwnerFilterValue

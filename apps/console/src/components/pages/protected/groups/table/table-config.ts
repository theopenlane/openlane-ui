import { FilterIcons } from '@/components/shared/enum-mapper/groups-enum'
import { useUserSelect } from '@/lib/graphql-hooks/member'
import { defineFilterFields, type FilterField } from '@/types'
import { GroupOrderField, type GroupWhereInput } from '@repo/codegen/src/schema.ts'
import { useEffect, useState } from 'react'

export const GROUP_SORT_FIELDS: { key: GroupOrderField; label: string }[] = [
  { key: GroupOrderField.created_at, label: 'Created At' },
  { key: GroupOrderField.updated_at, label: 'Updated At' },
  { key: GroupOrderField.display_name, label: 'Display Name' },
  { key: GroupOrderField.name, label: 'Name' },
]

type TOption = { value: string; label: string }

export const getGroupsFilterFields = (userOptions: TOption[]) =>
  defineFilterFields<GroupWhereInput>()([
    {
      key: 'hasMembersWith',
      label: 'Member',
      type: 'dropdownUserSearch',
      icon: FilterIcons.Owners,
      options: userOptions,
    },
    { key: 'isManaged', label: 'Include System Managed', type: 'boolean', icon: FilterIcons.SystemOwned },
  ])

export function useGroupsFilters(): FilterField[] | null {
  const [filters, setFilters] = useState<FilterField[] | null>(null)
  const { userOptions } = useUserSelect({})

  useEffect(() => {
    if (!userOptions || userOptions.length === 0 || filters) return

    setFilters(getGroupsFilterFields(userOptions))
  }, [userOptions, filters])

  return filters
}

export const mapGroupsFilterKey = (key: string, value: unknown): GroupWhereInput => ({ [key]: value })

import { FilterIcons } from '@/components/shared/enum-mapper/groups-enum'
import { useUserSelect } from '@/lib/graphql-hooks/member'
import { FilterField } from '@/types'
import { GroupOrderField } from '@repo/codegen/src/schema.ts'
import { useMemo } from 'react'

export const GROUP_SORT_FIELDS: { key: GroupOrderField; label: string }[] = [
  { key: GroupOrderField.created_at, label: 'Created At' },
  { key: GroupOrderField.updated_at, label: 'Updated At' },
  { key: GroupOrderField.display_name, label: 'Display Name' },
  { key: GroupOrderField.name, label: 'Name' },
]

export function useGroupsFilters(): FilterField[] | null {
  const { userOptions } = useUserSelect({})

  const filters = useMemo(() => {
    if (!userOptions || userOptions.length === 0) return null

    return [
      {
        key: 'hasMembersWith',
        label: 'Member',
        type: 'dropdownUserSearch',
        icon: FilterIcons.Owners,
        options: userOptions,
      },
      { key: 'isManaged', label: 'Include System Managed', type: 'boolean', icon: FilterIcons.SystemOwned },
    ] as FilterField[]
  }, [userOptions])

  return filters
}

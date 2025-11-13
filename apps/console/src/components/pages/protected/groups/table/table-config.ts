import { FilterIcons } from '@/components/shared/enum-mapper/groups-enum'
import { useUserSelect } from '@/lib/graphql-hooks/members'
import { FilterField } from '@/types'
import { GroupOrderField } from '@repo/codegen/src/schema.ts'
import { useEffect, useState } from 'react'

export const GROUP_SORT_FIELDS: { key: GroupOrderField; label: string }[] = [
  { key: GroupOrderField.created_at, label: 'Created At' },
  { key: GroupOrderField.updated_at, label: 'Updated At' },
  { key: GroupOrderField.display_name, label: 'Display Name' },
  { key: GroupOrderField.name, label: 'Name' },
]

export function useGroupsFilters(): FilterField[] | null {
  const [filters, setFilters] = useState<FilterField[] | null>(null)
  const { userOptions } = useUserSelect({})

  useEffect(() => {
    if (!userOptions || userOptions.length === 0 || filters) return

    const newFilters: FilterField[] = [
      {
        key: 'hasOwnerWith',
        label: 'Owner',
        type: 'dropdownSearch',
        icon: FilterIcons.Visibility,
        options: userOptions,
      },
    ]

    setFilters(newFilters)
  }, [userOptions, filters])

  return filters
}

import { useMemo } from 'react'
import { useUserSelect } from '@/lib/graphql-hooks/member'
import { useGetGroupNames } from '@/lib/graphql-hooks/group'
import { responsibilityFilterValue, type TResponsibilityFilterOption } from './responsibility-filter'

export const useResponsibilityFilterOptions = (): TResponsibilityFilterOption[] => {
  const { userOptions } = useUserSelect({})
  const { groups } = useGetGroupNames()

  return useMemo(
    () => [
      ...userOptions.map((user) => ({ value: responsibilityFilterValue('user', user.value), label: user.label })),
      ...groups.map((group) => ({ value: responsibilityFilterValue('group', group.id), label: `${group.displayName || group.name} (Group)` })),
    ],
    [userOptions, groups],
  )
}

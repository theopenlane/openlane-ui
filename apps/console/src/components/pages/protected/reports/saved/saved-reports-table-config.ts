import { useMemo } from 'react'
import { Eye } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { ReportOrderField, ReportReportVisibility, type ReportWhereInput } from '@repo/codegen/src/schema'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import type { TQuickFilter } from '@/components/shared/table-filter/table-filter-helper'
import { identityFilterKey } from '@/components/shared/table-filter/where-generator'
import { useUserSelect } from '@/lib/graphql-hooks/member'
import { reportNotOwnedByWhere, reportOwnedByWhere } from '@/lib/report/saved-report'
import { defineFilterFields, type Condition } from '@/types'
import { isStringArray } from '@/utils/type-guards'

export const SAVED_REPORTS_SORT_FIELDS: { key: ReportOrderField; label: string }[] = [
  { key: ReportOrderField.name, label: 'Name' },
  { key: ReportOrderField.VISIBILITY, label: 'Visibility' },
  { key: ReportOrderField.updated_at, label: 'Last updated' },
]

export const mapSavedReportFilterKey = (key: string, value: unknown): ReportWhereInput =>
  key === 'reportOwnerIDIn' && isStringArray(value) ? reportOwnedByWhere(value) : identityFilterKey<ReportWhereInput>(key, value)

export const useSavedReportFilterFields = () => {
  const { userOptions } = useUserSelect({})

  return useMemo(
    () =>
      defineFilterFields<ReportWhereInput>()([
        { key: 'visibilityIn', label: 'Visibility', type: 'multiselect', icon: Eye, options: enumToOptions(ReportReportVisibility) },
        { key: 'reportOwnerIDIn', label: 'Owner', type: 'dropdownSearchMultiselect', icon: FilterIcons.Owners, options: userOptions },
      ]),
    [userOptions],
  )
}

export const useSavedReportQuickFilters = (): TQuickFilter[] => {
  const { data: session } = useSession()
  const userId = session?.user?.userId

  return useMemo(() => {
    if (!userId) return []

    return [
      { label: 'Owned by me', key: 'ownedByMe', type: 'custom', isActive: false, getCondition: () => reportOwnedByWhere([userId]) as Condition },
      { label: 'Not owned by me', key: 'notOwnedByMe', type: 'custom', isActive: false, getCondition: () => reportNotOwnedByWhere(userId) as Condition },
    ]
  }, [userId])
}

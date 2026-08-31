'use client'

import { useCallback } from 'react'
import { type VisibilityState } from '@repo/ui/table-types'
import { type GroupsExportQueryVariables } from '@repo/codegen/src/schema'
import { type GroupExportNode, useFetchAllGroupsForExport } from '@/lib/graphql-hooks/group'
import { useFetchAuthorMaps } from '@/lib/graphql-hooks/authors'
import { useCsvExport } from '@/components/shared/export/use-csv-export'
import { AUTHOR_COLUMN_KEYS, getGroupExportColumns } from './table/export-columns'

type TUseGroupsExportProps = {
  where: GroupsExportQueryVariables['where']
  orderBy: GroupsExportQueryVariables['orderBy']
  columnVisibility: VisibilityState
}

export const useGroupsExport = ({ where, orderBy, columnVisibility }: TUseGroupsExportProps) => {
  const fetchAllGroups = useFetchAllGroupsForExport()
  const fetchAuthorMaps = useFetchAuthorMaps()
  const { runExport, isExporting } = useCsvExport<GroupExportNode>({ fileName: 'groups', entityLabel: 'group', entityLabelPlural: 'groups' })

  const exportGroups = useCallback(
    (includePermissions: boolean) =>
      runExport(async () => {
        const groups = await fetchAllGroups({ where, orderBy, includePermissions })
        const needsAuthorNames = AUTHOR_COLUMN_KEYS.some((key) => columnVisibility[key] !== false)
        const authorMaps = needsAuthorNames ? await fetchAuthorMaps(groups.flatMap((group) => [group.createdBy, group.updatedBy])) : {}

        return { rows: groups, columns: getGroupExportColumns({ columnVisibility, authorMaps, includePermissions }) }
      }),
    [runExport, fetchAllGroups, fetchAuthorMaps, where, orderBy, columnVisibility],
  )

  return { exportGroups, isExporting }
}

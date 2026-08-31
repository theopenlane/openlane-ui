import { type VisibilityState } from '@repo/ui/table-types'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { type GroupExportNode, type GroupExportPermissionNode } from '@/lib/graphql-hooks/group'
import { type AuthorMaps, resolveAuthorName } from '@/lib/authors'
import { formatDateTime } from '@/utils/date'
import { type TExportColumn } from '@/utils/exportToCSV'
import { PERMISSION_LABELS } from '../permission-labels'
import { getGroupTableColumns } from './columns'

export const AUTHOR_COLUMN_KEYS = ['createdBy', 'updatedBy']

type TGetGroupExportColumnsProps = {
  columnVisibility: VisibilityState
  authorMaps: AuthorMaps
  includePermissions: boolean
}

const joinWithOverflow = (values: string[], totalCount: number): string => {
  const omitted = totalCount - values.length

  return omitted > 0 ? [...values, `… +${omitted} more`].join('; ') : values.join('; ')
}

const formatPermission = (permission: GroupExportPermissionNode): string => `${permission.objectType}: ${permission.name || 'Unknown'} (${PERMISSION_LABELS[permission.permissions]})`

const buildAccessors = (authorMaps: AuthorMaps): Record<string, (group: GroupExportNode) => string> => ({
  id: (group) => group.id,
  displayName: (group) => group.displayName,
  name: (group) => group.name,
  description: (group) => group.description ?? '',
  visibility: (group) => getEnumLabel(group.setting?.visibility),
  members: (group) =>
    joinWithOverflow(
      (group.members.edges ?? []).flatMap((edge) => (edge?.node ? [`${edge.node.user.displayName} (${getEnumLabel(edge.node.role)})`] : [])),
      group.members.totalCount,
    ),
  createdBy: (group) => resolveAuthorName(group.createdBy, authorMaps),
  createdAt: (group) => formatDateTime(group.createdAt),
  updatedBy: (group) => resolveAuthorName(group.updatedBy, authorMaps),
  updatedAt: (group) => formatDateTime(group.updatedAt),
})

const TAGS_COLUMN: TExportColumn<GroupExportNode> = { label: 'Tags', accessor: (group) => (group.tags ?? []).join('; ') }

const PERMISSIONS_COLUMN: TExportColumn<GroupExportNode> = {
  label: 'Permissions',
  accessor: (group) => (group.permissions?.edges ?? []).flatMap((edge) => (edge?.node ? [formatPermission(edge.node)] : [])).join('; '),
}

export const getGroupExportColumns = ({ columnVisibility, authorMaps, includePermissions }: TGetGroupExportColumnsProps): TExportColumn<GroupExportNode>[] => {
  const accessors = buildAccessors(authorMaps)
  const { mappedColumns } = getGroupTableColumns({})

  const visibleColumns = mappedColumns
    .filter(({ accessorKey }) => accessors[accessorKey] && columnVisibility[accessorKey] !== false)
    .map(({ accessorKey, header }) => ({ label: header, accessor: accessors[accessorKey] }))

  return [...visibleColumns, TAGS_COLUMN, ...(includePermissions ? [PERMISSIONS_COLUMN] : [])]
}

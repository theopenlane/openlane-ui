import React from 'react'
import { Check, X } from 'lucide-react'
import { type ColumnDef, type Row } from '@repo/ui/table-types'
import { Badge } from '@repo/ui/badge'
import { TruncatedCell } from '@repo/ui/truncated-cell'
import { Link } from '@/components/shared/link/link'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { EXPAND_ROW_COLUMN_SIZE, ExpandRowButton } from '@/components/shared/crud-base/columns/expand-row-button'
import { MembershipList as MembershipListTable } from '@/components/shared/directory-memberships/membership-list'
import { type MembershipList, type MembershipVendor } from '@/lib/directory-memberships/group-memberships'

export type DirectoryAccountRow = {
  id: string
  directory: string | null
  sourceInstanceId: string | null
  accountType: string
  status: string
  mfaState: string
  primarySource: boolean
  integrationDefinitionId: string | null
  vendor: MembershipVendor | null
  memberships: MembershipList
}

const getMfaBadge = (mfaState: string) => {
  switch (mfaState) {
    case 'ENABLED':
    case 'ENFORCED':
      return <Badge variant="green">{getEnumLabel(mfaState)}</Badge>
    case 'DISABLED':
      return <Badge variant="outline">{getEnumLabel(mfaState)}</Badge>
    default:
      return <Badge variant="outline">{getEnumLabel(mfaState)}</Badge>
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return <Badge variant="green">{getEnumLabel(status)}</Badge>
    case 'INACTIVE':
    case 'SUSPENDED':
      return <Badge variant="outline">{getEnumLabel(status)}</Badge>
    case 'DELETED':
      return (
        <Badge variant="destructive" className="shrink-0">
          {getEnumLabel(status)}
        </Badge>
      )
    default:
      return <Badge variant="outline">{getEnumLabel(status)}</Badge>
  }
}

const DirectoryCell = ({ directory, sourceInstanceId, vendor }: Pick<DirectoryAccountRow, 'directory' | 'sourceInstanceId' | 'vendor'>) => {
  if (!directory && !sourceInstanceId) return <span>-</span>
  return (
    <TruncatedCell>
      {directory && (vendor ? <Link href={`/registry/vendors/${vendor.id}`}>{directory}</Link> : directory)}
      {sourceInstanceId && (
        <span className="text-muted-foreground">
          {directory && ' '}({sourceInstanceId})
        </span>
      )}
    </TruncatedCell>
  )
}

export const renderExpandedRow = (row: Row<DirectoryAccountRow>) => {
  const total = row.original.memberships.totalCount
  if (total === 0) {
    return <div className="border-t border-border px-6 py-5 text-sm italic text-muted-foreground">No group memberships.</div>
  }
  return (
    <div className="border-t border-border px-6 py-5">
      <div className="mb-4 flex items-baseline gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Access</h3>
        <span className="text-xs text-muted-foreground">({total} total)</span>
      </div>
      <MembershipListTable memberships={row.original.memberships} />
    </div>
  )
}

export const LINKED_ACCOUNT_COLUMNS: ColumnDef<DirectoryAccountRow>[] = [
  {
    id: 'expander',
    header: () => null,
    size: EXPAND_ROW_COLUMN_SIZE,
    minSize: EXPAND_ROW_COLUMN_SIZE,
    maxSize: EXPAND_ROW_COLUMN_SIZE,
    enableHiding: false,
    cell: ({ row }) => <ExpandRowButton row={row} label="access details" />,
  },
  {
    accessorKey: 'directory',
    header: 'Directory',
    size: 200,
    cell: ({ row }) => <DirectoryCell directory={row.original.directory} sourceInstanceId={row.original.sourceInstanceId} vendor={row.original.vendor} />,
  },
  {
    accessorKey: 'accountType',
    header: 'Account Type',
    size: 150,
    cell: ({ row }) => <span>{getEnumLabel(row.original.accountType)}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 120,
    cell: ({ row }) => getStatusBadge(row.original.status),
  },
  {
    accessorKey: 'mfaState',
    header: 'MFA',
    size: 120,
    cell: ({ row }) => getMfaBadge(row.original.mfaState),
  },
  {
    accessorKey: 'primarySource',
    header: 'Primary Source',
    size: 140,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.primarySource ? (
          <>
            <Check size={16} className="text-success" />
            <span>Yes</span>
          </>
        ) : (
          <>
            <X size={16} className="text-destructive" />
            <span>No</span>
          </>
        )}
      </div>
    ),
  },
  {
    id: 'access',
    header: 'Access',
    size: 100,
    cell: ({ row }) => {
      const count = row.original.memberships.totalCount
      if (count === 0) return <span className="text-muted-foreground">—</span>
      return <Badge variant="outline">{count}</Badge>
    },
  },
]

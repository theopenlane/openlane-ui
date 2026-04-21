'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { type ColumnDef, type Row, type VisibilityState } from '@tanstack/react-table'
import { DataTable } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import { useGetIdentityHolderDirectoryAccounts } from '@/lib/graphql-hooks/identity-holder'
import { enumToOptions, getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { Input } from '@repo/ui/input'
import { SearchIcon, Settings } from 'lucide-react'
import { useDebounce } from '@uidotdev/usehooks'
import ColumnVisibilityMenu, { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { getMappedColumns } from '@/components/shared/crud-base/columns/get-mapped-columns'
import { createRowActionsColumn } from '@/components/shared/crud-base/columns/row-actions-column'
import { TableFilter } from '@/components/shared/table-filter/table-filter'
import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import { Badge } from '@repo/ui/badge'
import { Check, ChevronDown, ChevronRight, X } from 'lucide-react'
import { buildMembershipList, type MembershipList } from '@/lib/directory-memberships/group-memberships'
import { MembershipList as MembershipListTable } from '@/components/shared/directory-memberships/membership-list'
import { DirectoryMembershipDirectoryMembershipRole, type DirectoryMembershipWhereInput } from '@repo/codegen/src/schema'
import type { FilterField, WhereCondition } from '@/types'

interface LinkedAccountsTabProps {
  personnelId: string
}

type DirectoryAccountRow = {
  id: string
  directory: string
  accountType: string
  status: string
  mfaState: string
  primarySource: boolean
  integrationDefinitionId: string | null
  memberships: MembershipList
}

const roleOptions = enumToOptions(DirectoryMembershipDirectoryMembershipRole)

const MEMBERSHIP_FILTER_FIELDS: FilterField[] = [
  {
    key: 'roleIn',
    label: 'Role',
    type: 'multiselect',
    icon: FilterIcons.Access,
    options: roleOptions,
  },
]

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

const renderExpandedRow = (row: Row<DirectoryAccountRow>) => {
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

const DATA_COLUMNS: ColumnDef<DirectoryAccountRow>[] = [
  {
    id: 'expander',
    header: () => null,
    size: 50,
    minSize: 50,
    maxSize: 50,
    enableHiding: false,
    cell: ({ row }) => (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          row.toggleExpanded()
        }}
        aria-expanded={row.getIsExpanded()}
        aria-label={row.getIsExpanded() ? 'Collapse access details' : 'Expand access details'}
        className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
      >
        {row.getIsExpanded() ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
    ),
  },
  {
    accessorKey: 'directory',
    header: 'Directory',
    size: 200,
    cell: ({ row }) => <span className="block truncate">{row.original.directory || '-'}</span>,
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

const LinkedAccountsTab: React.FC<LinkedAccountsTabProps> = ({ personnelId }) => {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [membershipFilter, setMembershipFilter] = useState<WhereCondition>({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableKeyEnum.PERSONNEL_LINKED_ACCOUNTS, {}))

  const where = useMemo(
    () =>
      debouncedSearch
        ? {
            or: [{ directoryNameContainsFold: debouncedSearch }, { displayNameContainsFold: debouncedSearch }, { canonicalEmailContainsFold: debouncedSearch }],
          }
        : undefined,
    [debouncedSearch],
  )

  const membershipWhere: DirectoryMembershipWhereInput | undefined = Object.keys(membershipFilter).length === 0 ? undefined : (membershipFilter as DirectoryMembershipWhereInput)

  const { directoryAccounts, isLoading } = useGetIdentityHolderDirectoryAccounts(personnelId, where, membershipWhere)

  const columns = useMemo<ColumnDef<DirectoryAccountRow>[]>(
    () => [
      ...DATA_COLUMNS,
      createRowActionsColumn<DirectoryAccountRow>({
        actions: [
          {
            label: 'Configure integration',
            icon: <Settings size={16} />,
            onClick: (row) => {
              if (row.integrationDefinitionId) {
                router.push(`/organization-settings/integrations/${row.integrationDefinitionId}`)
              }
            },
            disabled: (row) => !row.integrationDefinitionId,
          },
        ],
      }),
    ],
    [router],
  )

  const mappedColumns = useMemo(() => getMappedColumns(columns), [columns])

  const rows: DirectoryAccountRow[] = useMemo(
    () =>
      directoryAccounts.map((account) => ({
        id: account.id,
        directory: account.directoryName ?? '-',
        accountType: account.accountType ?? '',
        status: account.status,
        mfaState: account.mfaState,
        primarySource: account.primarySource,
        integrationDefinitionId: account.integration?.definitionID ?? null,
        memberships: buildMembershipList(account.memberships),
      })),
    [directoryAccounts],
  )

  return (
    <div className="mt-5">
      <div className="flex items-center gap-2 mb-3">
        <Input icon={<SearchIcon size={16} />} placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.currentTarget.value)} variant="searchTable" />
        <div className="grow flex flex-row items-center gap-2 justify-end">
          <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} storageKey={TableKeyEnum.PERSONNEL_LINKED_ACCOUNTS} />
          <TableFilter filterFields={MEMBERSHIP_FILTER_FIELDS} onFilterChange={setMembershipFilter} pageKey={TableKeyEnum.PERSONNEL_LINKED_ACCOUNTS} />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        tableKey={TableKeyEnum.PERSONNEL_LINKED_ACCOUNTS}
        renderExpandedRow={renderExpandedRow}
      />
    </div>
  )
}

export default LinkedAccountsTab

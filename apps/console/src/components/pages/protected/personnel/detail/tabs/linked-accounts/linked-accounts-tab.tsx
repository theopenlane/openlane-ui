'use client'

import React, { useState, useMemo } from 'react'
import { type ColumnDef, type VisibilityState } from '@tanstack/react-table'
import { DataTable } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import { useGetIdentityHolderDirectoryAccounts } from '@/lib/graphql-hooks/identity-holder'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { Input } from '@repo/ui/input'
import { SearchIcon } from 'lucide-react'
import { useDebounce } from '@uidotdev/usehooks'
import ColumnVisibilityMenu, { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { getMappedColumns } from '@/components/shared/crud-base/columns/get-mapped-columns'
import { Badge } from '@repo/ui/badge'
import { Check, X } from 'lucide-react'

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

const columns: ColumnDef<DirectoryAccountRow>[] = [
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
]

const mappedColumns = getMappedColumns(columns)

const LinkedAccountsTab: React.FC<LinkedAccountsTabProps> = ({ personnelId }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableKeyEnum.PERSONNEL_LINKED_ACCOUNTS, {}))

  const { directoryAccounts, isLoading } = useGetIdentityHolderDirectoryAccounts(personnelId)

  const rows: DirectoryAccountRow[] = useMemo(
    () =>
      directoryAccounts.map((account) => ({
        id: account.id,
        directory: account.integration?.name ?? '-',
        accountType: account.accountType ?? '',
        status: account.status,
        mfaState: account.mfaState,
        primarySource: account.primarySource,
      })),
    [directoryAccounts],
  )

  const filteredRows = useMemo(() => {
    if (!debouncedSearch) return rows
    const term = debouncedSearch.toLowerCase()
    return rows.filter((row) => row.directory.toLowerCase().includes(term) || row.accountType.toLowerCase().includes(term) || row.status.toLowerCase().includes(term))
  }, [rows, debouncedSearch])

  return (
    <div className="mt-5">
      <div className="flex items-center gap-2 mb-3">
        <Input icon={<SearchIcon size={16} />} placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.currentTarget.value)} variant="searchTable" />
        <div className="grow flex flex-row items-center gap-2 justify-end">
          <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} storageKey={TableKeyEnum.PERSONNEL_LINKED_ACCOUNTS} />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredRows}
        loading={isLoading}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        tableKey={TableKeyEnum.PERSONNEL_LINKED_ACCOUNTS}
      />
    </div>
  )
}

export default LinkedAccountsTab

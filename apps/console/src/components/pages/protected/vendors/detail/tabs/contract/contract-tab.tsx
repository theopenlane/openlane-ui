'use client'

import React, { useState } from 'react'
import { type ColumnDef, type VisibilityState } from '@tanstack/react-table'
import { DataTable } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { Switch } from '@repo/ui/switch'
import { Input } from '@repo/ui/input'
import { DownloadIcon, Plus, SearchIcon } from 'lucide-react'
import ColumnVisibilityMenu, { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { TableFilter } from '@/components/shared/table-filter/table-filter'
import Menu from '@/components/shared/menu/menu'
import { Button } from '@repo/ui/button'
import type { EntityQuery } from '@repo/codegen/src/schema'
import AddContractDialog from './add-contract-dialog'

interface ContractTabProps {
  vendor: EntityQuery['entity']
  vendorId: string
}

type ContractRow = {
  id: string
  startDate: string | null | undefined
  endDate: string | null | undefined
  terminationNoticeDays: number | null | undefined
  renewalDate: string | null | undefined
  annualSpend: number | null | undefined
  spendCurrency: string | null | undefined
  autoRenews: boolean | null | undefined
}

const COLUMN_VISIBILITY_DEFAULTS: VisibilityState = {
  startDate: true,
  endDate: true,
  terminationNoticeDays: true,
  renewalDate: true,
  annualSpend: true,
  spendCurrency: true,
  autoRenews: true,
}

const columns: ColumnDef<ContractRow>[] = [
  {
    accessorKey: 'startDate',
    header: 'Start Date',
    size: 150,
    cell: ({ row }) => <DateCell value={row.original.startDate} />,
  },
  {
    accessorKey: 'endDate',
    header: 'End Date',
    size: 150,
    cell: ({ row }) => <DateCell value={row.original.endDate} />,
  },
  {
    accessorKey: 'terminationNoticeDays',
    header: 'Termination Notice',
    size: 170,
    cell: ({ row }) => {
      const days = row.original.terminationNoticeDays
      return <span>{days != null ? `${days} days` : '-'}</span>
    },
  },
  {
    accessorKey: 'renewalDate',
    header: 'Renewal Date',
    size: 150,
    cell: ({ row }) => <DateCell value={row.original.renewalDate} />,
  },
  {
    accessorKey: 'annualSpend',
    header: 'Annual Spend',
    size: 150,
    cell: ({ row }) => {
      const spend = row.original.annualSpend
      return <span>{spend != null ? `$${spend.toLocaleString()}` : '-'}</span>
    },
  },
  {
    accessorKey: 'spendCurrency',
    header: 'Spend Currency',
    size: 140,
    cell: ({ row }) => <span>{row.original.spendCurrency ?? '-'}</span>,
  },
  {
    accessorKey: 'autoRenews',
    header: 'Auto-Renew?',
    size: 140,
    cell: ({ row }) => {
      const autoRenews = row.original.autoRenews ?? false
      return (
        <div className="flex items-center gap-2">
          <Switch checked={autoRenews} disabled />
          <span>{autoRenews ? 'Yes' : 'No'}</span>
        </div>
      )
    },
  },
]

const mappedColumns = columns
  .filter((column): column is ColumnDef<ContractRow> & { accessorKey: string; header: string } => {
    const col = column as { accessorKey?: string; header?: string }
    return typeof col.accessorKey === 'string' && typeof col.header === 'string'
  })
  .map((column) => ({
    accessorKey: column.accessorKey,
    header: column.header as string,
  }))

const ContractTab: React.FC<ContractTabProps> = ({ vendor, vendorId }) => {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableKeyEnum.VENDOR_CONTRACT, COLUMN_VISIBILITY_DEFAULTS))
  const [showAddDialog, setShowAddDialog] = useState(false)

  const handleExportCSV = (data: ContractRow[]) => {
    if (data.length === 0) return

    const headers = ['Start Date', 'End Date', 'Termination Notice', 'Renewal Date', 'Annual Spend', 'Spend Currency', 'Auto-Renew']
    const rows = data.map((r) => [
      r.startDate ? new Date(r.startDate).toLocaleDateString() : '',
      r.endDate ? new Date(r.endDate).toLocaleDateString() : '',
      r.terminationNoticeDays != null ? `${r.terminationNoticeDays} days` : '',
      r.renewalDate ? new Date(r.renewalDate).toLocaleDateString() : '',
      r.annualSpend != null ? `$${r.annualSpend.toLocaleString()}` : '',
      r.spendCurrency ?? '',
      r.autoRenews ? 'Yes' : 'No',
    ])

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'vendor-contract.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const contractData: ContractRow[] = []

  const hasContractData = vendor.contractStartDate || vendor.contractEndDate || vendor.contractRenewalAt || vendor.annualSpend || vendor.terminationNoticeDays || vendor.autoRenews !== null

  if (hasContractData) {
    contractData.push({
      id: vendor.id,
      startDate: vendor.contractStartDate,
      endDate: vendor.contractEndDate,
      terminationNoticeDays: vendor.terminationNoticeDays,
      renewalDate: vendor.contractRenewalAt,
      annualSpend: vendor.annualSpend,
      spendCurrency: vendor.spendCurrency,
      autoRenews: vendor.autoRenews,
    })
  }

  return (
    <div className="mt-5">
      <div className="flex items-center gap-2 mb-3">
        <Input icon={<SearchIcon size={16} />} placeholder="Search..." disabled variant="searchTable" />
        <div className="grow flex flex-row items-center gap-2 justify-end">
          <Menu
            closeOnSelect={true}
            content={(close) => (
              <Button
                size="sm"
                variant="transparent"
                className="px-1 flex items-center justify-start space-x-2 cursor-pointer"
                onClick={() => {
                  handleExportCSV(contractData)
                  close()
                }}
              >
                <DownloadIcon size={16} strokeWidth={2} />
                <span>Export</span>
              </Button>
            )}
          />
          <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} storageKey={TableKeyEnum.VENDOR_CONTRACT} />
          <TableFilter filterFields={[]} onFilterChange={() => {}} pageKey={TableKeyEnum.VENDOR_CONTRACT} />
          {!hasContractData && (
            <Button icon={<Plus size={16} />} iconPosition="left" onClick={() => setShowAddDialog(true)}>
              Add Contract
            </Button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={contractData}
        loading={false}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        tableKey={TableKeyEnum.VENDOR_CONTRACT}
        noResultsText="No contract details available for this vendor."
      />

      {showAddDialog && <AddContractDialog vendorId={vendorId} onClose={() => setShowAddDialog(false)} />}
    </div>
  )
}

export default ContractTab

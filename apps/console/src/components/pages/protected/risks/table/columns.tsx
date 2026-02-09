import { ColumnDef, Row } from '@tanstack/react-table'
import { Group, RiskRiskStatus, RiskTableFieldsFragment, User } from '@repo/codegen/src/schema.ts'
import React from 'react'
import RiskLabel from '@/components/pages/protected/risks/risk-label.tsx'
import { Avatar } from '@/components/shared/avatar/avatar.tsx'
import { formatDate, formatTimeSince } from '@/utils/date'
import { Checkbox } from '@repo/ui/checkbox'
import DelegateCell from './delegate-cell'
import StakeholderCell from './stakeholder-cell'

type Params = {
  userMap: Record<string, { id: string; displayName: string; gravatarLogoURL?: string; logoURL?: string }>
  convertToReadOnly?: (value: string, depth: number) => React.ReactNode
  selectedRisks: { id: string }[]
  setSelectedRisks: React.Dispatch<React.SetStateAction<{ id: string }[]>>
}

export const getRiskColumns = ({ userMap, convertToReadOnly, selectedRisks, setSelectedRisks }: Params) => {
  const toggleSelection = (risk: { id: string }) => {
    setSelectedRisks((prev) => {
      const exists = prev.some((c) => c.id === risk.id)
      return exists ? prev.filter((c) => c.id !== risk.id) : [...prev, risk]
    })
  }
  const columns: ColumnDef<RiskTableFieldsFragment>[] = [
    {
      id: 'select',
      header: ({ table }) => {
        const currentPageRisks = table.getRowModel().rows.map((row) => row.original)
        const allSelected = currentPageRisks.every((risk) => selectedRisks.some((sc) => sc.id === risk.id))

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked: boolean) => {
                const newSelections = checked
                  ? [...selectedRisks.filter((sc) => !currentPageRisks.some((c) => c.id === sc.id)), ...currentPageRisks.map((c) => ({ id: c.id }))]
                  : selectedRisks.filter((sc) => !currentPageRisks.some((c) => c.id === sc.id))

                setSelectedRisks(newSelections)
              }}
            />
          </div>
        )
      },
      cell: ({ row }: { row: Row<RiskTableFieldsFragment> }) => {
        const { id } = row.original
        const isChecked = selectedRisks.some((c) => c.id === id)

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={isChecked} onCheckedChange={() => toggleSelection({ id })} />
          </div>
        )
      },
      size: 50,
      maxSize: 50,
    },
    {
      accessorKey: 'id',
      header: 'ID',
      size: 270,
      cell: ({ row }) => <div className="text-muted-foreground">{row.original.id}</div>,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ cell }) => <div className="font-bold">{cell.getValue() as string}</div>,
      size: 200,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ cell }) => (
        <div className="flex items-center space-x-2">
          <RiskLabel status={(cell.getValue() as RiskRiskStatus) || ''} isEditing={false} />
        </div>
      ),
      minSize: 120,
    },
    {
      accessorKey: 'riskKindName',
      header: 'Type',
      size: 100,
      cell: ({ cell }) => (
        <div className="flex items-center space-x-2">
          <RiskLabel fieldName="riskKindName" riskKindName={(cell.getValue() as string) || ''} isEditing={false} />
        </div>
      ),
      minSize: 150,
    },
    {
      accessorKey: 'riskCategoryName',
      header: 'Category',
      size: 250,
      cell: ({ cell }) => (
        <div className="flex items-center space-x-2">
          <RiskLabel fieldName="riskCategoryName" riskCategoryName={cell.getValue() as string} isEditing={false} />
        </div>
      ),
      minSize: 150,
    },
    {
      accessorKey: 'score',
      header: 'Score',
      cell: ({ cell }) => (
        <div className="flex items-center space-x-2">
          <RiskLabel score={cell.getValue() as number} isEditing={false} />
        </div>
      ),
    },
    {
      accessorKey: 'stakeholder',
      header: 'Stakeholder',
      meta: {
        exportPrefix: 'stakeholder.displayName',
      },
      cell: ({ row }) => {
        const stakeholder = row.original.stakeholder
        const riskId = row.original.id
        return <StakeholderCell stakeholder={stakeholder as Group | null} riskId={riskId} />
      },
    },
    {
      accessorKey: 'businessCosts',
      header: 'Business Costs',
      cell: ({ cell }) => convertToReadOnly?.(cell.getValue() as string, 0) || '',
      size: 250,
    },
    {
      accessorKey: 'delegate',
      header: 'Delegate',
      meta: {
        exportPrefix: 'delegate.displayName',
      },
      size: 160,
      cell: ({ row }) => {
        const delegate = row.original.delegate
        const riskId = row.original.id
        return <DelegateCell delegate={delegate as Group | null} riskId={riskId} />
      },
    },
    {
      accessorKey: 'details',
      header: 'Details',
      cell: ({ cell }) => convertToReadOnly?.(cell.getValue() as string, 0) || '',
      size: 500,
    },
    {
      accessorKey: 'impact',
      header: 'Impact',
      cell: ({ cell }) => cell.getValue() || '-',
      size: 180,
    },
    {
      accessorKey: 'likelihood',
      header: 'Likelihood',
      cell: ({ row }) => {
        const likelihood = row.original.likelihood
        return likelihood ? <RiskLabel isEditing={false} likelihood={likelihood}></RiskLabel> : '-'
      },
      size: 180,
    },
    {
      accessorKey: 'mitigation',
      header: 'Mitigation',
      cell: ({ cell }) => convertToReadOnly?.(cell.getValue() as string, 0) || '',
      size: 400,
    },
    {
      accessorKey: 'createdBy',
      header: 'Created by',
      size: 200,
      cell: ({ row }) => {
        const user = userMap[row.original.createdBy ?? '']
        return user ? (
          <div className="flex items-center gap-2">
            <Avatar entity={user as User} />
            {user.displayName || '-'}
          </div>
        ) : (
          'Deleted user'
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      size: 150,
      cell: ({ cell }) => <span className="whitespace-nowrap">{formatDate(cell.getValue() as string)}</span>,
    },
    {
      accessorKey: 'updatedBy',
      header: 'Updated By',
      size: 200,
      cell: ({ row }) => {
        const user = userMap[row.original.updatedBy ?? '']
        return user ? (
          <div className="flex items-center gap-2">
            <Avatar entity={user as User} />
            {user.displayName || '-'}
          </div>
        ) : (
          'Deleted user'
        )
      },
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last Updated',
      size: 100,
      cell: ({ cell }) => <span className="whitespace-nowrap">{formatTimeSince(cell.getValue() as string)}</span>,
    },
  ]

  const mappedColumns = columns
    .filter((column): column is { accessorKey: string; header: string } => 'accessorKey' in column && typeof column.accessorKey === 'string' && 'header' in column && typeof column.header === 'string')
    .map((column) => ({
      accessorKey: column.accessorKey,
      header: column.header,
    }))

  return { columns, mappedColumns }
}

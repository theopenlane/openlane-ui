import { type ColumnDef } from '@tanstack/react-table'
import { type Group, type RiskRiskStatus, type RiskTableFieldsFragment, type User } from '@repo/codegen/src/schema.ts'
import React from 'react'
import RiskLabel from '@/components/pages/protected/risks/risk-label.tsx'
import { UserCell } from '@/components/shared/crud-base/columns/user-cell'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { createSelectColumn } from '@/components/shared/crud-base/columns/select-column'
import DelegateCell from './delegate-cell'
import StakeholderCell from './stakeholder-cell'

type Params = {
  userMap: Record<string, { id: string; displayName: string; gravatarLogoURL?: string; logoURL?: string }>
  convertToReadOnly?: (value: string, depth: number) => React.ReactNode
  selectedRisks: { id: string }[]
  setSelectedRisks: React.Dispatch<React.SetStateAction<{ id: string }[]>>
}

export const getRiskColumns = ({ userMap, convertToReadOnly, selectedRisks, setSelectedRisks }: Params) => {
  const columns: ColumnDef<RiskTableFieldsFragment>[] = [
    createSelectColumn<RiskTableFieldsFragment>(selectedRisks, setSelectedRisks),
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
      cell: ({ cell }) => (
        <div className="flex items-center space-x-2">
          <RiskLabel fieldName="riskCategoryName" riskCategoryName={cell.getValue() as string} isEditing={false} />
        </div>
      ),
      size: 150,
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
      size: 90,
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
      size: 120,
    },
    {
      accessorKey: 'businessCosts',
      header: 'Business Costs',
      cell: ({ cell }) => convertToReadOnly?.(cell.getValue() as string, 0) || '',
      size: 200,
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
      cell: ({ row }) => <UserCell user={userMap[row.original.createdBy ?? ''] as User | undefined} />,
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      size: 150,
      cell: ({ cell }) => <DateCell value={cell.getValue() as string} />,
    },
    {
      accessorKey: 'updatedBy',
      header: 'Updated By',
      size: 200,
      cell: ({ row }) => <UserCell user={userMap[row.original.updatedBy ?? ''] as User | undefined} />,
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last Updated',
      size: 100,
      cell: ({ cell }) => <DateCell value={cell.getValue() as string} variant="timesince" />,
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

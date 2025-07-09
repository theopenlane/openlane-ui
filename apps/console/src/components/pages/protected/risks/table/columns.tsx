import { ColumnDef } from '@tanstack/react-table'
import { Group, RiskRiskStatus, RiskTableFieldsFragment, User } from '@repo/codegen/src/schema.ts'
import React from 'react'
import RiskLabel from '@/components/pages/protected/risks/risk-label.tsx'
import { Avatar } from '@/components/shared/avatar/avatar.tsx'
import { formatDate } from '@/utils/date'

type Params = {
  userMap: Record<string, { id: string; displayName: string; gravatarLogoURL?: string; logoURL?: string }>
  convertToReadOnly?: (value: string, depth: number) => React.ReactNode
}

export const getRiskColumns = ({ userMap, convertToReadOnly }: Params) => {
  const columns: ColumnDef<RiskTableFieldsFragment>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ cell }) => <div className="font-bold">{cell.getValue() as string}</div>,
      size: 300,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ cell }) => (
        <div className="flex items-center space-x-2">
          <RiskLabel status={(cell.getValue() as RiskRiskStatus) || ''} isEditing={false} />
        </div>
      ),
      size: 100,
    },
    { accessorKey: 'riskType', header: 'Type' },
    { accessorKey: 'category', header: 'Category' },
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
      cell: ({ row }) => {
        const stakeholder = row.original.stakeholder
        return (
          <div className="flex items-center gap-2">
            <Avatar entity={stakeholder as User} />
            {stakeholder?.displayName || '-'}
          </div>
        )
      },
    },
    {
      accessorKey: 'businessCosts',
      header: 'Business Costs',
      cell: ({ cell }) => cell.getValue() || '-',
      size: 180,
    },
    {
      accessorKey: 'delegate',
      header: 'Delegate',
      cell: ({ row }) => {
        const delegate = row.original.delegate
        return delegate ? (
          <div className="flex items-center gap-2">
            <Avatar entity={delegate as Group} />
            {delegate.displayName || '-'}
          </div>
        ) : (
          <span>-</span>
        )
      },
    },
    {
      accessorKey: 'details',
      header: 'Details',
      cell: ({ cell }) => convertToReadOnly?.(cell.getValue() as string, 0) || '',
      size: 200,
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
      cell: ({ cell }) => cell.getValue() || '-',
      size: 180,
    },
    {
      accessorKey: 'mitigation',
      header: 'Mitigation',
      cell: ({ cell }) => convertToReadOnly?.(cell.getValue() as string, 0) || '',
      size: 200,
    },
    {
      accessorKey: 'createdBy',
      header: 'Created By',
      cell: ({ row }) => {
        const user = userMap[row.original.createdBy ?? '']
        return user ? (
          <div className="flex items-center space-x-1">
            <Avatar entity={user as User} className="w-[24px] h-[24px]" />
            <p>{user.displayName}</p>
          </div>
        ) : (
          <span className="text-muted-foreground italic">Deleted user</span>
        )
      },
      size: 160,
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ cell }) => formatDate(cell.getValue() as string),
      size: 130,
    },
    {
      accessorKey: 'updatedBy',
      header: 'Updated By',
      cell: ({ row }) => {
        const user = userMap[row.original.updatedBy ?? '']
        return user ? (
          <div className="flex items-center space-x-1">
            <Avatar entity={user as User} className="w-[24px] h-[24px]" />
            <p>{user.displayName}</p>
          </div>
        ) : (
          <span className="text-muted-foreground italic">Deleted user</span>
        )
      },
      size: 160,
    },
    {
      accessorKey: 'updatedAt',
      header: 'Updated At',
      cell: ({ cell }) => formatDate(cell.getValue() as string),
      size: 130,
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

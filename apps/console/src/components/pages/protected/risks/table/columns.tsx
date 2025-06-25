import { ColumnDef } from '@tanstack/react-table'
import { RiskFieldsFragment, RiskRiskStatus, User } from '@repo/codegen/src/schema.ts'
import React from 'react'
import RiskLabel from '@/components/pages/protected/risks/risk-label.tsx'
import { Avatar } from '@/components/shared/avatar/avatar.tsx'

export const getRiskColumns = () => {
  const columns: ColumnDef<RiskFieldsFragment>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ cell }) => {
        return <div className="font-bold">{cell.getValue() as string}</div>
      },
      size: 300,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ cell }) => {
        return (
          <div className="flex items-center space-x-2">
            <RiskLabel status={(cell.getValue() as RiskRiskStatus) || ''} isEditing={false} />
          </div>
        )
      },
    },
    { accessorKey: 'riskType', header: 'Type' },
    { accessorKey: 'category', header: 'Category' },
    {
      accessorKey: 'score',
      header: 'Score',
      cell: ({ cell }) => {
        return (
          <div className="flex items-center space-x-2">
            <RiskLabel score={cell.getValue() as number} isEditing={false} />
          </div>
        )
      },
    },
    {
      header: 'Stakeholder',
      accessorKey: 'stakeholder',
      cell: ({ row }) => {
        const stakeholder = row.original.stakeholder
        return (
          <div className="flex items-center gap-2">
            <Avatar entity={stakeholder as User} />
            {stakeholder?.displayName || '—'}
          </div>
        )
      },
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

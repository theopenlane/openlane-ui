import { ColumnDef } from '@tanstack/react-table'
import { Evidence, EvidenceEvidenceStatus } from '@repo/codegen/src/schema.ts'
import React from 'react'
import { EvidenceBadgeMapper } from '@/components/shared/icon-enum/evidence-enum.tsx'
import { Check, Minus } from 'lucide-react'
import ControlChip from '@/components/pages/protected/controls/map-controls/shared/control-chip.tsx'

export const getEvidenceColumns = () => {
  const columns: ColumnDef<Evidence>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ cell }) => {
        return <div className="font-bold">{cell.getValue() as string}</div>
      },
      minSize: 100,
      size: 180,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ cell }) => {
        return <div className="font-bold">{cell.getValue() as string}</div>
      },
      minSize: 100,
      size: 180,
    },
    {
      accessorKey: 'id',
      header: 'Satisfies',
      cell: ({ row }) => {
        const controlEdges = row.original?.controls?.edges || []
        const subcontrolEdges = row.original?.subcontrols?.edges || []
        const allControls = [...controlEdges, ...subcontrolEdges]

        return (
          <div className="flex flex-wrap gap-1">
            {allControls.map((control, index) => {
              return (
                <ControlChip
                  key={index}
                  disableTooltip={true}
                  control={{
                    id: control!.node!.id,
                    refCode: control!.node!.refCode,
                    referenceFramework: control!.node!.referenceFramework,
                  }}
                />
              )
            })}
          </div>
        )
      },
      minSize: 100,
      size: 180,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ cell }) => {
        return <div className="flex items-center space-x-2">{EvidenceBadgeMapper[cell.getValue() as EvidenceEvidenceStatus]}</div>
      },
      minSize: 100,
      size: 180,
    },
    {
      accessorKey: 'isAutomated',
      header: 'Automated',
      cell: ({ cell }) => {
        return <div className="font-bold">{cell.getValue() ? <Minus size={16} /> : <Check size={16} />}</div>
      },
      minSize: 100,
      size: 180,
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

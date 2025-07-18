import { ColumnDef } from '@tanstack/react-table'
import { Evidence, EvidenceEvidenceStatus, User } from '@repo/codegen/src/schema.ts'
import React from 'react'
import { EvidenceBadgeMapper } from '@/components/shared/icon-enum/evidence-enum.tsx'
import { Check, Minus } from 'lucide-react'
import ControlChip from '@/components/pages/protected/controls/map-controls/shared/control-chip.tsx'
import { formatDate } from '@/utils/date.ts'
import { Badge } from '@repo/ui/badge'
import { Avatar } from '@/components/shared/avatar/avatar.tsx'
import EvidenceFileChip from '@/components/pages/protected/evidence/table/evidence-file-chip.tsx'

type TGetEvidenceColumnsProps = {
  userMap: Record<string, User>
}

export const getEvidenceColumns = ({ userMap }: TGetEvidenceColumnsProps) => {
  const columns: ColumnDef<Evidence>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const evidenceName = row.original.name
        const linkUrl = row.original.url
        const evidenceId = row.original.id

        return (
          <div className="flex gap-2">
            <EvidenceFileChip evidenceId={evidenceId} linkUrl={linkUrl} evidenceName={evidenceName} />
          </div>
        )
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
          <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
            {allControls.map((control, index) => {
              return (
                <ControlChip
                  key={index}
                  control={{
                    id: control!.node!.id,
                    refCode: control!.node!.refCode,
                    referenceFramework: control!.node!.referenceFramework,
                    __typename: control!.node?.__typename,
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
        return <div className="font-bold">{cell.getValue() ? <Check size={16} /> : <Minus size={16} />}</div>
      },
      minSize: 100,
      size: 180,
    },
    {
      accessorKey: 'collectionProcedure',
      header: 'Collection Procedure',
      cell: ({ cell }) => {
        return <div className="font-bold">{cell.getValue() as string}</div>
      },
      minSize: 100,
      size: 180,
    },
    {
      accessorKey: 'source',
      header: 'Source',
      cell: ({ cell }) => {
        return <div className="font-bold">{cell.getValue() as string}</div>
      },
      minSize: 100,
      size: 180,
    },
    {
      accessorKey: 'creationDate',
      header: 'Creation Date',
      cell: ({ cell }) => <p>{formatDate(cell.row?.original?.creationDate)}</p>,
      minSize: 100,
      size: 180,
    },
    {
      accessorKey: 'renewalDate',
      header: 'Renewal Date',
      cell: ({ cell }) => <p>{formatDate(cell.row?.original?.renewalDate)}</p>,
      minSize: 100,
      size: 180,
    },
    {
      accessorKey: 'tags',
      header: 'Tags',
      size: 140,
      cell: ({ row }) => {
        const tags = row?.original?.tags
        if (!tags?.length) {
          return '-'
        }
        return (
          <div className="flex gap-2">
            {row?.original?.tags?.map((tag, i) => (
              <Badge variant={'outline'} key={i}>
                {tag}
              </Badge>
            ))}
          </div>
        )
      },
    },
    {
      accessorKey: 'createdBy',
      header: 'Created By',
      cell: ({ row }) => {
        const user = userMap?.[row.original.createdBy ?? '']
        return user ? (
          <div className="flex items-center gap-1">
            <Avatar entity={user} className="w-[24px] h-[24px]" />
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
      header: 'Last Updated By',
      cell: ({ row }) => {
        const user = userMap?.[row.original.updatedBy ?? '']
        return user ? (
          <div className="flex items-center gap-1">
            <Avatar entity={user} className="w-[24px] h-[24px]" />
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
      header: 'Last updated',
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

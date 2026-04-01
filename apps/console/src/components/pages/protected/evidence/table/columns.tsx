import { type ColumnDef } from '@tanstack/react-table'
import { type Evidence, type User } from '@repo/codegen/src/schema.ts'
import Link from 'next/link'
import React from 'react'
import { Check, LinkIcon, Minus } from 'lucide-react'
import ControlChip from '@/components/pages/protected/controls/map-controls/shared/control-chip.tsx'
import { Badge } from '@repo/ui/badge'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { EvidenceIconMapper } from '@/components/shared/enum-mapper/evidence-enum'
import EvidenceFileChip from '@/components/pages/protected/evidence/table/evidence-file-chip.tsx'
import { UserCell } from '@/components/shared/crud-base/columns/user-cell'
import { TagsCell } from '@/components/shared/crud-base/columns/tags-cell'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { createSelectColumn } from '@/components/shared/crud-base/columns/select-column'
import { formatDate } from '@/utils/date.ts'
import { CustomEnumChipCell } from '@/components/shared/crud-base/columns/custom-enum-chip-cell'

type TGetEvidenceColumnsProps = {
  userMap: Record<string, User>
  selectedEvidence: { id: string }[]
  setSelectedEvidence: React.Dispatch<React.SetStateAction<{ id: string }[]>>
}

export const useGetEvidenceColumns = ({ userMap, selectedEvidence, setSelectedEvidence }: TGetEvidenceColumnsProps) => {
  const { convertToReadOnly } = usePlateEditor()
  const columns: ColumnDef<Evidence>[] = [
    createSelectColumn<Evidence>(selectedEvidence, setSelectedEvidence),
    {
      accessorKey: 'id',
      header: 'ID',
      size: 270,
      minSize: 270,
      maxSize: 270,
      cell: ({ row }) => <div className="text-muted-foreground">{row.original.id}</div>,
    },
    {
      accessorKey: 'externalUUID',
      header: 'External UUID',
      size: 200,
      cell: ({ row }) => <div>{row.original.externalUUID}</div>,
    },
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
      size: 200,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => {
        return <div className="font-bold">{row.original.description || '-'}</div>
      },
      minSize: 100,
      size: 400,
    },
    {
      accessorKey: 'satisfies',
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
                    id: control?.node?.id ?? '',
                    refCode: control?.node?.refCode ?? '',
                    referenceFramework: control?.node?.referenceFramework ?? '',
                    __typename: control?.node?.__typename,
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
      cell: ({ row }) => {
        const status = row.original.status
        if (!status) return '-'

        return (
          <div className="flex items-center space-x-2">
            {EvidenceIconMapper[status]}
            <p>{getEnumLabel(status)}</p>
          </div>
        )
      },
      size: 100,
    },
    {
      accessorKey: 'isAutomated',
      header: 'Automated',
      cell: ({ cell }) => {
        return <div className="font-bold">{cell.getValue() ? <Check size={16} /> : <Minus size={16} />}</div>
      },
      size: 100,
    },
    {
      accessorKey: 'collectionProcedure',
      header: 'Collection Procedure',
      cell: ({ row }) => {
        return <div className="font-bold">{row.original.collectionProcedure ? convertToReadOnly(row.original.collectionProcedure) : '-'}</div>
      },
      minSize: 100,
      size: 400,
    },
    {
      accessorKey: 'source',
      header: 'Source',
      cell: ({ row }) => {
        return <div className="font-bold">{row.original.source || '-'}</div>
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
    { accessorKey: 'scopeName', header: 'Scope', size: 120, cell: ({ cell }) => <CustomEnumChipCell value={cell.getValue() as string} field="scope" /> },
    { accessorKey: 'environmentName', header: 'Environment', size: 120, cell: ({ cell }) => <CustomEnumChipCell value={cell.getValue() as string} field="environment" /> },
    {
      accessorKey: 'tags',
      header: 'Tags',
      size: 140,
      cell: ({ row }) => <TagsCell tags={row.original.tags} />,
    },
    {
      header: 'Comments',
      accessorKey: 'comments',
      cell: ({ row }) => {
        return (
          <Link onClick={(e) => e.stopPropagation()} href={`/evidence?id=${row.original.id}&showComments=true`} className="flex items-center gap-2">
            <Badge>
              {row.original.comments?.totalCount ?? 0} Comments <LinkIcon size={12} className="ml-1 inline-block" />
            </Badge>
          </Link>
        )
      },
      minSize: 120,
    },
    {
      accessorKey: 'createdBy',
      header: 'Created by',
      size: 200,
      cell: ({ row }) => <UserCell user={userMap[row.original.createdBy ?? '']} />,
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      size: 150,
      cell: ({ row }) => <DateCell value={row.original.createdAt} />,
    },
    {
      accessorKey: 'updatedBy',
      header: 'Updated By',
      size: 200,
      cell: ({ row }) => <UserCell user={userMap[row.original.updatedBy ?? '']} />,
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last Updated',
      size: 100,
      cell: ({ row }) => <DateCell value={row.original.updatedAt} variant="timesince" />,
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

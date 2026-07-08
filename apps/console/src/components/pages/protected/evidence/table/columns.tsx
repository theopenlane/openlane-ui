import { type ColumnDef } from '@tanstack/react-table'
import { type Evidence, EvidenceEvidenceStatus, type User } from '@repo/codegen/src/schema.ts'
import { type AuthorToken } from '@/lib/authors'
import Link from 'next/link'
import React from 'react'
import { Check, LinkIcon, Minus, RefreshCw, Stamp } from 'lucide-react'
import { Button } from '@repo/ui/button'
import ControlChip from '@/components/pages/protected/controls/map-controls/shared/control-chip.tsx'
import { Badge } from '@repo/ui/badge'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { EvidenceIconMapper } from '@/components/shared/enum-mapper/evidence-enum'
import EvidenceFileChip from '@/components/pages/protected/evidence/table/evidence-file-chip.tsx'
import { AuthorCell } from '@/components/shared/user-display/author-cell'
import { TagsCell } from '@/components/shared/crud-base/columns/tags-cell'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { createSelectColumn } from '@/components/shared/crud-base/columns/select-column'
import { formatDate } from '@/utils/date.ts'
import { CustomEnumChipCell } from '@/components/shared/crud-base/columns/custom-enum-chip-cell'
import { TruncatedCell } from '@repo/ui/data-table'

type TGetEvidenceColumnsProps = {
  userMap: Record<string, User>
  tokenMap?: Record<string, AuthorToken>
  selectedEvidence: { id: string }[]
  setSelectedEvidence: React.Dispatch<React.SetStateAction<{ id: string }[]>>
  isAuditor?: boolean
  onApprove?: (evidence: Evidence) => void
  onRequestChanges?: (evidence: Evidence) => void
  auditorActionPending?: boolean
}

export const useGetEvidenceColumns = ({ userMap, tokenMap, selectedEvidence, setSelectedEvidence, isAuditor, onApprove, onRequestChanges, auditorActionPending }: TGetEvidenceColumnsProps) => {
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
      cell: ({ row }) => <TruncatedCell className="font-bold">{row.original.description || '-'}</TruncatedCell>,
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
      cell: ({ row }) => <AuthorCell id={row.original.createdBy} userMap={userMap} tokenMap={tokenMap} />,
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
      cell: ({ row }) => <AuthorCell id={row.original.updatedBy} userMap={userMap} tokenMap={tokenMap} />,
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last Updated',
      size: 100,
      cell: ({ row }) => <DateCell value={row.original.updatedAt} variant="timesince" />,
    },
  ]

  if (isAuditor) {
    columns.push({
      id: 'auditorActions',
      header: 'Actions',
      size: 290,
      minSize: 290,
      enableHiding: false,
      cell: ({ row }) => {
        const evidence = row.original
        const alreadyApproved = evidence.status === EvidenceEvidenceStatus.AUDITOR_APPROVED
        return (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Button type="button" className="h-7 px-2" icon={<Stamp size={14} />} iconPosition="left" disabled={auditorActionPending || alreadyApproved} onClick={() => onApprove?.(evidence)}>
              Approve
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-7 px-2"
              icon={<RefreshCw size={14} />}
              iconPosition="left"
              disabled={auditorActionPending}
              onClick={() => onRequestChanges?.(evidence)}
            >
              Request Changes
            </Button>
          </div>
        )
      },
    })
  }

  const mappedColumns = columns
    .filter((column): column is { accessorKey: string; header: string } => 'accessorKey' in column && typeof column.accessorKey === 'string' && 'header' in column && typeof column.header === 'string')
    .map((column) => ({
      accessorKey: column.accessorKey,
      header: column.header,
    }))

  return { columns, mappedColumns }
}

import { ColumnDef, Row } from '@tanstack/react-table'
import { Evidence, User } from '@repo/codegen/src/schema.ts'
import React from 'react'
import { EvidenceIconMapper, EvidenceStatusMapper } from '@/components/shared/enum-mapper/evidence-enum'
import { Check, Minus } from 'lucide-react'
import ControlChip from '@/components/pages/protected/controls/map-controls/shared/control-chip.tsx'
import { formatDate, formatTimeSince } from '@/utils/date.ts'
import { Avatar } from '@/components/shared/avatar/avatar.tsx'
import EvidenceFileChip from '@/components/pages/protected/evidence/table/evidence-file-chip.tsx'
import TagChip from '@/components/shared/tag-chip.tsx/tag-chip'
import { Checkbox } from '@repo/ui/checkbox'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'

type TGetEvidenceColumnsProps = {
  userMap: Record<string, User>
  selectedEvidence: { id: string }[]
  setSelectedEvidence: React.Dispatch<React.SetStateAction<{ id: string }[]>>
}

export const useGetEvidenceColumns = ({ userMap, selectedEvidence, setSelectedEvidence }: TGetEvidenceColumnsProps) => {
  const { convertToReadOnly } = usePlateEditor()
  const toggleSelection = (evidence: { id: string }) => {
    setSelectedEvidence((prev) => {
      const exists = prev.some((c) => c.id === evidence.id)
      return exists ? prev.filter((c) => c.id !== evidence.id) : [...prev, evidence]
    })
  }
  const columns: ColumnDef<Evidence>[] = [
    {
      id: 'select',
      header: ({ table }) => {
        const currentPageEvidence = table.getRowModel().rows.map((row) => row.original)
        const allSelected = currentPageEvidence.every((evidence) => selectedEvidence.some((sc) => sc.id === evidence.id))

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked: boolean) => {
                const newSelections = checked
                  ? [...selectedEvidence.filter((sc) => !currentPageEvidence.some((c) => c.id === sc.id)), ...currentPageEvidence.map((c) => ({ id: c.id }))]
                  : selectedEvidence.filter((sc) => !currentPageEvidence.some((c) => c.id === sc.id))

                setSelectedEvidence(newSelections)
              }}
            />
          </div>
        )
      },
      cell: ({ row }: { row: Row<Evidence> }) => {
        const { id } = row.original
        const isChecked = selectedEvidence.some((c) => c.id === id)

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
      minSize: 270,
      maxSize: 270,
      cell: ({ row }) => <div className="text-muted-foreground">{row.original.id}</div>,
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
      cell: ({ cell }) => {
        return <div className="font-bold">{cell.getValue() as string}</div>
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
      cell: ({ row }) => {
        const status = row.original.status!
        return (
          <div className="flex items-center space-x-2">
            {EvidenceIconMapper[status]}
            <p>{EvidenceStatusMapper[status]}</p>
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
      minSize: 100,
      size: 100,
    },
    {
      accessorKey: 'collectionProcedure',
      header: 'Collection Procedure',
      cell: ({ cell }) => {
        return <div className="font-bold">{cell.getValue() ? convertToReadOnly(cell.getValue() as string) : '-'}</div>
      },
      minSize: 100,
      size: 400,
    },
    {
      accessorKey: 'source',
      header: 'Source',
      cell: ({ cell }) => {
        return <div className="font-bold">{(cell.getValue() as string) || '-'}</div>
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
        return <div className="flex gap-2 flex-wrap">{row?.original?.tags?.map((tag, i) => <TagChip key={i} tag={tag} />)}</div>
      },
    },
    {
      accessorKey: 'createdBy',
      header: 'Created by',
      size: 200,
      cell: ({ row }) => {
        const user = userMap?.[row.original.createdBy ?? '']
        return user ? (
          <div className="flex items-center gap-2">
            <Avatar entity={user} />
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
        const user = userMap?.[row.original.updatedBy ?? '']
        return user ? (
          <div className="flex items-center gap-2">
            <Avatar entity={user} />
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

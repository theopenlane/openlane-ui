import { ColumnDef, Row } from '@tanstack/react-table'
import React from 'react'
import { ApiToken, Procedure, User } from '@repo/codegen/src/schema.ts'
import { formatDate, formatTimeSince } from '@/utils/date'
import { KeyRound } from 'lucide-react'
import { Avatar } from '@/components/shared/avatar/avatar.tsx'
import { Badge } from '@repo/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { DocumentStatusBadge, DocumentStatusTooltips } from '@/components/shared/enum-mapper/policy-enum'
import { Checkbox } from '@repo/ui/checkbox'

type TProceduresColumnsProps = {
  users?: User[]
  tokens?: ApiToken[]
  selectedProcedures: { id: string }[]
  setSelectedProcedures: React.Dispatch<React.SetStateAction<{ id: string }[]>>
}

export const getProceduresColumns = ({ users, tokens, selectedProcedures, setSelectedProcedures }: TProceduresColumnsProps) => {
  const toggleSelection = (procedure: { id: string }) => {
    setSelectedProcedures((prev) => {
      const exists = prev.some((c) => c.id === procedure.id)
      return exists ? prev.filter((c) => c.id !== procedure.id) : [...prev, procedure]
    })
  }
  const columns: ColumnDef<Procedure>[] = [
    {
      id: 'select',
      header: ({ table }) => {
        const currentPageProcedures = table.getRowModel().rows.map((row) => row.original)
        const allSelected = currentPageProcedures.every((procedure) => selectedProcedures.some((sc) => sc.id === procedure.id))

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked: boolean) => {
                const newSelections = checked
                  ? [...selectedProcedures.filter((sc) => !currentPageProcedures.some((c) => c.id === sc.id)), ...currentPageProcedures.map((c) => ({ id: c.id }))]
                  : selectedProcedures.filter((sc) => !currentPageProcedures.some((c) => c.id === sc.id))

                setSelectedProcedures(newSelections)
              }}
            />
          </div>
        )
      },
      cell: ({ row }: { row: Row<Procedure> }) => {
        const { id } = row.original
        const isChecked = selectedProcedures.some((c) => c.id === id)

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={isChecked} onCheckedChange={() => toggleSelection({ id })} />
          </div>
        )
      },
      size: 20,
      maxSize: 20,
      minSize: 20,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      minSize: 100,
      size: 100,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ cell }) => (
        <div className="flex items-center gap-2">
          {cell.row.original.status && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DocumentStatusBadge status={cell.row.original.status} />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{DocumentStatusTooltips[cell.row.original.status]}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      ),
      maxSize: 80,
      size: 80,
    },
    {
      accessorKey: 'summary',
      minSize: 200,
      size: 100,
      header: 'Summary',
      meta: {
        className: 'w-[40%] min-w-[300px]', // CSS class for responsive width
      },
      cell: ({ cell }) => {
        const summary = cell.getValue() as string
        return <div className="line-clamp-4">{summary === '' ? 'N/A' : summary}</div>
      },
    },
    {
      accessorKey: 'approvalRequired',
      header: 'Approval Required',
      size: 40,
      minSize: 40,
      cell: ({ cell }) => (cell.getValue() ? 'Yes' : 'No'),
    },
    {
      accessorKey: 'approver',
      header: 'Approver',
      size: 160,
      cell: ({ row }) => {
        const approver = row.original.approver
        return approver ? (
          <div className="flex items-center gap-2">
            <Avatar entity={approver} />
            {approver.displayName || '-'}
          </div>
        ) : (
          <span className="text-muted-foreground italic">-</span>
        )
      },
    },
    {
      accessorKey: 'delegate',
      header: 'Delegate',
      size: 160,
      cell: ({ row }) => {
        const delegate = row.original.delegate
        return delegate ? (
          <div className="flex items-center gap-2">
            <Avatar entity={delegate} />
            {delegate.displayName || '-'}
          </div>
        ) : (
          <span className="text-muted-foreground italic">-</span>
        )
      },
    },
    {
      accessorKey: 'procedureType',
      header: 'Type',
      size: 120,
      cell: ({ cell }) => cell.getValue() || '-',
    },
    {
      accessorKey: 'reviewDue',
      header: 'Review Due',
      size: 100,
      cell: ({ cell }) => {
        const value = cell.getValue() as string | null
        return value ? formatDate(value) : '-'
      },
    },
    {
      accessorKey: 'reviewFrequency',
      header: 'Review Frequency',
      size: 100,
      cell: ({ cell }) => {
        const value = cell.getValue<string>()
        return <span className="capitalize">{value ? value.toLowerCase() : '-'}</span>
      },
    },
    {
      accessorKey: 'revision',
      header: 'Revision',
      size: 100,
      cell: ({ cell }) => cell.getValue()?.toString() ?? '-',
    },
    {
      accessorKey: 'tags',
      header: 'Tags',
      size: 140,
      cell: ({ row }) => {
        const tags = row.original.tags
        if (!tags?.length) return '-'
        return (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, i) => (
              <Badge key={i} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        )
      },
    },
    {
      accessorKey: 'createdBy',
      header: 'Created by',
      size: 150,
      maxSize: 180,
      cell: ({ row }) => {
        const userId = row.original.createdBy
        const token = tokens?.find((item) => item.id === userId)
        const user = users?.find((item) => item.id === userId)

        if (!token && !user) {
          return 'Deleted user'
        }

        return (
          <div className="flex items-center gap-2">
            {token ? <KeyRound size={18} /> : <Avatar entity={user} />}
            {token ? token.name : user?.displayName || '-'}
          </div>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      size: 120,
      maxSize: 120,
      cell: ({ cell }) => <span className="whitespace-nowrap">{formatDate(cell.getValue() as string)}</span>,
    },
    {
      accessorKey: 'updatedBy',
      header: 'Updated by',
      size: 150,
      maxSize: 180,
      cell: ({ row }) => {
        const userId = row.original.updatedBy
        const token = tokens?.find((item) => item.id === userId)
        const user = users?.find((item) => item.id === userId)

        if (!token && !user) {
          return 'Deleted user'
        }

        return (
          <div className="flex items-center gap-2">
            {token ? <KeyRound size={18} /> : <Avatar entity={user} />}
            {token ? token.name : user?.displayName || '-'}
          </div>
        )
      },
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last Updated',
      size: 100,
      maxSize: 100,
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

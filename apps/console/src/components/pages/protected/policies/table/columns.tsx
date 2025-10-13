import { ColumnDef, Row } from '@tanstack/react-table'
import { ApiToken, InternalPolicy, User } from '@repo/codegen/src/schema.ts'
import { formatDate, formatTimeSince } from '@/utils/date'
import { Avatar } from '@/components/shared/avatar/avatar.tsx'
import { KeyRound } from 'lucide-react'
import React from 'react'
import { Badge } from '@repo/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { DocumentStatusBadge, DocumentStatusTooltips } from '@/components/shared/enum-mapper/policy-enum'
import { Checkbox } from '@repo/ui/checkbox'

type TPoliciesColumnsProps = {
  users?: User[]
  tokens?: ApiToken[]
  selectedPolicies: { id: string }[]
  setSelectedPolicies: React.Dispatch<React.SetStateAction<{ id: string }[]>>
}

export const getPoliciesColumns = ({ users, tokens, selectedPolicies, setSelectedPolicies }: TPoliciesColumnsProps) => {
  const toggleSelection = (policy: { id: string }) => {
    setSelectedPolicies((prev) => {
      const exists = prev.some((c) => c.id === policy.id)
      return exists ? prev.filter((c) => c.id !== policy.id) : [...prev, policy]
    })
  }
  const columns: ColumnDef<InternalPolicy>[] = [
    {
      id: 'select',
      header: ({ table }) => {
        const currentPagePolicies = table.getRowModel().rows.map((row) => row.original)
        const allSelected = currentPagePolicies.every((policy) => selectedPolicies.some((sc) => sc.id === policy.id))

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked: boolean) => {
                const newSelections = checked
                  ? [...selectedPolicies.filter((sc) => !currentPagePolicies.some((c) => c.id === sc.id)), ...currentPagePolicies.map((c) => ({ id: c.id }))]
                  : selectedPolicies.filter((sc) => !currentPagePolicies.some((c) => c.id === sc.id))

                setSelectedPolicies(newSelections)
              }}
            />
          </div>
        )
      },
      cell: ({ row }: { row: Row<InternalPolicy> }) => {
        const { id } = row.original
        const isChecked = selectedPolicies.some((c) => c.id === id)

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={isChecked} onCheckedChange={() => toggleSelection({ id })} />
          </div>
        )
      },
      size: 50,
    },
    {
      accessorKey: 'name',
      header: 'Name',
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
      minSize: 150,
      size: 100,
    },
    {
      accessorKey: 'summary',
      header: 'Summary',
      enableResizing: true,
      minSize: 100,
      size: 300,
      cell: ({ cell }) => {
        const summary = cell.getValue() as string
        return <div className="line-clamp-4 text-justify">{summary === '' ? 'N/A' : summary}</div>
      },
    },
    {
      accessorKey: 'approvalRequired',
      header: 'Approval Required',
      size: 140,
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
      accessorKey: 'policyType',
      header: 'Type',
      size: 120,
      cell: ({ cell }) => cell.getValue() || '-',
    },
    {
      accessorKey: 'reviewDue',
      header: 'Review Due',
      size: 130,
      cell: ({ cell }) => {
        const value = cell.getValue() as string | null
        return value ? formatDate(value) : '-'
      },
    },
    {
      accessorKey: 'reviewFrequency',
      header: 'Review Frequency',
      size: 140,
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
      accessorKey: 'updatedBy',
      header: 'Updated By',
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
      size: 120,
      maxSize: 120,
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

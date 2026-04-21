import { type ColumnDef } from '@tanstack/react-table'
import { type FindingsNodeNonNull } from '@/lib/graphql-hooks/finding'
import { type ColumnOptions } from '@/components/shared/crud-base/page'
import { createSelectColumn } from '@/components/shared/crud-base/columns/select-column'
import { UserCell } from '@/components/shared/crud-base/columns/user-cell'
import { TagsCell } from '@/components/shared/crud-base/columns/tags-cell'
import { BooleanCell } from '@/components/shared/crud-base/columns/boolean-cell'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { CustomEnumChipCell } from '@/components/shared/crud-base/columns/custom-enum-chip-cell'
import { TruncatedCell } from '@repo/ui/data-table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Button } from '@repo/ui/button'
import { MoreHorizontal, ShieldCheck, ListTodo } from 'lucide-react'
import { getSeverityStyle } from '@/utils/severity'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import React from 'react'

type FindingColumnOptions = ColumnOptions & {
  onTrackRemediation?: (row: FindingsNodeNonNull) => void
  onOpenRemediation?: (row: FindingsNodeNonNull) => void
  onCreateTask?: (row: FindingsNodeNonNull) => void
}

export const getColumns = ({ userMap, selectedItems, setSelectedItems, onTrackRemediation, onOpenRemediation, onCreateTask }: FindingColumnOptions): ColumnDef<FindingsNodeNonNull>[] => {
  const columns: ColumnDef<FindingsNodeNonNull>[] = [
    createSelectColumn<FindingsNodeNonNull>(selectedItems, setSelectedItems),
    { accessorKey: 'id', header: 'ID', size: 120, cell: ({ row }) => <div className="text-muted-foreground">{row.original.id}</div> },
    { accessorKey: 'displayID', header: 'Display ID', size: 140, cell: ({ cell }) => cell.getValue() || '' },
    { accessorKey: 'displayName', header: 'Display Name', size: 180, cell: ({ cell }) => cell.getValue() || '' },
    {
      accessorKey: 'description',
      header: 'Description',
      size: 240,
      minSize: 150,
      cell: ({ cell }) => {
        const value = (cell.getValue() as string) || ''
        if (!value) return ''
        return <TruncatedCell>{value}</TruncatedCell>
      },
    },
    { accessorKey: 'category', header: 'Category', size: 130 },
    { accessorKey: 'severity', header: 'Severity', size: 100 },
    {
      accessorKey: 'securityLevel',
      header: 'Severity Level',
      size: 120,
      cell: ({ cell }) => {
        const val = cell.getValue() as string | null | undefined
        if (!val) return ''
        return (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={getSeverityStyle(val)}>
            {val.toLowerCase()}
          </span>
        )
      },
    },
    { accessorKey: 'findingStatusName', header: 'Status', size: 120, cell: ({ cell }) => <CustomEnumChipCell value={cell.getValue() as string} objectType="finding" field="status" /> },
    { accessorKey: 'numericSeverity', header: 'Numeric Severity', size: 130 },
    { accessorKey: 'priority', header: 'Priority', size: 100 },
    { accessorKey: 'score', header: 'Score', size: 90 },
    { accessorKey: 'exploitability', header: 'Exploitability', size: 120 },
    { accessorKey: 'impact', header: 'Impact', size: 90 },
    { accessorKey: 'vector', header: 'Vector', size: 160 },
    { accessorKey: 'open', header: 'Open', size: 80, cell: ({ cell }) => <BooleanCell value={cell.getValue() as boolean | null | undefined} /> },
    { accessorKey: 'production', header: 'Production', size: 100, cell: ({ cell }) => <BooleanCell value={cell.getValue() as boolean | null | undefined} /> },
    { accessorKey: 'validated', header: 'Validated', size: 100, cell: ({ cell }) => <BooleanCell value={cell.getValue() as boolean | null | undefined} /> },
    { accessorKey: 'public', header: 'Public', size: 80, cell: ({ cell }) => <BooleanCell value={cell.getValue() as boolean | null | undefined} /> },
    { accessorKey: 'blocksProduction', header: 'Blocks Production', size: 130, cell: ({ cell }) => <BooleanCell value={cell.getValue() as boolean | null | undefined} /> },
    { accessorKey: 'externalID', header: 'External ID', size: 150 },
    { accessorKey: 'externalOwnerID', header: 'External Owner', size: 140 },
    { accessorKey: 'externalURI', header: 'External URI', size: 160 },
    { accessorKey: 'source', header: 'Source', size: 120 },
    { accessorKey: 'findingClass', header: 'Finding Class', size: 130, cell: ({ cell }) => getEnumLabel(cell.getValue() as string) },
    { accessorKey: 'remediationSLA', header: 'Remediation SLA (days)', size: 160 },
    { accessorKey: 'environmentName', header: 'Environment', size: 120, cell: ({ cell }) => <CustomEnumChipCell value={cell.getValue() as string} field="environment" /> },
    { accessorKey: 'scopeName', header: 'Scope', size: 120, cell: ({ cell }) => <CustomEnumChipCell value={cell.getValue() as string} field="scope" /> },
    { accessorKey: 'reportedAt', header: 'Reported At', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} /> },
    { accessorKey: 'eventTime', header: 'Event Time', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} /> },
    { accessorKey: 'sourceUpdatedAt', header: 'Source Updated At', size: 140, cell: ({ cell }) => <DateCell value={cell.getValue() as string} /> },
    { accessorKey: 'createdAt', header: 'Created At', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} /> },
    {
      accessorKey: 'createdBy',
      header: 'Created By',
      size: 160,
      cell: ({ row }) => <UserCell user={userMap[row.original.createdBy ?? '']} fallback={row.original.createdBy ?? undefined} />,
    },
    { accessorKey: 'updatedAt', header: 'Updated At', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} variant="timesince" /> },
    {
      accessorKey: 'updatedBy',
      header: 'Updated By',
      size: 160,
      cell: ({ row }) => <UserCell user={userMap[row.original.updatedBy ?? '']} fallback={row.original.updatedBy ?? undefined} />,
    },
    {
      accessorKey: 'categories',
      header: 'Categories',
      size: 160,
      cell: ({ row }) => <TagsCell tags={row.original.categories as string[] | null | undefined} wrap={false} />,
    },
  ]

  if (onTrackRemediation || onOpenRemediation || onCreateTask) {
    columns.push({
      id: 'actions',
      header: '',
      size: 50,
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              {(row.original.remediations?.totalCount ?? 0) > 0
                ? onOpenRemediation && (
                    <DropdownMenuItem onClick={() => onOpenRemediation(row.original)}>
                      <ShieldCheck className="h-4 w-4" />
                      Open Remediation
                    </DropdownMenuItem>
                  )
                : onTrackRemediation && (
                    <DropdownMenuItem onClick={() => onTrackRemediation(row.original)}>
                      <ShieldCheck className="h-4 w-4" />
                      Track Remediation
                    </DropdownMenuItem>
                  )}
              {onCreateTask && (
                <DropdownMenuItem onClick={() => onCreateTask(row.original)}>
                  <ListTodo className="h-4 w-4" />
                  Create Task
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    })
  }

  return columns
}

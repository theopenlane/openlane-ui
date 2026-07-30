import { type ColumnDef } from '@tanstack/react-table'
import { type VulnerabilitiesNodeNonNull } from '@/lib/graphql-hooks/vulnerability'
import { type ColumnOptions } from '@/components/shared/crud-base/page'
import { createSelectColumn } from '@/components/shared/crud-base/columns/select-column'
import { AuthorCell } from '@/components/shared/user-display/author-cell'
import { TagsCell } from '@/components/shared/crud-base/columns/tags-cell'
import { BooleanCell } from '@/components/shared/crud-base/columns/boolean-cell'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { CustomEnumChipCell } from '@/components/shared/crud-base/columns/custom-enum-chip-cell'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Button } from '@repo/ui/button'
import { MoreHorizontal, ShieldCheck, ShieldOff, ListTodo } from 'lucide-react'
import { SeverityChip } from '@/components/shared/severity/severity-chip'
import { type SlaDaysByLevel } from '@/lib/sla'
import { SlaDueDateCell } from '@/components/shared/crud-base/columns/sla-due-date-cell'
import React from 'react'
import { TruncatedCell } from '@repo/ui/data-table'
import { getDismissReasonLabel } from '@/components/pages/protected/exposure/vulnerability-dismiss-reasons'

type VulnColumnOptions = ColumnOptions & {
  onTrackRemediation?: (row: VulnerabilitiesNodeNonNull) => void
  onOpenRemediation?: (row: VulnerabilitiesNodeNonNull) => void
  onCreateTask?: (row: VulnerabilitiesNodeNonNull) => void
  onDismiss?: (row: VulnerabilitiesNodeNonNull) => void
  slaDaysByLevel?: SlaDaysByLevel
}

export const getColumns = ({
  userMap,
  tokenMap,
  convertToReadOnly,
  selectedItems,
  setSelectedItems,
  onTrackRemediation,
  onOpenRemediation,
  onCreateTask,
  onDismiss,
  slaDaysByLevel,
}: VulnColumnOptions): ColumnDef<VulnerabilitiesNodeNonNull>[] => {
  const columns: ColumnDef<VulnerabilitiesNodeNonNull>[] = [
    createSelectColumn<VulnerabilitiesNodeNonNull>(selectedItems, setSelectedItems),
    { accessorKey: 'id', header: 'ID', size: 120, cell: ({ row }) => <div className="text-muted-foreground">{row.original.id}</div> },
    { accessorKey: 'displayID', header: 'Display ID', size: 140, cell: ({ cell }) => cell.getValue() || '' },
    { accessorKey: 'displayName', header: 'Display Name', size: 160, cell: ({ cell }) => cell.getValue() || '' },
    { accessorKey: 'externalID', header: 'External ID', size: 160 },
    { accessorKey: 'severity', header: 'Severity', size: 100 },
    {
      accessorKey: 'securityLevel',
      header: 'Severity Level',
      size: 120,
      cell: ({ cell }) => <SeverityChip severity={cell.getValue<string | null>()} />,
    },
    {
      accessorKey: 'vulnerabilityStatusName',
      header: 'Status',
      size: 120,
      cell: ({ cell }) => <CustomEnumChipCell value={cell.getValue() as string} objectType="vulnerability" field="status" />,
    },
    { accessorKey: 'priority', header: 'Priority', size: 100 },
    { accessorKey: 'score', header: 'Score', size: 90 },
    { accessorKey: 'exploitability', header: 'Exploitability', size: 120 },
    { accessorKey: 'impact', header: 'Impact', size: 90 },
    { accessorKey: 'cveID', header: 'CVE ID', size: 140 },
    { accessorKey: 'packageName', header: 'Package Name', size: 160 },
    { accessorKey: 'packageEcosystem', header: 'Package Ecosystem', size: 160 },
    { accessorKey: 'vulnerableVersionRange', header: 'Vulnerable Version Range', size: 180 },
    { accessorKey: 'firstPatchedVersion', header: 'First Patched Version', size: 160 },
    { accessorKey: 'category', header: 'Category', size: 120 },
    { accessorKey: 'source', header: 'Source', size: 120 },
    { accessorKey: 'vector', header: 'Vector', size: 160 },
    { accessorKey: 'remediationSLA', header: 'Remediation SLA (days)', size: 160 },
    {
      id: 'dueDate',
      header: 'Due Date',
      size: 130,
      cell: ({ row }) => <SlaDueDateCell createdAt={row.original.createdAt} securityLevel={row.original.securityLevel} open={row.original.open} slaDaysByLevel={slaDaysByLevel ?? {}} />,
    },
    { accessorKey: 'open', header: 'Open', size: 80, cell: ({ cell }) => <BooleanCell value={cell.getValue() as boolean | null | undefined} /> },
    {
      accessorKey: 'dismissedReason',
      header: 'Dismissed Reason',
      size: 170,
      cell: ({ cell }) => getDismissReasonLabel(cell.getValue() as string | null | undefined),
    },
    { accessorKey: 'dismissedAt', header: 'Dismissed At', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string | null | undefined} /> },
    { accessorKey: 'blocking', header: 'Blocking', size: 90, cell: ({ cell }) => <BooleanCell value={cell.getValue() as boolean | null | undefined} /> },
    { accessorKey: 'production', header: 'Production', size: 100, cell: ({ cell }) => <BooleanCell value={cell.getValue() as boolean | null | undefined} /> },
    { accessorKey: 'validated', header: 'Validated', size: 100, cell: ({ cell }) => <BooleanCell value={cell.getValue() as boolean | null | undefined} /> },
    { accessorKey: 'public', header: 'Public', size: 80, cell: ({ cell }) => <BooleanCell value={cell.getValue() as boolean | null | undefined} /> },
    { accessorKey: 'environmentName', header: 'Environment', size: 120, cell: ({ cell }) => <CustomEnumChipCell value={cell.getValue() as string} field="environment" /> },
    { accessorKey: 'scopeName', header: 'Scope', size: 120, cell: ({ cell }) => <CustomEnumChipCell value={cell.getValue() as string} field="scope" /> },
    { accessorKey: 'externalOwnerID', header: 'External Owner', size: 140 },
    { accessorKey: 'externalURI', header: 'External URI', size: 160 },
    { accessorKey: 'summary', header: 'Summary', size: 200, cell: ({ row }) => <TruncatedCell>{row.original.summary || '-'}</TruncatedCell> },
    { accessorKey: 'description', header: 'Description', size: 200, minSize: 150, cell: ({ cell }) => convertToReadOnly?.(cell.getValue() as string) || '' },
    { accessorKey: 'discoveredAt', header: 'Discovered At', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} /> },
    { accessorKey: 'publishedAt', header: 'Published At', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} /> },
    { accessorKey: 'sourceUpdatedAt', header: 'Source Updated At', size: 140, cell: ({ cell }) => <DateCell value={cell.getValue() as string} /> },
    { accessorKey: 'createdAt', header: 'Created At', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} /> },
    {
      accessorKey: 'createdBy',
      header: 'Created By',
      size: 160,
      cell: ({ row }) => <AuthorCell id={row.original.createdBy} userMap={userMap} tokenMap={tokenMap} />,
    },
    { accessorKey: 'updatedAt', header: 'Updated At', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} variant="timesince" /> },
    {
      accessorKey: 'updatedBy',
      header: 'Updated By',
      size: 160,
      cell: ({ row }) => <AuthorCell id={row.original.updatedBy} userMap={userMap} tokenMap={tokenMap} />,
    },
    {
      accessorKey: 'tags',
      header: 'Tags',
      size: 160,
      cell: ({ row }) => <TagsCell tags={row.original.tags} wrap={false} />,
    },
  ]

  if (onTrackRemediation || onOpenRemediation || onCreateTask || onDismiss) {
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
              {onDismiss && !row.original.dismissedAt && (
                <DropdownMenuItem onClick={() => onDismiss(row.original)}>
                  <ShieldOff className="h-4 w-4" />
                  Accept Risk
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

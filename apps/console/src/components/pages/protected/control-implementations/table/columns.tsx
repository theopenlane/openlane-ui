import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { RelatedControlsCell } from '@/components/shared/crud-base/columns/related-controls-cell'
import { createSelectColumn } from '@/components/shared/crud-base/columns/select-column'
import { TagsCell } from '@/components/shared/crud-base/columns/tags-cell'
import { type ColumnOptions } from '@/components/shared/crud-base/page'
import { DocumentStatusBadge } from '@/components/shared/enum-mapper/policy-enum'
import { AuthorCell } from '@/components/shared/user-display/author-cell'
import { type ColumnDef } from '@repo/ui/table-types'
import { VerifiedLabel } from '../verified-label'
import { type ControlImplementationRow } from './types'

export const getColumns = ({ userMap, tokenMap, selectedItems, setSelectedItems }: ColumnOptions): ColumnDef<ControlImplementationRow>[] => [
  createSelectColumn<ControlImplementationRow>(selectedItems, setSelectedItems),
  { accessorKey: 'title', header: 'Title', size: 260, minSize: 180 },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 140,
    cell: ({ row }) =>
      row.original.status ? (
        <div className="w-fit">
          <DocumentStatusBadge status={row.original.status} />
        </div>
      ) : (
        '-'
      ),
  },
  { accessorKey: 'verified', header: 'Verified', size: 110, cell: ({ row }) => <VerifiedLabel verified={row.original.verified} /> },
  {
    accessorKey: 'controls',
    header: 'Linked Controls',
    size: 340,
    cell: ({ row }) => <RelatedControlsCell controlEdges={row.original.controlEdges} subcontrolEdges={row.original.subcontrolEdges} />,
  },
  { accessorKey: 'implementationDate', header: 'Implementation Date', size: 170, cell: ({ row }) => <DateCell value={row.original.implementationDate} /> },
  { accessorKey: 'verificationDate', header: 'Verification Date', size: 170, cell: ({ row }) => <DateCell value={row.original.verificationDate} /> },
  { accessorKey: 'tags', header: 'Tags', size: 160, cell: ({ row }) => <TagsCell tags={row.original.tags} /> },
  { accessorKey: 'createdAt', header: 'Created At', size: 150, cell: ({ row }) => <DateCell value={row.original.createdAt} variant="timesince" /> },
  { accessorKey: 'createdBy', header: 'Created By', size: 180, cell: ({ row }) => <AuthorCell id={row.original.createdBy} userMap={userMap} tokenMap={tokenMap} /> },
  { accessorKey: 'updatedAt', header: 'Updated At', size: 150, cell: ({ row }) => <DateCell value={row.original.updatedAt} variant="timesince" /> },
  { accessorKey: 'updatedBy', header: 'Updated By', size: 180, cell: ({ row }) => <AuthorCell id={row.original.updatedBy} userMap={userMap} tokenMap={tokenMap} /> },
]

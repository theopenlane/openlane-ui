import { FilterField, SelectFilterField } from '@/types'
import { ControlControlStatus, ControlListFieldsFragment, ControlOrderField, Group, OrderDirection, User } from '@repo/codegen/src/schema.ts'
import { ColumnDef } from '@tanstack/react-table'
import SubcontrolCell from './subcontrol-cell'
import { Avatar } from '@/components/shared/avatar/avatar'
import { formatDate } from '@/utils/date'
import { ControlIconMapper } from '@/components/shared/icon-enum/control-enum'
import StandardChip from '../../standards/shared/standard-chip'

const statusLabels: Record<ControlControlStatus, string> = {
  APPROVED: 'Approved',
  ARCHIVED: 'Archived',
  CHANGES_REQUESTED: 'Changes requested',
  NEEDS_APPROVAL: 'Needs approval',
  NOT_IMPLEMENTED: 'Not implemented',
  PREPARING: 'Preparing',
}

const statusOptions = Object.values(ControlControlStatus).map((status) => ({
  label: statusLabels[status],
  value: status,
}))
export const CONTROLS_FILTER_FIELDS: FilterField[] = [
  { key: 'refCode', label: 'RefCode', type: 'text' },
  { key: 'program', label: 'Program', type: 'containsText' },
  { key: 'standard', label: 'Standard', type: 'containsText' },
  { key: 'category', label: 'Category', type: 'containsText' },
  { key: 'subcategory', label: 'Subcategory', type: 'containsText' },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: statusOptions,
  } as SelectFilterField,
]

export const CONTROLS_SORT_FIELDS = [
  { key: 'created_at', label: 'Created At' },
  { key: 'updated_at', label: 'Updated At' },
  { key: 'STATUS', label: 'Status' },
  { key: 'SOURCE', label: 'Source' },
  { key: 'CONTROL_TYPE', label: 'Control Type' },
  { key: 'category', label: 'Category' },
  { key: 'subcategory', label: 'Subcategory' },
  { key: 'CONTROL_OWNER_name', label: 'Owners' },
  {
    key: 'ref_code',
    label: 'Ref',
    default: {
      key: ControlOrderField.ref_code,
      direction: OrderDirection.ASC,
    },
  },
]

type Params = {
  convertToReadOnly: (value: string, depth: number) => React.ReactNode
  userMap: Record<string, User>
}

export const getControlColumns = ({ convertToReadOnly, userMap }: Params): ColumnDef<ControlListFieldsFragment>[] => {
  return [
    {
      header: 'Name',
      accessorKey: 'refCode',
      cell: ({ row }) => <div className="font-bold">{row.getValue('refCode')}</div>,
      size: 50,
      maxSize: 90,
    },
    {
      header: 'Description',
      accessorKey: 'description',
      cell: ({ row }) => {
        const referenceFramework = row.original.referenceFramework
        const description = convertToReadOnly(row.getValue('description') as string, 0)

        return (
          <div>
            <div className="line-clamp-3 text-justify">{description}</div>
            <div className="mt-2 border-t border-dotted pt-2 flex flex-wrap gap-2">
              <StandardChip referenceFramework={referenceFramework ?? ''} />
            </div>
          </div>
        )
      },
      size: 200,
      minSize: 150,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      size: 160,
      cell: ({ row }) => {
        const value: ControlControlStatus = row.getValue('status')
        const label = statusLabels[value] ?? value
        return (
          <div className="flex items-center space-x-2">
            {ControlIconMapper[value]}
            <p>{label}</p>
          </div>
        )
      },
    },
    {
      header: 'Category',
      accessorKey: 'category',
      size: 120,
      cell: ({ row }) => <div>{row.getValue('category') || '-'}</div>,
    },
    {
      header: 'Subcategory',
      accessorKey: 'subcategory',
      cell: ({ row }) => <div>{row.getValue('subcategory') || '-'}</div>,
    },
    {
      header: 'Owner',
      accessorKey: ControlOrderField.CONTROL_OWNER_name,
      cell: ({ row }) => {
        const owner = row.original.controlOwner
        return (
          <div className="flex items-center gap-2">
            <Avatar entity={owner as Group} variant="small" />
            <span>{owner?.displayName ?? '-'}</span>
          </div>
        )
      },
    },
    {
      header: 'Reference ID',
      accessorKey: 'referenceID',
      size: 120,
      cell: ({ row }) => <div>{row.getValue('referenceID') || '-'}</div>,
    },
    {
      header: 'Auditor Reference ID',
      accessorKey: 'auditorReferenceID',
      size: 120,
      cell: ({ row }) => <div>{row.getValue('auditorReferenceID') || '-'}</div>,
    },
    {
      header: 'Source',
      accessorKey: 'source',
      size: 120,
      cell: ({ row }) => <div>{row.getValue('source') || '-'}</div>,
    },
    {
      header: 'Control Type',
      accessorKey: 'controlType',
      size: 120,
      cell: ({ row }) => <div>{row.getValue('controlType') || '-'}</div>,
    },
    {
      header: 'Reference Framework',
      accessorKey: 'referenceFramework',
      size: 120,
      cell: ({ row }) => <div>{row.getValue('referenceFramework') || '-'}</div>,
    },
    {
      header: 'Subcontrol',
      accessorKey: 'subcontrol',
      size: 200,
      cell: SubcontrolCell,
    },
    {
      header: 'Delegate',
      accessorKey: 'delegate',
      cell: ({ row }) => {
        const delegate = row.original.delegate
        return delegate ? (
          <div className="flex items-center gap-2">
            <Avatar entity={delegate as Group} />
            {delegate.displayName || '-'}
          </div>
        ) : (
          <span>-</span>
        )
      },
    },
    {
      header: 'Created By',
      accessorKey: 'createdBy',
      size: 160,
      cell: ({ row }) => {
        const user = userMap[row.original.createdBy ?? '']
        return user ? (
          <div className="flex items-center space-x-1">
            <Avatar entity={user} className="w-[24px] h-[24px]" />
            <p>{user.displayName}</p>
          </div>
        ) : (
          <span className="text-muted-foreground italic">Deleted user</span>
        )
      },
    },
    {
      header: 'Created At',
      accessorKey: 'createdAt',
      size: 130,
      cell: ({ cell }) => formatDate(cell.getValue() as string),
    },
    {
      header: 'Updated By',
      accessorKey: 'updatedBy',
      size: 160,
      cell: ({ row }) => {
        const user = userMap[row.original.updatedBy ?? '']
        return user ? (
          <div className="flex items-center space-x-1">
            <Avatar entity={user} className="w-[24px] h-[24px]" />
            <p>{user.displayName}</p>
          </div>
        ) : (
          <span className="text-muted-foreground italic">Deleted user</span>
        )
      },
    },
    {
      header: 'Updated At',
      accessorKey: 'updatedAt',
      size: 130,
      cell: ({ cell }) => formatDate(cell.getValue() as string),
    },
  ]
}

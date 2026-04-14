import { type ColumnDef } from '@tanstack/react-table'
import { type IdentityHoldersNodeNonNull } from '@/lib/graphql-hooks/identity-holder'
import { type ColumnOptions } from '@/components/shared/crud-base/page'
import { type IdentityHolderUserStatus } from '@repo/codegen/src/schema.ts'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { PersonnelStatusBadge } from '@/components/shared/enum-mapper/personnel-enum'
import { UserCell } from '@/components/shared/crud-base/columns/user-cell'
import { BooleanCell } from '@/components/shared/crud-base/columns/boolean-cell'
import { TagsCell } from '@/components/shared/crud-base/columns/tags-cell'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { createSelectColumn } from '@/components/shared/crud-base/columns/select-column'
import { CustomEnumChipCell } from '@/components/shared/crud-base/columns/custom-enum-chip-cell'
import { ResponsibilityCell } from '@/components/shared/crud-base/columns/responsibility-cell'
import { formatPhoneNumber } from '@/utils/strings'

export const getColumns = ({ userMap, selectedItems, setSelectedItems }: ColumnOptions): ColumnDef<IdentityHoldersNodeNonNull>[] => {
  return [
    createSelectColumn<IdentityHoldersNodeNonNull>(selectedItems, setSelectedItems),
    { accessorKey: 'id', header: 'ID', size: 120, cell: ({ row }) => <div className="text-muted-foreground">{row.original.id}</div> },
    { accessorKey: 'displayID', header: 'Display ID', size: 120 },
    { accessorKey: 'fullName', header: 'Full Name', size: 150, cell: ({ cell }) => cell.getValue() || '' },
    { accessorKey: 'email', header: 'Email', size: 200 },
    { accessorKey: 'alternateEmail', header: 'Alternate Email', size: 200 },
    { accessorKey: 'title', header: 'Title', size: 150 },
    { accessorKey: 'department', header: 'Department', size: 150 },
    { accessorKey: 'team', header: 'Team', size: 120 },
    { accessorKey: 'location', header: 'Location', size: 150 },
    { accessorKey: 'phoneNumber', header: 'Phone Number', size: 150, cell: ({ row }) => formatPhoneNumber(row.original.phoneNumber) || '-' },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 150,
      cell: ({ cell }) => {
        const value = cell.getValue() as IdentityHolderUserStatus
        return value ? <PersonnelStatusBadge status={value} /> : <div>-</div>
      },
    },
    {
      accessorKey: 'identityHolderType',
      header: 'Type',
      size: 120,
      cell: ({ cell }) => {
        const value = cell.getValue() as string
        return <div>{value ? getEnumLabel(value) : '-'}</div>
      },
    },
    { accessorKey: 'isActive', header: 'Active', size: 100, cell: ({ cell }) => <BooleanCell value={cell.getValue() as boolean | null | undefined} /> },
    { accessorKey: 'isOpenlaneUser', header: 'Openlane User', size: 120, cell: ({ cell }) => <BooleanCell value={cell.getValue() as boolean | null | undefined} /> },
    { accessorKey: 'startDate', header: 'Start Date', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} /> },
    { accessorKey: 'endDate', header: 'End Date', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} /> },
    { accessorKey: 'externalUserID', header: 'External User ID', size: 150 },
    { accessorKey: 'externalReferenceID', header: 'External Reference ID', size: 170 },
    { accessorKey: 'environmentName', header: 'Environment', size: 120, cell: ({ cell }) => <CustomEnumChipCell value={cell.getValue() as string} field="environment" /> },
    { accessorKey: 'scopeName', header: 'Scope', size: 120, cell: ({ cell }) => <CustomEnumChipCell value={cell.getValue() as string} field="scope" /> },
    {
      accessorKey: 'internalOwner',
      header: 'Internal Owner',
      size: 160,
      cell: ({ row }) => <ResponsibilityCell userMap={userMap} user={row.original.internalOwnerUser} group={row.original.internalOwnerGroup} stringValue={row.original.internalOwner} />,
    },
    { accessorKey: 'tags', header: 'Tags', size: 180, cell: ({ row }) => <TagsCell tags={row.original.tags} /> },
    { accessorKey: 'createdAt', header: 'Created At', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} /> },
    {
      accessorKey: 'createdBy',
      header: 'Created By',
      size: 160,
      cell: ({ row }) => <UserCell user={userMap[row.original.createdBy ?? '']} />,
    },
    { accessorKey: 'updatedAt', header: 'Updated At', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} /> },
    {
      accessorKey: 'updatedBy',
      header: 'Updated By',
      size: 160,
      cell: ({ row }) => <UserCell user={userMap[row.original.updatedBy ?? '']} />,
    },
  ]
}

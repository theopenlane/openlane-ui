import { type ColumnDef } from '@tanstack/react-table'
import { type User } from '@repo/codegen/src/schema'
import { type CampaignsNodeNonNull } from '@/lib/graphql-hooks/campaign'
import { formatDate } from '@/utils/date'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { UserCell } from '@/components/shared/crud-base/columns/user-cell'
import { TagsCell } from '@/components/shared/crud-base/columns/tags-cell'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { createSelectColumn } from '@/components/shared/crud-base/columns/select-column'

type ColumnOptions = {
  userMap: Record<string, User>
  selectedCampaigns: { id: string }[]
  setSelectedCampaigns: React.Dispatch<React.SetStateAction<{ id: string }[]>>
}

export const getCampaignColumns = ({ userMap, selectedCampaigns, setSelectedCampaigns }: ColumnOptions): ColumnDef<CampaignsNodeNonNull>[] => {
  return [
    createSelectColumn<CampaignsNodeNonNull>(selectedCampaigns, setSelectedCampaigns),
    {
      accessorKey: 'id',
      header: 'ID',
      size: 270,
      minSize: 270,
      maxSize: 270,
      cell: ({ row }) => <div className="text-muted-foreground">{row.original.displayID}</div>,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ cell }) => <div>{cell.getValue() as string}</div>,
      size: 200,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status ?? ''
        return <p>{getEnumLabel(status)}</p>
      },
      size: 120,
    },
    {
      accessorKey: 'campaignType',
      header: 'Type',
      cell: ({ row }) => {
        const campaignType = row.original.campaignType ?? ''
        return <p>{getEnumLabel(campaignType)}</p>
      },
      size: 160,
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ cell }) => formatDate(cell.getValue() as string | null),
      size: 120,
    },
    {
      accessorKey: 'recipientCount',
      header: 'Recipients',
      cell: ({ cell }) => <p>{(cell.getValue() as number) ?? 0}</p>,
      size: 100,
    },
    {
      accessorKey: 'isRecurring',
      header: 'Recurring',
      cell: ({ cell }) => <p>{(cell.getValue() as boolean) ? 'Yes' : 'No'}</p>,
      size: 100,
    },
    {
      accessorKey: 'completedAt',
      header: 'Completed',
      cell: ({ cell }) => formatDate(cell.getValue() as string | null),
      size: 120,
    },
    {
      accessorKey: 'tags',
      header: 'Tags',
      size: 140,
      cell: ({ row }) => <TagsCell tags={row.original.tags} />,
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
      cell: ({ cell }) => <DateCell value={cell.getValue() as string} />,
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
      cell: ({ cell }) => <DateCell value={cell.getValue() as string} variant="timesince" />,
    },
  ]
}

import { type ColumnDef } from '@tanstack/react-table'
import { type SubscribersNode } from '@/lib/graphql-hooks/subscriber'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { BooleanCell } from '@/components/shared/crud-base/columns/boolean-cell'
import { createRowActionsColumn } from '@/components/shared/crud-base/columns/row-actions-column'
import { BellOff, Trash2 } from 'lucide-react'

type GetSubscriberColumnsArgs = {
  canEdit: boolean
  onUnsubscribe: (email: string) => void
  onDelete: (email: string) => void
}

const subscriberStatusLabel = (subscriber: SubscribersNode): string => {
  if (subscriber.unsubscribed) {
    return 'Unsubscribed'
  }

  if (subscriber.active) {
    return 'Active'
  }

  return 'Pending'
}

export const getSubscriberColumns = ({ canEdit, onUnsubscribe, onDelete }: GetSubscriberColumnsArgs): ColumnDef<SubscribersNode>[] => {
  const columns: ColumnDef<SubscribersNode>[] = [
    { accessorKey: 'email', header: 'Email', size: 260 },
    {
      id: 'status',
      header: 'Status',
      size: 140,
      cell: ({ row }) => <div>{subscriberStatusLabel(row.original)}</div>,
    },
    {
      accessorKey: 'verifiedEmail',
      header: 'Verified',
      cell: ({ cell }) => <BooleanCell value={cell.getValue() as boolean} />,
    },
    {
      accessorKey: 'createdAt',
      header: 'Subscribed',
      size: 140,
      cell: ({ cell }) => <DateCell value={cell.getValue() as string} />,
    },
  ]

  if (canEdit) {
    columns.push(
      createRowActionsColumn<SubscribersNode>({
        actions: [
          { label: 'Unsubscribe', icon: <BellOff size={16} />, onClick: (row) => onUnsubscribe(row.email), disabled: (row) => !!row.unsubscribed },
          { label: 'Remove', icon: <Trash2 size={16} />, onClick: (row) => onDelete(row.email) },
        ],
      }),
    )
  }

  return columns
}

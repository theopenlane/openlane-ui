import { type ColumnDef } from '@tanstack/react-table'
import { type Subscriber } from '@repo/codegen/src/schema'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { BellOff, Trash2 } from 'lucide-react'

type GetSubscriberColumnsArgs = {
  canEdit: boolean
  onUnsubscribe: (email: string) => void
  onDelete: (email: string) => void
}

const subscriberStatusLabel = (subscriber: Subscriber): string => {
  if (subscriber.unsubscribed) {
    return 'Unsubscribed'
  }

  if (subscriber.active) {
    return 'Active'
  }

  return 'Pending'
}

export const getSubscriberColumns = ({ canEdit, onUnsubscribe, onDelete }: GetSubscriberColumnsArgs): ColumnDef<Subscriber>[] => {
  const columns: ColumnDef<Subscriber>[] = [
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
      size: 100,
      cell: ({ cell }) => <div>{cell.getValue() ? 'Yes' : 'No'}</div>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Subscribed',
      size: 140,
      cell: ({ cell }) => <DateCell value={cell.getValue() as string} />,
    },
  ]

  if (canEdit) {
    columns.push({
      id: 'actions',
      header: '',
      size: 90,
      cell: ({ row }) => {
        const subscriber = row.original

        return (
          <div className="flex gap-3 justify-end">
            {!subscriber.unsubscribed && (
              <button type="button" className="text-muted-foreground" title="Unsubscribe" onClick={() => onUnsubscribe(subscriber.email)}>
                <BellOff size={16} />
              </button>
            )}
            <button type="button" className="text-muted-foreground" title="Remove" onClick={() => onDelete(subscriber.email)}>
              <Trash2 size={16} />
            </button>
          </div>
        )
      },
    })
  }

  return columns
}

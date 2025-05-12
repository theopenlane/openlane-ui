import { ColumnDef } from '@tanstack/react-table'
import { SubscriberActions } from '@/components/pages/protected/organization/subscribers/actions/subscriber-actions.tsx'
import { GetAllSubscribersQuery } from '@repo/codegen/src/schema'
import EmailCell from '@/components/pages/protected/organization/subscribers/table/email-cell.tsx'

type SubscriberEdge = NonNullable<NonNullable<GetAllSubscribersQuery['subscribers']>['edges']>[number]

export type Subscriber = NonNullable<SubscriberEdge>['node']

export const subscribersColumns: ColumnDef<Subscriber>[] = [
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => {
      const email = `${row?.original?.email}`
      return <EmailCell email={email} />
    },
  },
  {
    accessorKey: 'active',
    header: 'Active',
  },
  {
    accessorKey: 'verifiedEmail',
    header: 'Verified Email',
  },
  {
    accessorKey: 'actions',
    header: '',
    cell: ({ cell }) => <SubscriberActions subscriberEmail={cell.row?.original?.email as string} />,
    size: 40,
  },
]

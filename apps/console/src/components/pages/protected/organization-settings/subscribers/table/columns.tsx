import { ColumnDef } from '@tanstack/react-table'
import { SubscriberActions } from '@/components/pages/protected/organization-settings/subscribers/actions/subscriber-actions.tsx'
import { GetAllSubscribersQuery } from '@repo/codegen/src/schema'
import EmailCell from '@/components/pages/protected/organization-settings/subscribers/table/email-cell.tsx'
import { formatDate } from '@/utils/date'

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
    accessorKey: 'createdAt',
    header: 'Created at',
    cell: ({ cell }) => <p>{formatDate(cell.row?.original?.createdAt)}</p>,
  },
  {
    accessorKey: 'actions',
    header: '',
    cell: ({ cell }) => <SubscriberActions subscriberEmail={cell.row?.original?.email as string} />,
    size: 40,
  },
]

export const exportableSubscriberColumns: {
  label: string
  accessor: (item: Subscriber) => string | number | null | undefined
}[] = [
  {
    label: 'Email',
    accessor: (item) => item?.email,
  },
  {
    label: 'Active',
    accessor: (item) => (item?.active ? 'Yes' : 'No'),
  },
  {
    label: 'Verified Email',
    accessor: (item) => (item?.verifiedEmail ? 'Yes' : 'No'),
  },
  {
    label: 'Created at',
    accessor: (item) => (item?.createdAt ? 'Yes' : 'No'),
  },
]

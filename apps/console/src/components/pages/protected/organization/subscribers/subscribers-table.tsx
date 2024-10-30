'use client'

import {
  GetAllSubscribersQuery,
  useGetAllSubscribersQuery,
} from '@repo/codegen/src/schema'
import { useSession } from 'next-auth/react'
import { pageStyles } from './page.styles'
import { useState, useEffect } from 'react'
import { Input } from '@repo/ui/input'
import { Copy } from 'lucide-react'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { useCopyToClipboard } from '@uidotdev/usehooks'
import { useToast } from '@repo/ui/use-toast'
import { SubscriberActions } from './actions/subscriber-actions'

type SubscriberEdge = NonNullable<
  NonNullable<GetAllSubscribersQuery['subscribers']>['edges']
>[number]

type Subscriber = NonNullable<SubscriberEdge>['node']

export const SubscribersTable = () => {
  const {
    subscribersSearchRow,
    subscribersSearchField,
    subscribersButtons,
    actionIcon,
    nameRow,
    copyIcon,
  } = pageStyles()
  const { data: session } = useSession()
  const [filteredSubscribers, setFilteredSubscribers] = useState<Subscriber[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedText, copyToClipboard] = useCopyToClipboard()
  const { toast } = useToast()

  const [{ data, fetching, error }, refetch] = useGetAllSubscribersQuery({
    pause: !session,
  })

  useEffect(() => {
    if (copiedText) {
      toast({
        title: 'Copied to clipboard',
        variant: 'success',
      })
    }
  }, [copiedText])

  useEffect(() => {
    if (data?.subscribers?.edges) {
      const subscribers = data.subscribers.edges.map(edge => edge?.node).filter(node => node !== null) as Subscriber[]
      setFilteredSubscribers(subscribers)
    }
  }, [data])

  if (error || fetching) return null

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value.toLowerCase()
    setSearchTerm(searchValue)

    if (data?.subscribers?.edges) {
      const filtered = data.subscribers.edges.filter(
        (edge) => {
          const email = edge?.node?.email.toLowerCase() || ''
          return email.includes(searchValue)
        },
      )
      const filteredSubscribers = filtered.map(edge => edge?.node).filter(node => node !== null) as Subscriber[]
      setFilteredSubscribers(filteredSubscribers)
    }
  }

  const columns: ColumnDef<Subscriber>[] = [
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => {
        const email = `${row?.original?.email}`
        return (
          <div className={nameRow()}>
            {email}
            <Copy
              width={16}
              height={16}
              className={copyIcon()}
              onClick={() => copyToClipboard(email)}
            />
          </div>
        )
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
      accessorKey: 'email',
      header: '',
      cell: ({ cell }) => (
         <SubscriberActions
          subscriberEmail={cell.getValue() as string}
          refetchSubscribers={refetch}
        />
      ),
      size: 40,
    },
  ]

  return (
    <div>
      <div className={subscribersSearchRow()}>
        <div className={subscribersSearchField()}>
          <Input
            placeholder="Search for user"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>
      <DataTable columns={columns} data={filteredSubscribers} />
    </div>
  )
}

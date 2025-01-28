'use client'
import { GetVendorQuery, useGetVendorQuery } from '@repo/codegen/src/schema'
import { useSession } from 'next-auth/react'
import { pageStyles } from './page.styles'
import { useState, useEffect } from 'react'
import { Input } from '@repo/ui/input'
import { Copy } from 'lucide-react'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { useCopyToClipboard } from '@uidotdev/usehooks'
import { useToast } from '@repo/ui/use-toast'
import { Button } from '@repo/ui/button'
import { PlusIcon } from 'lucide-react'
import { formatDate } from '@/lib/format-date'

type VendorEdge = NonNullable<NonNullable<GetVendorQuery['entities']>['edges']>[number]

type Vendor = NonNullable<VendorEdge>['node']

export const VendorsTable = () => {
  const { vendorSearchRow, vendorSearchField, vendorButtons, actionIcon, nameRow, copyIcon } = pageStyles()
  const { data: session } = useSession()
  const [vendors, setVendor] = useState<Vendor[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedText, copyToClipboard] = useCopyToClipboard()
  const { toast } = useToast()

  const [{ data, fetching, error }, refetch] = useGetVendorQuery({
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
    if (data?.entities?.edges) {
      const vendors = data.entities.edges.map((edge) => edge?.node).filter((node) => node !== null) as Vendor[]
      setVendor(vendors)
    }
  }, [data])

  if (error || fetching) return null

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value.toLowerCase()
    setSearchTerm(searchValue)
  }
  const handleCreateNew = () => {
    console.log('create new vendor')
  }
  const columns: ColumnDef<Vendor>[] = [
    {
      accessorKey: 'displayName',
      header: 'Name',
      cell: ({ row }) => {
        const displayName = `${row?.original?.displayName}`
        return (
          <div className={nameRow()}>
            {displayName}
            <Copy width={16} height={16} className={copyIcon()} onClick={() => copyToClipboard(displayName)} />
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = `${row?.original?.status}`
        return <div className={nameRow()}>{status}</div>
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => {
        const description = `${row?.original?.description}`
        return <div className={nameRow()}>{description}</div>
      },
    },
    {
      accessorKey: 'domains',
      header: 'Domains',
      cell: ({ row }) => {
        const domains = `${row?.original?.domains?.join(', ')}`
        return (
          <div className={nameRow()}>
            {domains}
            <Copy width={16} height={16} className={copyIcon()} onClick={() => copyToClipboard(domains)} />
          </div>
        )
      },
    },
    {
      accessorKey: 'tags',
      header: 'Tags',
      cell: ({ row }) => {
        const tags = `${row?.original?.tags?.join(', ')}`
        return <div className={nameRow()}>{tags}</div>
      },
    },
    {
      accessorKey: 'createdBy',
      header: 'Created By',
      cell: ({ row }) => {
        const createdBy = `${row?.original?.createdBy}`
        return <div className={nameRow()}>{createdBy}</div>
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ row }) => {
        const createdAt = `${row?.original?.createdAt}`
        return <div className={nameRow()}>{formatDate(createdAt)}</div>
      },
    },
    {
      accessorKey: 'updatedBy',
      header: 'Updated By',
      cell: ({ row }) => {
        const updatedBy = `${row?.original?.updatedBy}`
        return <div className={nameRow()}>{updatedBy}</div>
      },
    },
    {
      accessorKey: 'updatedAt',
      header: 'Updated At',
      cell: ({ row }) => {
        const updatedAt = `${row?.original?.updatedAt}`
        return <div className={nameRow()}>{formatDate(updatedAt)}</div>
      },
    },
  ]

  return (
    <div>
      <div className={vendorSearchRow()}>
        <div className={vendorSearchField()}>
          <Input placeholder="Search for Vendor" value={searchTerm} onChange={handleSearch} />
        </div>
        <Button icon={<PlusIcon />} iconPosition="left" onClick={handleCreateNew}>
          Create New
        </Button>
      </div>
      <DataTable columns={columns} data={vendors} />
    </div>
  )
}

'use client'
import { GetVendorQuery, useGetVendorQuery } from '@repo/codegen/src/schema'
import { useSession } from 'next-auth/react'
import { pageStyles } from './page.styles'
import { useState, useEffect } from 'react'
import { Input } from '@repo/ui/input'
import { Copy } from 'lucide-react'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef, VisibilityState } from '@tanstack/react-table'
import { useCopyToClipboard } from '@uidotdev/usehooks'
import { useToast } from '@repo/ui/use-toast'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@repo/ui/dropdown-menu'
import { PlusIcon, MoreVertical } from 'lucide-react'
import { formatDate } from '@/lib/format-date'
import { Actions } from './actions/actions'

type VendorEdge = NonNullable<NonNullable<GetVendorQuery['entities']>['edges']>[number]

type Vendor = NonNullable<VendorEdge>['node']

export const VendorsTable = () => {
  const { vendorSearchRow, vendorSearchField, vendorButtons, actionIcon, nameRow, nameRowDescription, vendorDescription, vendorTags, copyIcon } = pageStyles()
  const { data: session } = useSession()
  const [vendors, setVendor] = useState<Vendor[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedText, copyToClipboard] = useCopyToClipboard()
  const { toast } = useToast()

  const [{ data, fetching, error }, refetch] = useGetVendorQuery({
    pause: !session,
  })

  const columns: ColumnDef<Vendor>[] = [
    {
      accessorKey: 'displayName',
      key: 'displayName',
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
      key: 'displayName',
      cell: ({ row }) => {
        const status = `${row?.original?.status}`
        return <div className={nameRow()}>{status}</div>
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      key: 'displayName',
      cell: ({ row }) => {
        const description = `${row?.original?.description}`
        const tags = row?.original?.tags as string[]
        return (
          <div className={nameRowDescription()}>
            <div className={vendorDescription()}>{description}</div>
            <div className={vendorTags()}>
              {tags.map((tag) => (
                <Badge key={tag} className="m-1 mt-0" variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'domains',
      header: 'Domains',
      cell: ({ row }) => {
        const domains = row?.original?.domains as string[]
        return (
          <div className={nameRow()}>
            {domains.map((domain) => (
              <span key={domain}>{domain}</span>
            ))}
            <Copy width={16} height={16} className={copyIcon()} onClick={() => copyToClipboard(domains)} />
          </div>
        )
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
    {
      accessorKey: 'id',
      header: 'Id',
      cell: ({ row }) => {
        const id = `${row?.original?.id}`
        return <div className={nameRow()}>{id}</div>
      },
    },
    {
      accessorKey: 'actions',
      header: '',
      cell: ({ cell }) => <Actions vendorId={cell.getValue() as string} />,
      size: 40,
      enableHiding: false,
    },
  ]

  const [filteredColumns, setFilteredColumns] = useState<ColumnDef<Vendor>[]>(columns)

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    displayName: true,
    status: true,
    description: true,
    domains: true,
    updatedBy: false,
    updatedAt: false,
    createdBy: false,
    createdAt: false,
    id: false,
  })
  const setDisplayNameVisibility = () => {
    setColumnVisibility((prev) => ({ ...prev, displayName: !columnVisibility.displayName }))
  }
  const setStatusVisibility = () => {
    setColumnVisibility((prev) => ({ ...prev, status: !columnVisibility.status }))
  }
  const setDescriptionVisibility = () => {
    setColumnVisibility((prev) => ({ ...prev, description: !columnVisibility.description }))
  }
  const setDomainsVisibility = () => {
    setColumnVisibility((prev) => ({ ...prev, domains: !columnVisibility.domains }))
  }
  const setUpdatedByVisibility = () => {
    setColumnVisibility((prev) => ({ ...prev, updatedBy: !columnVisibility.updatedBy }))
  }
  const setUpdatedAtVisibility = () => {
    setColumnVisibility((prev) => ({ ...prev, updatedAt: !columnVisibility.updatedAt }))
  }
  const setCreatedByVisibility = () => {
    setColumnVisibility((prev) => ({ ...prev, createdBy: !columnVisibility.createdBy }))
  }
  const setCreatedAtVisibility = () => {
    setColumnVisibility((prev) => ({ ...prev, createdAt: !columnVisibility.createdAt }))
  }
  const setIdVisibility = () => {
    setColumnVisibility((prev) => ({ ...prev, id: !columnVisibility.id }))
  }
  const setVisibility = (accessorKey: string) => {
    switch (accessorKey) {
      case 'displayName':
        setDisplayNameVisibility()
        break
      case 'status':
        setStatusVisibility()
        break
      case 'description':
        setDescriptionVisibility()
        break
      case 'domains':
        setDomainsVisibility()
        break
      case 'updatedBy':
        setUpdatedByVisibility()
        break
      case 'updatedAt':
        setUpdatedAtVisibility()
        break
      case 'createdBy':
        setCreatedByVisibility()
        break
      case 'createdAt':
        setCreatedAtVisibility()
        break
      case 'id':
        setIdVisibility()
        break
    }
  }

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

  return (
    <div>
      <div className={vendorSearchRow()}>
        <div className={vendorSearchField()}>
          <Input placeholder="Search for Vendor" value={searchTerm} onChange={handleSearch} />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="relative -left-[28%]">Columns</DropdownMenuTrigger>
          <DropdownMenuContent>
            {columns.map((column) => (
              <DropdownMenuItem key={`vendor-dropdown-${column.header}`} onClick={() => setVisibility(column.accessorKey)}>
                {column.header}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button icon={<PlusIcon />} iconPosition="left" onClick={handleCreateNew}>
          Create New
        </Button>
      </div>
      <DataTable columns={filteredColumns} data={vendors} columnVisibility={columnVisibility} loading={fetching} />
    </div>
  )
}

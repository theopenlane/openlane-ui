'use client'

import { useRouter } from 'next/navigation'
import { Button } from "@repo/ui/button"
import { PlusIcon } from 'lucide-react'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns'
import { useState } from 'react'
import { Input } from '@repo/ui/input'
import { pageStyles } from './page.styles'
import { Actions } from './actions/actions'

const ICON_SIZE = 12

type PoliciesEdge = any

type Policies = NonNullable<PoliciesEdge>['node']

export const PoliciesTable = () => {
  const router = useRouter()

  const {
    searchRow,
    searchField,
  } = pageStyles()

  const [filteredPolicies, setFilteredPolicies] = useState<Policies[]>([])

  const [searchTerm, setSearchTerm] = useState('')

  const handleCreateNew = () => {
    router.push('/policies-and-procedures/editor?type=policy')
  }

  // TODO: add table once backend is ready
  const columns: ColumnDef<Policies>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'description',
      header: 'Description',
    },
    {
      accessorKey: 'updatedAt',
      header: 'Updated At',
      cell: ({ cell }) =>
        format(new Date(cell.getValue() as string), 'dd MMM yyyy'),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ cell }) =>
        format(new Date(cell.getValue() as string), 'dd MMM yyyy'),
    },
    {
      accessorKey: 'id',
      header: '',
      cell: ({ cell }) => (
        <Actions
         policyId={cell.getValue() as string}
        //  refetchPolicies={refetch}
       />
     ),
      size: 40,
    },
  ]

  return (
    <>
      <div className={searchRow()}>
        <div className={searchField()}>
          <Input
            placeholder="search"
            value={searchTerm}
            // onChange={handleSearch}
          />
        </div>
        <Button            
            icon={<PlusIcon />}
            iconPosition="left"
            onClick={handleCreateNew}
            >
            Create New
        </Button>
      </div>

      <DataTable  columns={columns} data={filteredPolicies} />
    </>
  )
}

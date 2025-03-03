'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { PlusIcon } from 'lucide-react'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { useState, useEffect } from 'react'
import { Input } from '@repo/ui/input'
import { pageStyles } from './page.styles'
import { Actions } from './actions/actions'
import Link from 'next/link'
import { useCreateInternalPolicy, useGetInternalPoliciesList } from '@/lib/graphql-hooks/policy'

type PoliciesEdge = any
type Policies = NonNullable<PoliciesEdge>['node']

export const PoliciesTable = () => {
  const router = useRouter()

  const { searchRow, searchField } = pageStyles()

  const [filteredPolicies, setFilteredPolicies] = useState<Policies[]>([])

  const { data, isLoading: fetching } = useGetInternalPoliciesList()

  const { isPending: creating, mutateAsync: createPolicy } = useCreateInternalPolicy()

  useEffect(() => {
    if (data) {
      const policies = data?.internalPolicies?.edges?.map((e) => e?.node)
      if (policies) {
        setFilteredPolicies(policies)
      }
    }
  }, [data])

  const handleSearch = (e: React.FormEvent<HTMLInputElement>) => {
    setSearchTerm(e.currentTarget.value)
  }

  const [searchTerm, setSearchTerm] = useState('')

  const handleCreateNew = async () => {
    const data = await createPolicy({
      input: { name: 'Untitled Policy', status: 'new', version: '0.0.0', policyType: 'unknown' },
    })

    if (data.createInternalPolicy) {
      editPolicy(data.createInternalPolicy.internalPolicy.id)
      return
    }

    if (data.createInternalPolicy) {
      //TODO: add error toast
    }
  }

  const editPolicy = (policyId: string) => {
    router.push(`/policies/${policyId}`)
  }

  const columns: ColumnDef<Policies>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ cell, row }) => {
        return (
          <Link href={'/policies/' + row.original.id} className="underline">
            {cell.getValue() as string}
          </Link>
        )
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
    },
    {
      accessorKey: 'updatedAt',
      header: 'Updated At',
      cell: ({ cell }) => format(new Date(cell.getValue() as string), 'dd MMM yyyy'),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ cell }) => format(new Date(cell.getValue() as string), 'dd MMM yyyy'),
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
          <Input placeholder="search" disabled value={searchTerm} onChange={handleSearch} />
        </div>
        <Button icon={<PlusIcon />} iconPosition="left" onClick={handleCreateNew} disabled={creating}>
          Create New
        </Button>
      </div>

      <DataTable columns={columns} data={filteredPolicies} loading={fetching} />
    </>
  )
}

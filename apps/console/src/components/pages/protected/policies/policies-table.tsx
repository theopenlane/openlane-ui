'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { LoaderCircle, PlusCircle, SearchIcon } from 'lucide-react'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import React, { useState, useEffect, useMemo } from 'react'
import { Input } from '@repo/ui/input'
import { Actions } from './actions/actions'
import Link from 'next/link'
import { useCreateInternalPolicy, useGetInternalPoliciesList, useSearchInternalPolicies } from '@/lib/graphql-hooks/policy'
import { useDebounce } from '@uidotdev/usehooks'
import { cn } from '@repo/ui/lib/utils'
import { TableFilter } from '@/components/shared/table-filter/table-filter'
import { TableSort } from '@/components/shared/table-filter/table-sort'
import { FilterField } from '@/types'
import { GetInternalPoliciesListQueryVariables } from '@repo/codegen/src/schema'

type PoliciesEdge = any
type Policies = NonNullable<PoliciesEdge>['node']

export const PoliciesTable = () => {
  const router = useRouter()

  const [filteredPolicies, setFilteredPolicies] = useState<Policies[]>([])
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [orderBy, setOrderBy] = useState<GetInternalPoliciesListQueryVariables['orderBy']>()

  const whereFilter = useMemo(() => {
    const conditions: Record<string, any> = {
      ...filters,
    }

    return conditions
  }, [filters])

  const orderByFilter = useMemo(() => {
    return orderBy || undefined
  }, [orderBy])

  const { data, isLoading: fetching } = useGetInternalPoliciesList(whereFilter, orderByFilter)

  const { isPending: creating, mutateAsync: createPolicy } = useCreateInternalPolicy()

  const [searchTerm, setSearchTerm] = useState('')

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const { data: searchData, isLoading: searching } = useSearchInternalPolicies(debouncedSearchTerm)

  useEffect(() => {
    if (data && !searchTerm) {
      const policies = data?.internalPolicies?.edges?.map((e) => e?.node)
      if (policies) {
        setFilteredPolicies(policies)
      }
    }
  }, [data, searchTerm])

  useEffect(() => {
    if (searchTerm && searchData) {
      setFilteredPolicies(searchData?.internalPolicySearch?.internalPolicies || [])
      return
    }

    const policies = data?.internalPolicies?.edges?.map((e) => e?.node)
    if (policies) {
      setFilteredPolicies(policies)
    }
  }, [searchData])

  const handleCreateNew = async () => {
    const data = await createPolicy({
      input: { name: 'Untitled Policy' },
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
    router.push(`/policies/${policyId}/edit`)
  }

  const columns: ColumnDef<Policies>[] = [
    {
      accessorKey: 'displayID',
      header: 'Display ID',
      cell: ({ cell, row }) => {
        return <span className="whitespace-nowrap">{cell.getValue() as string}</span>
      },
    },
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
      accessorKey: 'policyType',
      header: 'Type',
    },
    {
      accessorKey: 'description',
      header: 'Description',
    },
    {
      accessorKey: 'updatedAt',
      header: 'Updated At',
      cell: ({ cell }) => <span className="whitespace-nowrap">{format(new Date(cell.getValue() as string), 'MMM dd, yyyy')}</span>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ cell }) => <span className="whitespace-nowrap">{format(new Date(cell.getValue() as string), 'MMM dd, yyyy')}</span>,
    },
    {
      accessorKey: 'id',
      header: '',
      cell: ({ cell }) => <Actions policyId={cell.getValue() as string} />,
      size: 40,
    },
  ]

  return (
    <>
      <PolicyDataTableToolbar
        className="my-5"
        creating={creating}
        searching={searching}
        handleCreateNew={handleCreateNew}
        setFilters={setFilters}
        onSortChange={setOrderBy}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <DataTable columns={columns} data={filteredPolicies} loading={fetching} />
    </>
  )
}

const InternalPolicyFilterableFields: FilterField[] = [
  { key: 'background', label: 'Background', type: 'text' },
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'description', label: 'Description', type: 'text' },
  { key: 'displayID', label: 'Display ID', type: 'text' },
  { key: 'hasBlockedGroups', label: 'Has Blocked Groups', type: 'boolean' },
  { key: 'hasControlObjectives', label: 'Has Control Objectives', type: 'boolean' },
  { key: 'hasControls', label: 'Has Controls', type: 'boolean' },
  { key: 'hasEditors', label: 'Has Editors', type: 'boolean' },
  { key: 'hasNarratives', label: 'Has Narratives', type: 'boolean' },
  { key: 'hasProcedures', label: 'Has Procedures', type: 'boolean' },
  { key: 'hasPrograms', label: 'Has Programs', type: 'boolean' },
  { key: 'policyType', label: 'Type', type: 'text' },
  { key: 'purposeAndScope', label: 'Purpose and Scope', type: 'text' },
  { key: 'reviewDue', label: 'Review Due', type: 'date' },
  { key: 'status', label: 'Status', type: 'text' },
  { key: 'version', label: 'Version', type: 'text' },

  { key: 'createdAt', label: 'Date Created', type: 'date' },
  { key: 'createdBy', label: 'Created By', type: 'text' },
  { key: 'updatedAt', label: 'Date Updated', type: 'date' },
  { key: 'updatedBy', label: 'Updated By', type: 'text' },
]

const InternalPolicySortableFields = [
  { key: 'created_at', label: 'Created At' },
  { key: 'updated_at', label: 'Updated At' },
]

type PolicyDataTableToolbarProps = {
  className?: string
  creating: boolean
  searching?: boolean
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  setFilters: (filters: Record<string, any>) => void
  onSortChange: (data: any) => void
  handleCreateNew: () => void
}
const PolicyDataTableToolbar: React.FC<PolicyDataTableToolbarProps> = ({ className, creating, searching, searchTerm, handleCreateNew, setFilters, onSortChange, setSearchTerm }) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="grow flex flex-row items-center gap-2">
        <TableFilter filterFields={InternalPolicyFilterableFields} onFilterChange={setFilters} />
        <TableSort sortFields={InternalPolicySortableFields} onSortChange={onSortChange} />
        <SearchInput value={searchTerm} onChange={setSearchTerm} searching={searching} />
      </div>

      <div className="grow flex flex-row items-center gap-2 justify-end">
        <Button icon={<PlusCircle />} iconPosition="left" onClick={handleCreateNew} disabled={creating}>
          Create new
        </Button>
      </div>
    </div>
  )
}

type SearchInputProps = {
  value: string
  onChange: (query: string) => void
  searching?: boolean
}
const SearchInput = ({ value, onChange, searching }: SearchInputProps) => {
  // prevent icon from flashing on quick calls
  const isSearching = useDebounce(searching, 200)

  return (
    <Input
      icon={isSearching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
      placeholder="Search"
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      variant="searchTable"
    />
  )
}

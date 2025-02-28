'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { LoaderCircle, PlusCircle, SearchIcon } from 'lucide-react'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import React, { useState, useEffect, useCallback } from 'react'
import { Input } from '@repo/ui/input'
import { Actions } from './actions/actions'
import { useCreateProcedureMutation, useGetProceduresListQuery, useSearchProceduresQuery } from '@repo/codegen/src/schema'
import Link from 'next/link'
import { useDebounce } from '@uidotdev/usehooks'
import { cn } from '@repo/ui/lib/utils'
import { TableFilter } from '@/components/shared/table-filter/table-filter'
import { TableSort } from '@/components/shared/table-filter/table-sort'
import { FilterField } from '@/types'

type ProceduresEdge = any
type Procedures = NonNullable<ProceduresEdge>['node']

export const ProceduresTable = () => {
  const router = useRouter()

  const [{ fetching: creating }, createProcedure] = useCreateProcedureMutation()

  const [filteredProcedures, setFilteredProcedures] = useState<Procedures[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [sort, setSort] = useState<Record<string, any>>({})

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const [{ data, fetching }, refetchList] = useGetProceduresListQuery({ variables: { where: filters } })
  const [{ data: searchData, fetching: searching }, refetchSearch] = useSearchProceduresQuery({ variables: { query: debouncedSearchTerm }, pause: !debouncedSearchTerm })

  const refetch = useCallback(() => {
    refetchSearch({ requestPolicy: 'network-only' })
    refetchList({ requestPolicy: 'network-only' })
  }, [refetchSearch, refetchList])

  useEffect(() => {
    if (data && !searchTerm) {
      const procedures = data?.procedures?.edges?.map((e) => e?.node)
      if (procedures) {
        setFilteredProcedures(procedures)
      }
    }
  }, [data, searchTerm])

  useEffect(() => {
    if (searchTerm && searchData) {
      setFilteredProcedures(searchData?.procedureSearch?.procedures || [])
      return
    }

    const Procedures = data?.procedures?.edges?.map((e) => e?.node)
    if (Procedures) {
      setFilteredProcedures(Procedures)
    }
  }, [searchData])

  const handleCreateNew = async () => {
    const { data, error } = await createProcedure({
      input: { name: 'Untitled Procedure', status: 'new', version: '0.0.0' },
    })

    if (error) {
      console.error(error)
    }

    if (data) {
      editProcedure(data.createProcedure.procedure.id)
    }
  }

  const editProcedure = (procedureId: string) => {
    router.push(`/procedures/${procedureId}/edit`)
  }

  const columns: ColumnDef<Procedures>[] = [
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
          <Link href={'/procedures/' + row.original.id} className="underline">
            {cell.getValue() as string}
          </Link>
        )
      },
    },
    {
      accessorKey: 'procedureType',
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
      cell: ({ cell }) => <Actions procedureId={cell.getValue() as string} refetchProcedures={refetch} />,
      size: 40,
    },
  ]

  return (
    <>
      <ProcedureDataTableToolbar
        className="my-5"
        creating={creating}
        handleCreateNew={handleCreateNew}
        setFilters={setFilters}
        setSort={setSort}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <DataTable columns={columns} data={filteredProcedures} loading={fetching} />
    </>
  )
}

const ProcedureFilterableFields: FilterField[] = [
  { key: 'background', label: 'Background', type: 'text' },
  { key: 'description', label: 'Description', type: 'text' },
  { key: 'displayID', label: 'Display ID', type: 'text' },
  { key: 'hasBlockedGroups', label: 'Has Blocked Groups', type: 'boolean' },
  { key: 'hasControls', label: 'Has Controls', type: 'boolean' },
  { key: 'hasEditors', label: 'Has Editors', type: 'boolean' },
  { key: 'hasInternalPolicies', label: 'Has Internal Policies', type: 'boolean' },
  { key: 'hasNarratives', label: 'Has Narratives', type: 'boolean' },
  { key: 'hasPrograms', label: 'Has Programs', type: 'boolean' },
  { key: 'hasRisks', label: 'Has Risks', type: 'boolean' },
  { key: 'hasTasks', label: 'Has Tasks', type: 'boolean' },
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'procedureType', label: 'Type', type: 'text' },
  { key: 'purposeAndScope', label: 'Purpose and Scope', type: 'text' },
  { key: 'reviewDue', label: 'Review Due', type: 'date' },
  { key: 'satisfies', label: 'Satisfies', type: 'date' },
  { key: 'status', label: 'Status', type: 'text' },
  { key: 'version', label: 'Version', type: 'text' },

  { key: 'createdAt', label: 'Date Created', type: 'date' },
  { key: 'createdBy', label: 'Created By', type: 'text' },
  { key: 'updatedAt', label: 'Date Updated', type: 'date' },
  { key: 'updatedBy', label: 'Updated By', type: 'text' },
]

const ProcedureSortableFields = [
  { key: 'name', label: 'Name' },
  { key: 'displayId', label: 'Display ID' },
  { key: 'createdAt', label: 'Date Created' },
  { key: 'updatedAt', label: 'Date Updated' },
]

type ProcedureDataTableToolbarProps = {
  className?: string
  creating: boolean
  searching?: boolean
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  setFilters: (filters: Record<string, any>) => void
  setSort: (sort: Record<string, any>) => void
  handleCreateNew: () => void
}
const ProcedureDataTableToolbar: React.FC<ProcedureDataTableToolbarProps> = ({ className, creating, searching, searchTerm, handleCreateNew, setFilters, setSort, setSearchTerm }) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="grow flex flex-row items-center gap-2">
        <TableFilter filterFields={ProcedureFilterableFields} onFilterChange={setFilters} />
        {/* <TableSort sortFields={ProcedureSortableFields} onSortChange={setSort} /> */}
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
      className="h-min py-1 px-2"
    />
  )
}

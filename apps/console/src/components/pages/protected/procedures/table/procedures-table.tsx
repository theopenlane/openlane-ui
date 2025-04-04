'use client'

import { useRouter } from 'next/navigation'
import { DataTable } from '@repo/ui/data-table'
import React, { useState, useEffect, useMemo } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { useCreateProcedure, useGetAllProcedures, useSearchProcedures } from '@/lib/graphql-hooks/procedures'
import { GetAllProceduresQueryVariables, OrderDirection, ProcedureOrderField } from '@repo/codegen/src/schema.ts'
import ProcedureDataTableToolbar from '@/components/pages/protected/procedures/table/procedures-table-toolbar.tsx'
import { proceduresColumns } from '@/components/pages/protected/procedures/table/columns.tsx'
import { PROCEDURE_SORTABLE_FIELDS } from '@/components/pages/protected/procedures/table/table-config.ts'

type ProceduresEdge = any
type Procedures = NonNullable<ProceduresEdge>['node']

const ProceduresTable: React.FC = () => {
  const router = useRouter()

  const { isPending: creating, mutateAsync: createProcedure } = useCreateProcedure()

  const [filteredProcedures, setFilteredProcedures] = useState<Procedures[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [orderBy, setOrderBy] = useState<GetAllProceduresQueryVariables['orderBy']>([
    {
      field: ProcedureOrderField.name,
      direction: OrderDirection.DESC,
    },
  ])

  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const orderByFilter = useMemo(() => {
    return orderBy || undefined
  }, [orderBy])

  const { data, isLoading: fetching } = useGetAllProcedures(filters, orderByFilter)
  const { data: searchData, isFetching: searching } = useSearchProcedures(debouncedSearchTerm)

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
    try {
      const data = await createProcedure({
        input: { name: 'Untitled Procedure' },
      })
      editProcedure(data.createProcedure.procedure.id)
    } catch (error) {
      console.error(error)
    }
  }

  const editProcedure = (procedureId: string) => {
    router.push(`/procedures/${procedureId}/edit`)
  }

  return (
    <>
      <ProcedureDataTableToolbar className="my-5" creating={creating} handleCreateNew={handleCreateNew} setFilters={setFilters} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <DataTable sortFields={PROCEDURE_SORTABLE_FIELDS} onSortChange={setOrderBy} columns={proceduresColumns} data={filteredProcedures} loading={fetching} />
    </>
  )
}

export default ProceduresTable

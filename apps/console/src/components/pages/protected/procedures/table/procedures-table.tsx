'use client'

import { useRouter } from 'next/navigation'
import { DataTable } from '@repo/ui/data-table'
import React, { useState, useMemo } from 'react'
import { useCreateProcedure, useFilteredProcedures } from '@/lib/graphql-hooks/procedures'
import { GetAllProceduresQueryVariables, OrderDirection, ProcedureOrderField } from '@repo/codegen/src/schema.ts'
import ProcedureDataTableToolbar from '@/components/pages/protected/procedures/table/procedures-table-toolbar.tsx'
import { proceduresColumns } from '@/components/pages/protected/procedures/table/columns.tsx'
import { PROCEDURE_SORTABLE_FIELDS } from '@/components/pages/protected/procedures/table/table-config.ts'

const ProceduresTable: React.FC = () => {
  const router = useRouter()

  const { isPending: creating, mutateAsync: createProcedure } = useCreateProcedure()

  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [orderBy, setOrderBy] = useState<GetAllProceduresQueryVariables['orderBy']>([
    {
      field: ProcedureOrderField.name,
      direction: OrderDirection.DESC,
    },
  ])

  const orderByFilter = useMemo(() => {
    return orderBy || undefined
  }, [orderBy])

  const { procedures, isLoading: fetching } = useFilteredProcedures(searchTerm, filters, orderByFilter)

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
      <DataTable sortFields={PROCEDURE_SORTABLE_FIELDS} onSortChange={setOrderBy} columns={proceduresColumns} data={procedures} loading={fetching} />
    </>
  )
}

export default ProceduresTable

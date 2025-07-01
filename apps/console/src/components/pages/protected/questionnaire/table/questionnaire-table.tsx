'use client'

import React, { useState, useMemo, useContext, useEffect } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { getQuestionnaireColumns } from './columns'
import QuestionnaireTableToolbar from '@/components/pages/protected/questionnaire/table/questionnaire-table-toolbar.tsx'
import { QUESTIONNAIRE_SORT_FIELDS } from '@/components/pages/protected/questionnaire/table/table-config.ts'
import { FilterTemplatesQueryVariables, OrderDirection, TemplateDocumentType, TemplateOrderField, TemplateWhereInput } from '@repo/codegen/src/schema.ts'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useDebounce } from '@uidotdev/usehooks'
import { useTemplates } from '@/lib/graphql-hooks/templates'
import { useRouter } from 'next/navigation'
import { VisibilityState } from '@tanstack/react-table'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

export const QuestionnairesTable = () => {
  const router = useRouter()
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const [filters, setFilters] = useState<TemplateWhereInput | null>(null)
  const { setCrumbs } = useContext(BreadcrumbContext)
  const [orderBy, setOrderBy] = useState<FilterTemplatesQueryVariables['orderBy']>([
    {
      field: TemplateOrderField.name,
      direction: OrderDirection.ASC,
    },
  ])

  const orderByFilter = useMemo(() => orderBy || undefined, [orderBy])

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)

  const whereFilter = useMemo(() => {
    return {
      templateType: TemplateDocumentType.DOCUMENT,
      nameContainsFold: debouncedSearch,
      ...filters,
    }
  }, [filters, debouncedSearch])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Questionnaires', href: '/questionnaires' },
    ])
  }, [setCrumbs])

  const { columns, mappedColumns } = getQuestionnaireColumns()

  const {
    templates,
    isLoading: fetching,
    paginationMeta,
  } = useTemplates({
    where: whereFilter,
    orderBy: orderByFilter,
    pagination,
    enabled: !!filters,
  })

  return (
    <div>
      <QuestionnaireTableToolbar
        creating={fetching}
        searchTerm={searchTerm}
        setSearchTerm={(inputVal) => {
          setSearchTerm(inputVal)
          setPagination(DEFAULT_PAGINATION)
        }}
        setFilters={setFilters}
        mappedColumns={mappedColumns}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
      />
      <DataTable
        sortFields={QUESTIONNAIRE_SORT_FIELDS}
        onSortChange={setOrderBy}
        columns={columns}
        data={templates}
        loading={fetching}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={paginationMeta}
        onRowClick={(row) => router.push(`/questionnaires/questionnaire-viewer?id=${row.id}`)}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
      />
    </div>
  )
}

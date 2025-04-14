'use client'

import { useState, useMemo } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { useFilteredTemplates } from '@/lib/graphql-hooks/templates'
import { questionnaireColumns } from '@/components/pages/protected/questionnaire/table/columns.tsx'
import QuestionnaireTableToolbar from '@/components/pages/protected/questionnaire/table/questionnaire-table-toolbar.tsx'
import { QUESTIONNAIRE_SORT_FIELDS } from '@/components/pages/protected/questionnaire/table/table-config.ts'
import { FilterTemplatesQueryVariables, OrderDirection, TemplateDocumentType, TemplateOrderField } from '@repo/codegen/src/schema.ts'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'

export const QuestionnairesTable = () => {
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [orderBy, setOrderBy] = useState<FilterTemplatesQueryVariables['orderBy']>([
    {
      field: TemplateOrderField.name,
      direction: OrderDirection.DESC,
    },
  ])
  const [searchTerm, setSearchTerm] = useState('')

  const whereFilter = useMemo(() => {
    return {
      templateType: TemplateDocumentType.DOCUMENT,
      ...filters,
    }
  }, [filters])

  const orderByFilter = useMemo(() => orderBy || undefined, [orderBy])

  const {
    templates,
    isLoading: fetching,
    isFetching,
    paginationMeta,
  } = useFilteredTemplates({
    search: searchTerm,
    where: whereFilter,
    orderBy: orderByFilter,
    pagination,
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
      />
      <DataTable
        sortFields={QUESTIONNAIRE_SORT_FIELDS}
        onSortChange={setOrderBy}
        columns={questionnaireColumns}
        data={templates}
        loading={fetching}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={paginationMeta}
      />
    </div>
  )
}

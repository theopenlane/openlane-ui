'use client'

import { useState, useMemo } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { questionnaireColumns } from '@/components/pages/protected/questionnaire/table/columns.tsx'
import QuestionnaireTableToolbar from '@/components/pages/protected/questionnaire/table/questionnaire-table-toolbar.tsx'
import { QUESTIONNAIRE_SORT_FIELDS } from '@/components/pages/protected/questionnaire/table/table-config.ts'
import { FilterTemplatesQueryVariables, OrderDirection, TemplateDocumentType, TemplateOrderField } from '@repo/codegen/src/schema.ts'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useDebounce } from '@uidotdev/usehooks'
import { useTemplates } from '@/lib/graphql-hooks/templates'
import { useRouter } from 'next/navigation'

export const QuestionnairesTable = () => {
  const router = useRouter()
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const [filters, setFilters] = useState<Record<string, any> | null>(null)
  const [orderBy, setOrderBy] = useState<FilterTemplatesQueryVariables['orderBy']>([
    {
      field: TemplateOrderField.name,
      direction: OrderDirection.DESC,
    },
  ])

  const orderByFilter = useMemo(() => orderBy || undefined, [orderBy])

  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)

  const whereFilter = useMemo(() => {
    return {
      templateType: TemplateDocumentType.DOCUMENT,
      nameContainsFold: debouncedSearch,
      ...filters,
    }
  }, [filters, debouncedSearch])

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
        onRowClick={(row) => router.push(`/questionnaires/questionnaire-viewer?id=${row.id}`)}
      />
    </div>
  )
}

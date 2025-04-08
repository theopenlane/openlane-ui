'use client'

import { useState, useMemo } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { useFilteredTemplates } from '@/lib/graphql-hooks/templates'
import { questionnaireColumns } from '@/components/pages/protected/questionnaire/table/columns.tsx'
import QuestionnaireTableToolbar from '@/components/pages/protected/questionnaire/table/questionnaire-table-toolbar.tsx'
import { QUESTIONNAIRE_SORT_FIELDS } from '@/components/pages/protected/questionnaire/table/table-config.ts'
import { FilterTemplatesQueryVariables, OrderDirection, TemplateDocumentType, TemplateOrderField } from '@repo/codegen/src/schema.ts'

export const QuestionnairesTable = () => {
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [orderBy, setOrderBy] = useState<FilterTemplatesQueryVariables['orderBy']>([
    {
      field: TemplateOrderField.name,
      direction: OrderDirection.DESC,
    },
  ])
  const [searchTerm, setSearchTerm] = useState('')
  const whereFilter = useMemo(() => {
    const conditions: Record<string, any> = {
      templateType: TemplateDocumentType.DOCUMENT,
      ...filters,
    }

    return conditions
  }, [filters])

  const orderByFilter = useMemo(() => {
    return orderBy || undefined
  }, [orderBy])

  const { templates, isLoading: fetching } = useFilteredTemplates(searchTerm, whereFilter, orderByFilter)

  return (
    <div>
      <QuestionnaireTableToolbar creating={fetching} searchTerm={searchTerm} setSearchTerm={setSearchTerm} setFilters={setFilters} />
      <DataTable sortFields={QUESTIONNAIRE_SORT_FIELDS} onSortChange={setOrderBy} columns={questionnaireColumns} data={templates} />
    </div>
  )
}

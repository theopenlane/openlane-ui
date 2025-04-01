'use client'

import { FilterTemplatesQueryVariables, GetAllTemplatesQuery, OrderDirection, TemplateDocumentType, TemplateOrderField } from '@repo/codegen/src/schema'
import { useState, useEffect, useMemo } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { useFilterTemplates } from '@/lib/graphql-hooks/templates'
import { questionnaireColumns } from '@/components/pages/protected/questionnaire/table/columns.tsx'
import QuestionnaireTableToolbar from '@/components/pages/protected/questionnaire/table/questionnaire-table-toolbar.tsx'
import { QUESTIONNAIRE_SORT_FIELDS } from '@/components/pages/protected/questionnaire/table/table-config.ts'

type TemplateEdge = NonNullable<NonNullable<GetAllTemplatesQuery['templates']>['edges']>[number]

type Template = NonNullable<TemplateEdge>['node']

export const QuestionnairesTable = () => {
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])
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

  const { data: data, isLoading: fetching, isError } = useFilterTemplates(whereFilter, orderByFilter)

  useEffect(() => {
    if (data?.templates?.edges) {
      const templates = data.templates.edges.map((edge) => edge?.node).filter((node) => node !== null) as Template[]
      setFilteredTemplates(templates)
    }
  }, [data])

  useEffect(() => {
    if (data?.templates?.edges) {
      const filtered = data.templates.edges.filter((edge) => {
        const email = edge?.node?.name.toLowerCase() || ''
        return email.includes(searchTerm)
      })
      const filteredSubscribers = filtered.map((edge) => edge?.node).filter((node) => node !== null) as Template[]
      setFilteredTemplates(filteredSubscribers)
    }
  }, [searchTerm])

  return (
    <div>
      <QuestionnaireTableToolbar creating={fetching} searchTerm={searchTerm} setSearchTerm={setSearchTerm} setFilters={setFilters} />
      <DataTable sortFields={QUESTIONNAIRE_SORT_FIELDS} onSortChange={setOrderBy} columns={questionnaireColumns} data={filteredTemplates} />
    </div>
  )
}

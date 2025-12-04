'use client'

import React, { useContext, useEffect, useMemo, useState } from 'react'
import { DataTable, getInitialSortConditions, getInitialPagination } from '@repo/ui/data-table'
import { getQuestionnaireColumns } from './columns'
import QuestionnaireTableToolbar from '@/components/pages/protected/questionnaire/table/questionnaire-table-toolbar.tsx'
import { QUESTIONNAIRE_SORT_FIELDS } from '@/components/pages/protected/questionnaire/table/table-config.ts'
import { FilterTemplatesQueryVariables, OrderDirection, Template, TemplateDocumentType, TemplateOrderField, TemplateWhereInput } from '@repo/codegen/src/schema.ts'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useDebounce } from '@uidotdev/usehooks'
import { useTemplates } from '@/lib/graphql-hooks/templates'
import { useRouter } from 'next/navigation'
import { ColumnDef, VisibilityState } from '@tanstack/react-table'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { exportToCSV } from '@/utils/exportToCSV'
import { useGetOrgUserList } from '@/lib/graphql-hooks/members'
import { useNotification } from '@/hooks/useNotification'
import { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu.tsx'
import { TableColumnVisibilityKeysEnum } from '@/components/shared/table-column-visibility/table-column-visibility-keys.ts'
import { TableKeyEnum } from '@repo/ui/table-key'

export const QuestionnairesTable = () => {
  const router = useRouter()
  const [pagination, setPagination] = useState<TPagination>(getInitialPagination(TableKeyEnum.QUESTIONNAIRE, DEFAULT_PAGINATION))
  const [filters, setFilters] = useState<TemplateWhereInput | null>(null)
  const { setCrumbs } = useContext(BreadcrumbContext)
  const { errorNotification } = useNotification()
  const defaultSorting = getInitialSortConditions(TableKeyEnum.QUESTIONNAIRE, TemplateOrderField, [
    {
      field: TemplateOrderField.name,
      direction: OrderDirection.ASC,
    },
  ])
  const [orderBy, setOrderBy] = useState<FilterTemplatesQueryVariables['orderBy']>(defaultSorting)

  const orderByFilter = useMemo(() => orderBy || undefined, [orderBy])

  const defaultVisibility: VisibilityState = {
    id: false,
    updatedBy: false,
    createdBy: false,
  }

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableColumnVisibilityKeysEnum.QUESTIONNAIRE, defaultVisibility))

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
    isError,
    isLoading: fetching,
    paginationMeta,
  } = useTemplates({
    where: whereFilter,
    orderBy: orderByFilter,
    pagination,
    enabled: !!filters,
  })

  const userIds = useMemo(() => {
    if (!templates) return []
    const ids = new Set<string>()
    templates.forEach((template) => {
      if (template.createdBy) ids.add(template.createdBy)
      if (template.updatedBy) ids.add(template.updatedBy)
    })
    return Array.from(ids)
  }, [templates])

  const { users, isFetching: fetchingUsers } = useGetOrgUserList({
    where: { hasUserWith: [{ idIn: userIds }] },
  })

  const userMap = useMemo(() => {
    const map: Record<string, (typeof users)[0]> = {}
    users?.forEach((u) => {
      map[u.id] = u
    })
    return map
  }, [users])

  const { columns, mappedColumns } = getQuestionnaireColumns({ userMap })

  function isVisibleColumn<T>(col: ColumnDef<T>): col is ColumnDef<T> & { accessorKey: string; header: string } {
    return 'accessorKey' in col && typeof col.accessorKey === 'string' && typeof col.header === 'string' && columnVisibility[col.accessorKey] !== false
  }
  const handleExport = () => {
    if (!templates || templates.length === 0) return
    const exportableColumns = columns.filter(isVisibleColumn).map((col) => {
      const key = col.accessorKey as keyof Template
      const label = col.header
      return {
        label,
        accessor: (template: Template) => {
          const value = template[key]
          return typeof value === 'string' || typeof value === 'number' ? value : ''
        },
      }
    })
    exportToCSV(templates, exportableColumns, 'questionnaires_list')
  }

  const handleRowClick = (row: Template) => {
    router.push(`/questionnaires/questionnaire-viewer?id=${row.id}`)
  }

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Questionnaires', href: '/questionnaires' },
    ])
  }, [setCrumbs])

  useEffect(() => {
    if (isError) {
      errorNotification({
        title: 'Error',
        description: 'Failed to load questionnaires',
      })
    }
  }, [isError, errorNotification])

  return (
    <div>
      <QuestionnaireTableToolbar
        handleExport={handleExport}
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
        exportEnabled={templates && templates.length > 0}
      />
      <DataTable
        sortFields={QUESTIONNAIRE_SORT_FIELDS}
        onSortChange={setOrderBy}
        columns={columns}
        data={templates}
        loading={fetching || fetchingUsers}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={paginationMeta}
        onRowClick={handleRowClick}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        defaultSorting={defaultSorting}
        tableKey={TableKeyEnum.QUESTIONNAIRE}
      />
    </div>
  )
}

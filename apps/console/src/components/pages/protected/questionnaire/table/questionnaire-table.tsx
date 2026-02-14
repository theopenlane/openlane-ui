'use client'

import { DataTable, getInitialSortConditions } from '@repo/ui/data-table'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import { getQuestionnaireColumns } from './columns'
import QuestionnaireTableToolbar from '@/components/pages/protected/questionnaire/table/questionnaire-table-toolbar.tsx'
import { QUESTIONNAIRE_SORT_FIELDS } from '@/components/pages/protected/questionnaire/table/table-config.ts'
import { OrderDirection, Assessment, AssessmentOrderField, AssessmentWhereInput, FilterAssessmentsQueryVariables } from '@repo/codegen/src/schema.ts'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useDebounce } from '@uidotdev/usehooks'
import { useAssessments } from '@/lib/graphql-hooks/assessment'
import { useRouter } from 'next/navigation'
import { ColumnDef, VisibilityState } from '@tanstack/react-table'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { exportToCSV } from '@/utils/exportToCSV'
import { useGetOrgUserList } from '@/lib/graphql-hooks/member'
import { useNotification } from '@/hooks/useNotification'
import { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu.tsx'
import { TableKeyEnum } from '@repo/ui/table-key'
import { canEdit } from '@/lib/authz/utils.ts'

export const QuestionnairesTable = () => {
  const router = useRouter()
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const [filters, setFilters] = useState<AssessmentWhereInput | null>(null)
  const { setCrumbs } = useContext(BreadcrumbContext)
  const { errorNotification } = useNotification()
  const [selectedQuestionnaires, setSelectedQuestionnaires] = useState<{ id: string }[]>([])

  const defaultSorting = getInitialSortConditions(TableKeyEnum.QUESTIONNAIRE, AssessmentOrderField, [
    {
      field: AssessmentOrderField.name,
      direction: OrderDirection.ASC,
    },
  ])
  const [orderBy, setOrderBy] = useState<FilterAssessmentsQueryVariables['orderBy']>(defaultSorting)

  const orderByFilter = useMemo(() => orderBy || undefined, [orderBy])

  const defaultVisibility: VisibilityState = {
    id: false,
    updatedBy: false,
    createdBy: false,
  }

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableKeyEnum.QUESTIONNAIRE, defaultVisibility))

  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)

  const whereFilter = useMemo(() => {
    return {
      nameContainsFold: debouncedSearch,
      ...filters,
    }
  }, [filters, debouncedSearch])

  const {
    assessments,
    isError,
    isLoading: fetching,
    paginationMeta,
  } = useAssessments({
    where: whereFilter,
    orderBy: orderByFilter,
    pagination,
    enabled: !!filters,
  })

  const userIds = useMemo(() => {
    if (!assessments) return []
    const ids = new Set<string>()
    assessments.forEach((assessment) => {
      if (assessment.createdBy) ids.add(assessment.createdBy)
      if (assessment.updatedBy) ids.add(assessment.updatedBy)
    })
    return Array.from(ids)
  }, [assessments])

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

  const { columns, mappedColumns } = getQuestionnaireColumns({ userMap, selectedQuestionnaires, setSelectedQuestionnaires })

  function isVisibleColumn<T>(col: ColumnDef<T>): col is ColumnDef<T> & { accessorKey: string; header: string } {
    return 'accessorKey' in col && typeof col.accessorKey === 'string' && typeof col.header === 'string' && columnVisibility[col.accessorKey] !== false
  }
  const handleExport = () => {
    if (!assessments || assessments.length === 0) return
    const exportableColumns = columns.filter(isVisibleColumn).map((col) => {
      const key = col.accessorKey as keyof Assessment
      const label = col.header
      return {
        label,
        accessor: (assessment: Assessment) => {
          const value = assessment[key]
          return typeof value === 'string' || typeof value === 'number' ? value : ''
        },
      }
    })
    exportToCSV(assessments, exportableColumns, 'questionnaires_list')
  }

  const handleRowClick = (row: Assessment) => {
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

  const handleClearSelectedQuestionnaires = () => {
    setSelectedQuestionnaires([])
  }

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
        exportEnabled={assessments && assessments.length > 0}
        selectedQuestionnaires={selectedQuestionnaires}
        setSelectedQuestionnaires={setSelectedQuestionnaires}
        canEdit={canEdit}
        handleClearSelectedQuestionnaires={handleClearSelectedQuestionnaires}
      />
      <DataTable
        sortFields={QUESTIONNAIRE_SORT_FIELDS}
        onSortChange={setOrderBy}
        columns={columns}
        data={assessments}
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

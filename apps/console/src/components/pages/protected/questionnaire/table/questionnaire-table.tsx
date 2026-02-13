'use client'

import { DataTable, getInitialSortConditions } from '@repo/ui/data-table'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getQuestionnaireColumns } from './columns'
import QuestionnaireTableToolbar from '@/components/pages/protected/questionnaire/table/questionnaire-table-toolbar.tsx'
import { QUESTIONNAIRE_SORT_FIELDS } from '@/components/pages/protected/questionnaire/table/table-config.ts'
import { OrderDirection, Assessment, AssessmentOrderField, AssessmentWhereInput, FilterAssessmentsQueryVariables } from '@repo/codegen/src/schema.ts'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useDebounce } from '@uidotdev/usehooks'
import { useAssessments, useDeleteAssessment } from '@/lib/graphql-hooks/assessments'
import { useRouter } from 'next/navigation'
import { ColumnDef, VisibilityState } from '@tanstack/react-table'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { exportToCSV } from '@/utils/exportToCSV'
import { useGetOrgUserList } from '@/lib/graphql-hooks/members'
import { useNotification } from '@/hooks/useNotification'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'
import { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu.tsx'
import { TableColumnVisibilityKeysEnum } from '@/components/shared/table-column-visibility/table-column-visibility-keys.ts'
import { TableKeyEnum } from '@repo/ui/table-key'
import { canDelete, canEdit } from '@/lib/authz/utils.ts'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { SendQuestionnaireDialog } from '@/components/pages/protected/questionnaire/dialog/send-questionnaire-dialog'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'

export const QuestionnairesTable = () => {
  const router = useRouter()
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const [filters, setFilters] = useState<AssessmentWhereInput | null>(null)
  const { setCrumbs } = useContext(BreadcrumbContext)
  const { successNotification, errorNotification } = useNotification()
  const [selectedQuestionnaires, setSelectedQuestionnaires] = useState<{ id: string }[]>([])

  const [deleteTarget, setDeleteTarget] = useState<Assessment | null>(null)
  const [sendTarget, setSendTarget] = useState<Assessment | null>(null)

  const { mutateAsync: deleteAssessment } = useDeleteAssessment()
  const { data: permission } = useOrganizationRoles()

  const defaultSorting = getInitialSortConditions(TableKeyEnum.QUESTIONNAIRE, AssessmentOrderField, [
    {
      field: AssessmentOrderField.updated_at,
      direction: OrderDirection.DESC,
    },
  ])
  const [orderBy, setOrderBy] = useState<FilterAssessmentsQueryVariables['orderBy']>(defaultSorting)

  const orderByFilter = useMemo(() => orderBy || undefined, [orderBy])

  const defaultVisibility: VisibilityState = {
    id: false,
    updatedBy: false,
    createdBy: false,
    title: false,
    tags: false,
    templateName: false,
  }

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableColumnVisibilityKeysEnum.QUESTIONNAIRE, defaultVisibility))

  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)

  const whereFilter = useMemo(() => {
    const base: AssessmentWhereInput = {
      nameContainsFold: debouncedSearch,
    }

    const generated = whereGenerator<AssessmentWhereInput>(filters, (key, value) => {
      if (key.startsWith('dueDate')) {
        return { hasAssessmentResponsesWith: [{ [key]: value }] } as AssessmentWhereInput
      }

      return { [key]: value } as AssessmentWhereInput
    })

    // Merge due-date bounds so the same response must satisfy the full range
    const andConditions = generated.and as AssessmentWhereInput[] | undefined
    if (andConditions?.length) {
      const mergedResponseWhere: Record<string, unknown> = {}
      const rest: AssessmentWhereInput[] = []

      for (const cond of andConditions) {
        if (cond.hasAssessmentResponsesWith?.length) {
          for (const rw of cond.hasAssessmentResponsesWith) {
            Object.assign(mergedResponseWhere, rw)
          }
        } else {
          rest.push(cond)
        }
      }

      if (Object.keys(mergedResponseWhere).length > 0) {
        rest.push({
          hasAssessmentResponsesWith: [mergedResponseWhere],
        } as AssessmentWhereInput)
      }

      generated.and = rest.length > 0 ? rest : undefined
    }

    return { ...base, ...generated }
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

  const handleViewDetails = useCallback(
    (assessment: Assessment) => {
      router.push(`/questionnaires/${assessment.id}`)
    },
    [router],
  )

  const handleSend = useCallback((assessment: Assessment) => {
    setSendTarget(assessment)
  }, [])

  const handleEdit = useCallback(
    (assessment: Assessment) => {
      router.push(`/questionnaires/questionnaire-editor?id=${assessment.id}`)
    },
    [router],
  )

  const handlePreview = useCallback(
    (assessment: Assessment) => {
      router.push(`/questionnaires/questionnaire-viewer?id=${assessment.id}`)
    },
    [router],
  )

  const handleDelete = useCallback((assessment: Assessment) => {
    setDeleteTarget(assessment)
  }, [])

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteAssessment({ deleteAssessmentId: deleteTarget.id })
      successNotification({ title: 'Questionnaire deleted successfully' })
      setDeleteTarget(null)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({ title: 'Error', description: errorMessage })
    }
  }

  const { columns, mappedColumns } = getQuestionnaireColumns({
    userMap,
    selectedQuestionnaires,
    setSelectedQuestionnaires,
    onSend: handleSend,
    onEdit: handleEdit,
    onPreview: handlePreview,
    onViewDetails: handleViewDetails,
    onDelete: handleDelete,
    canSend: canEdit(permission?.roles),
    canEdit: canEdit(permission?.roles),
    canDelete: canDelete(permission?.roles),
  })

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
    router.push(`/questionnaires/${row.id}`)
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
    <>
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

      <SendQuestionnaireDialog open={!!sendTarget} onOpenChange={(open) => !open && setSendTarget(null)} assessmentId={sendTarget?.id} assessmentName={sendTarget?.name} />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Questionnaire"
        description={
          <>
            This action cannot be undone. This will permanently remove <b>{deleteTarget?.name}</b> from the organization.
          </>
        }
      />
    </>
  )
}

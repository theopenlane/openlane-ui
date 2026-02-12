'use client'

import { DataTable, getInitialSortConditions } from '@repo/ui/data-table'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getTemplateColumns } from './columns'
import TemplateTableToolbar from '@/components/pages/protected/template/table/template-table-toolbar.tsx'
import { TEMPLATE_SORT_FIELDS } from '@/components/pages/protected/template/table/table-config.ts'
import { OrderDirection, Template, TemplateOrderField, TemplateWhereInput, FilterTemplatesQueryVariables, TemplateTemplateKind } from '@repo/codegen/src/schema.ts'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useDebounce } from '@uidotdev/usehooks'
import { useTemplates, useDeleteTemplate } from '@/lib/graphql-hooks/templates'
import { useRouter } from 'next/navigation'
import { ColumnDef, VisibilityState } from '@tanstack/react-table'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { exportToCSV } from '@/utils/exportToCSV'
import { useGetOrgUserList } from '@/lib/graphql-hooks/members'
import { useNotification } from '@/hooks/useNotification'
import { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu.tsx'
import { TableColumnVisibilityKeysEnum } from '@/components/shared/table-column-visibility/table-column-visibility-keys.ts'
import { TableKeyEnum } from '@repo/ui/table-key'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { AlertDialog } from '@repo/ui/alert-dialog'
import { TemplateList } from '@/components/pages/protected/questionnaire/templates'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

export const TemplatesTable = () => {
  const router = useRouter()
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const [filters, setFilters] = useState<TemplateWhereInput>({})
  const { setCrumbs } = useContext(BreadcrumbContext)
  const { successNotification, errorNotification } = useNotification()

  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null)
  const [isCreateQuesDialogOpen, setIsCreateQuesDialogOpen] = useState(false)

  const { mutateAsync: deleteTemplate } = useDeleteTemplate()

  const defaultSorting = getInitialSortConditions(TableKeyEnum.TEMPLATE, TemplateOrderField, [
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
    description: false,
    environmentName: false,
    kind: false,
    scopeName: false,
  }

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableColumnVisibilityKeysEnum.TEMPLATE, defaultVisibility))

  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)

  const whereFilter = useMemo(() => {
    return {
      nameContainsFold: debouncedSearch,
      kindNotIn: [TemplateTemplateKind.TRUSTCENTER_NDA],
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
    enabled: true,
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

  const handleEdit = useCallback(
    (template: Template) => {
      router.push(`/templates/template-editor?id=${template.id}`)
    },
    [router],
  )

  const handleDelete = useCallback((template: Template) => {
    setDeleteTarget(template)
  }, [])

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteTemplate({ deleteTemplateId: deleteTarget.id })
      successNotification({ title: 'Template deleted successfully' })
      setDeleteTarget(null)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({ title: 'Error', description: errorMessage })
    }
  }

  const handleCreateQuestionnaire = useCallback(() => {
    setIsCreateQuesDialogOpen(true)
  }, [])

  const { columns, mappedColumns } = getTemplateColumns({
    userMap,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onCreateQuestionnaire: handleCreateQuestionnaire,
  })

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
          if (typeof value === 'boolean') return value ? 'Yes' : 'No'
          return typeof value === 'string' || typeof value === 'number' ? value : ''
        },
      }
    })
    exportToCSV(templates, exportableColumns, 'templates_list')
  }

  const handleRowClick = (row: Template) => {
    router.push(`/templates/template-viewer?id=${row.id}`)
  }

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Questionnaires', href: '/questionnaires' },
      { label: 'Templates', href: '/templates' },
    ])
  }, [setCrumbs])

  useEffect(() => {
    if (isError) {
      errorNotification({
        title: 'Error',
        description: 'Failed to load templates',
      })
    }
  }, [isError, errorNotification])

  return (
    <>
      <div>
        <TemplateTableToolbar
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
          sortFields={TEMPLATE_SORT_FIELDS}
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
          tableKey={TableKeyEnum.TEMPLATE}
        />
      </div>

      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Template"
        description={
          <>
            This action cannot be undone. This will permanently remove <b>{deleteTarget?.name}</b> from the organization.
          </>
        }
      />

      <AlertDialog open={isCreateQuesDialogOpen} onOpenChange={setIsCreateQuesDialogOpen}>
        <TemplateList />
      </AlertDialog>
    </>
  )
}

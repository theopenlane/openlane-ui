'use client'

import { DataTable } from '@repo/ui/data-table'
import React, { useEffect, useMemo, useState } from 'react'
import { type FindingWhereInput, type Finding, type FindingOrderField, TaskTaskStatus } from '@repo/codegen/src/schema'
import { getColumns } from '@/components/pages/protected/findings/table/columns.tsx'
import { type FindingsNodeNonNull, useFindingsWithFilter } from '@/lib/graphql-hooks/finding'
import { useGetOrgUserList } from '@/lib/graphql-hooks/member'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { useNotification } from '@/hooks/useNotification'
import { FINDINGS_SORT_FIELDS } from './table-config'
import { type TTableProps } from '@/components/shared/crud-base/page'
import { objectName, tableKey } from './types'
import { isUlid } from '@/lib/validators'
import { useSession } from 'next-auth/react'
import { CreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/create-task-dialog'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { useSheetNavigation } from '@/providers/sheet-navigation-provider'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import CreateRemediationSheet from '@/components/pages/protected/remediations/create-remediation-sheet'
import { useQueryClient } from '@tanstack/react-query'

const TableComponent = ({
  onSortChange,
  pagination,
  onPaginationChange,
  whereFilter,
  orderByFilter,
  columnVisibility,
  setColumnVisibility,
  onHasChange,
  selectedItems,
  setSelectedItems,
  canEdit,
  permission,
  defaultSorting,
  rowHref,
}: TTableProps<FindingWhereInput>) => {
  const { replace } = useSmartRouter()
  const sheetNav = useSheetNavigation()
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const { errorNotification } = useNotification()
  const [createTaskRow, setCreateTaskRow] = useState<FindingsNodeNonNull | null>(null)
  const [trackRemediationRow, setTrackRemediationRow] = useState<FindingsNodeNonNull | null>(null)

  const orderBy = useMemo(() => {
    if (!orderByFilter) return undefined
    return orderByFilter.map(({ field, direction }) => ({
      field: field as FindingOrderField,
      direction,
    }))
  }, [orderByFilter])

  const {
    findingsNodes: items,
    isLoading: fetching,
    data,
    isFetching,
    isError,
  } = useFindingsWithFilter({
    where: whereFilter,
    orderBy: orderBy,
    pagination,
    enabled: true,
  })

  const userIds = useMemo(() => {
    if (!items) return []
    const ids = new Set<string>()
    items.forEach((item) => {
      if (item.createdBy && isUlid(item.createdBy)) ids.add(item.createdBy)
      if (item.updatedBy && isUlid(item.updatedBy)) ids.add(item.updatedBy)
    })
    return Array.from(ids)
  }, [items])

  const hasItems = useMemo(() => {
    return items && items.length > 0
  }, [items])

  useEffect(() => {
    if (onHasChange) {
      onHasChange(hasItems)
    }
  }, [hasItems, onHasChange])

  useEffect(() => {
    if (permission?.roles) {
      setColumnVisibility((prev) => ({
        ...prev,
        select: canEdit(permission.roles),
      }))
    }
  }, [permission?.roles, setColumnVisibility, canEdit])

  useEffect(() => {
    if (isError) {
      errorNotification({
        title: 'Error',
        description: `Failed to load ${objectName.toLowerCase()}`,
      })
    }
  }, [isError, errorNotification])

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

  const handleTrackRemediation = (row: FindingsNodeNonNull) => {
    setTrackRemediationRow(row)
  }

  const handleOpenRemediation = (row: FindingsNodeNonNull) => {
    const remediationId = row.remediations?.edges?.[0]?.node?.id
    if (remediationId) {
      sheetNav?.openSheet(remediationId, ObjectAssociationNodeEnum.REMEDIATION)
    }
  }

  const handleCreateTask = (row: FindingsNodeNonNull) => {
    setCreateTaskRow(row)
  }

  const columns = useMemo(
    () => getColumns({ userMap, selectedItems, setSelectedItems, onTrackRemediation: handleTrackRemediation, onOpenRemediation: handleOpenRemediation, onCreateTask: handleCreateTask }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userMap, selectedItems, setSelectedItems],
  )

  const createTaskInitialValues = useMemo(() => {
    if (!createTaskRow) return undefined
    const displayName = createTaskRow.displayName || createTaskRow.displayID || createTaskRow.externalID || 'Finding'
    return {
      title: `Finding: ${displayName} Remediation`,
      taskKindName: 'Finding Remediation',
      assigneeID: session?.user?.id,
      status: TaskTaskStatus.OPEN,
    }
  }, [createTaskRow, session?.user?.id])

  const createTaskInitialData = useMemo(() => {
    if (!createTaskRow) return undefined
    return { findingIDs: [createTaskRow.id] }
  }, [createTaskRow])

  return (
    <>
      <DataTable<FindingsNodeNonNull, Finding>
        columns={columns}
        sortFields={FINDINGS_SORT_FIELDS}
        onSortChange={onSortChange}
        data={items}
        loading={fetching || fetchingUsers}
        defaultSorting={defaultSorting}
        onRowClick={(item) => {
          replace({ id: item.id })
        }}
        rowHref={rowHref}
        pagination={pagination}
        onPaginationChange={onPaginationChange}
        paginationMeta={{
          totalCount: data?.findings.totalCount,
          pageInfo: data?.findings?.pageInfo,
          isLoading: isFetching,
        }}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        tableKey={tableKey}
      />
      <CreateTaskDialog
        open={!!createTaskRow}
        onOpenChange={(open) => {
          if (!open) setCreateTaskRow(null)
        }}
        initialValues={createTaskInitialValues}
        initialData={createTaskInitialData}
        defaultSelectedObject={ObjectTypeObjects.FINDING}
        onSuccessWithId={(taskId) => {
          setCreateTaskRow(null)
          replace({ taskId })
        }}
      />
      <CreateRemediationSheet
        isOpen={!!trackRemediationRow}
        onClose={() => setTrackRemediationRow(null)}
        initialData={trackRemediationRow ? { findingIDs: [trackRemediationRow.id] } : undefined}
        defaultTitle={trackRemediationRow ? `${trackRemediationRow.displayName ?? trackRemediationRow.displayID ?? ''} Remediation`.trim() : undefined}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['findings'] })}
      />
    </>
  )
}

TableComponent.displayName = 'FindingsTable'
export default TableComponent

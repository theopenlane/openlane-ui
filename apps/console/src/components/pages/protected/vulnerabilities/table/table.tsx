'use client'

import { DataTable } from '@repo/ui/data-table'
import React, { useEffect, useMemo, useState } from 'react'
import { type VulnerabilityWhereInput, type Vulnerability, type VulnerabilityOrderField, TaskTaskStatus } from '@repo/codegen/src/schema'
import { getColumns } from '@/components/pages/protected/vulnerabilities/table/columns.tsx'
import { type VulnerabilitiesNodeNonNull, useVulnerabilitiesWithFilter } from '@/lib/graphql-hooks/vulnerability'
import { useGetOrgUserList } from '@/lib/graphql-hooks/member'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { useNotification } from '@/hooks/useNotification'
import { VULNERABILITIES_SORT_FIELDS } from './table-config'
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
}: TTableProps<VulnerabilityWhereInput>) => {
  const { replace } = useSmartRouter()
  const sheetNav = useSheetNavigation()
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const { errorNotification } = useNotification()
  const [createTaskRow, setCreateTaskRow] = useState<VulnerabilitiesNodeNonNull | null>(null)
  const [trackRemediationRow, setTrackRemediationRow] = useState<VulnerabilitiesNodeNonNull | null>(null)

  const orderBy = useMemo(() => {
    if (!orderByFilter) return undefined
    return orderByFilter.map(({ field, direction }) => ({
      field: field as VulnerabilityOrderField,
      direction,
    }))
  }, [orderByFilter])

  const {
    vulnerabilitiesNodes: items,
    isLoading: fetching,
    data,
    isFetching,
    isError,
  } = useVulnerabilitiesWithFilter({
    where: whereFilter,
    orderBy: orderBy,
    pagination,
    enabled: true,
  })

  const { convertToReadOnly } = usePlateEditor()

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

  const handleTrackRemediation = (row: VulnerabilitiesNodeNonNull) => {
    setTrackRemediationRow(row)
  }

  const handleOpenRemediation = (row: VulnerabilitiesNodeNonNull) => {
    const remediationId = row.remediations?.edges?.[0]?.node?.id
    if (remediationId) {
      sheetNav?.openSheet(remediationId, ObjectAssociationNodeEnum.REMEDIATION)
    }
  }

  const handleCreateTask = (row: VulnerabilitiesNodeNonNull) => {
    setCreateTaskRow(row)
  }

  const columns = useMemo(
    () =>
      getColumns({ userMap, convertToReadOnly, selectedItems, setSelectedItems, onTrackRemediation: handleTrackRemediation, onOpenRemediation: handleOpenRemediation, onCreateTask: handleCreateTask }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userMap, convertToReadOnly, selectedItems, setSelectedItems],
  )

  const createTaskInitialValues = useMemo(() => {
    if (!createTaskRow) return undefined
    const displayName = createTaskRow.displayName || createTaskRow.displayID || createTaskRow.externalID || 'Vulnerability'
    return {
      title: `Vulnerability: ${displayName} Remediation`,
      taskKindName: 'Vulnerability Remediation',
      assigneeID: session?.user?.id,
      status: TaskTaskStatus.OPEN,
    }
  }, [createTaskRow, session?.user?.id])

  const createTaskInitialData = useMemo(() => {
    if (!createTaskRow) return undefined
    return { vulnerabilityIDs: [createTaskRow.id] }
  }, [createTaskRow])

  return (
    <>
      <DataTable<VulnerabilitiesNodeNonNull, Vulnerability>
        columns={columns}
        sortFields={VULNERABILITIES_SORT_FIELDS}
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
          totalCount: data?.vulnerabilities.totalCount,
          pageInfo: data?.vulnerabilities?.pageInfo,
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
        defaultSelectedObject={ObjectTypeObjects.VULNERABILITY}
        onSuccessWithId={(taskId) => {
          setCreateTaskRow(null)
          replace({ taskId })
        }}
      />
      <CreateRemediationSheet
        isOpen={!!trackRemediationRow}
        onClose={() => setTrackRemediationRow(null)}
        initialData={trackRemediationRow ? { vulnerabilityIDs: [trackRemediationRow.id] } : undefined}
        defaultTitle={trackRemediationRow ? `${trackRemediationRow.displayName ?? trackRemediationRow.displayID ?? trackRemediationRow.externalID ?? ''} Remediation`.trim() : undefined}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['vulnerabilities'] })}
      />
    </>
  )
}

TableComponent.displayName = 'VulnerabilitiesTable'
export default TableComponent

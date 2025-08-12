'use client'
import React, { useMemo, useRef, useState, useEffect } from 'react'
import TaskTableToolbar from '@/components/pages/protected/tasks/table/task-table-toolbar'
import { useTaskStore, TOrgMembers } from '@/components/pages/protected/tasks/hooks/useTaskStore'
import { OrderDirection, Task, TaskOrderField, TasksWithFilterQueryVariables, TaskTaskStatus, TaskWhereInput } from '@repo/codegen/src/schema'
import { getTaskColumns } from '@/components/pages/protected/tasks/table/columns.tsx'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { exportToCSV } from '@/utils/exportToCSV'
import { ColumnDef, VisibilityState } from '@tanstack/react-table'
import TaskInfiniteCards from '@/components/pages/protected/tasks/cards/task-infinite-cards.tsx'
import TasksTable from '@/components/pages/protected/tasks/table/tasks-table.tsx'
import { formatDate } from '@/utils/date'
import { useDebounce } from '@uidotdev/usehooks'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useGetSingleOrganizationMembers } from '@/lib/graphql-hooks/organization'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import { useOrganizationRole } from '@/lib/authz/access-api'
import { canEdit } from '@/lib/authz/utils.ts'

const TasksPage: React.FC = () => {
  const { setSelectedTask, setOrgMembers } = useTaskStore()
  const [searchQuery, setSearchQuery] = useState('')
  const tableRef = useRef<{ exportData: () => Task[] }>(null)
  const [activeTab, setActiveTab] = useState<'table' | 'card'>('table')
  const [showCompletedTasks, setShowCompletedTasks] = useState<boolean>(false)
  const [filters, setFilters] = useState<TaskWhereInput | null>(null)
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const { data: membersData } = useGetSingleOrganizationMembers({ organizationId: session?.user.activeOrganizationId })
  const { setCrumbs } = React.useContext(BreadcrumbContext)
  const [orderBy, setOrderBy] = useState<TasksWithFilterQueryVariables['orderBy']>([
    {
      field: TaskOrderField.due,
      direction: OrderDirection.ASC,
    },
  ])
  const allStatuses = useMemo(() => [TaskTaskStatus.COMPLETED, TaskTaskStatus.OPEN, TaskTaskStatus.IN_PROGRESS, TaskTaskStatus.IN_REVIEW, TaskTaskStatus.WONT_DO], [])
  const statusesWithoutComplete = useMemo(() => [TaskTaskStatus.OPEN, TaskTaskStatus.IN_PROGRESS, TaskTaskStatus.IN_REVIEW], [])
  const { data: permission } = useOrganizationRole(session)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    createdAt: false,
    createdBy: false,
    updatedAt: false,
    updatedBy: false,
    details: false,
    completed: false,
    tags: false,
  })
  const debouncedSearch = useDebounce(searchQuery, 300)
  const searching = searchQuery !== debouncedSearch
  const [hasTasks, setHasTasks] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState<{ id: string }[]>([])
  const whereFilter = useMemo(() => {
    if (!filters) {
      return null
    }
    const conditions = {
      ...(showCompletedTasks ? { statusIn: allStatuses } : { statusIn: statusesWithoutComplete }),
      ...filters,
      ...{ titleContainsFold: debouncedSearch },
    }

    return conditions
  }, [filters, showCompletedTasks, allStatuses, statusesWithoutComplete, debouncedSearch])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Tasks', href: '/tasks' },
    ])
  }, [setCrumbs])

  useEffect(() => {
    const taskId = searchParams.get('id')
    if (taskId) {
      setSelectedTask(taskId)
    }
  }, [searchParams, setSelectedTask])

  useEffect(() => {
    const members = membersData?.organization?.members?.edges?.map(
      (member) =>
        ({
          value: member?.node?.user?.id,
          label: `${member?.node?.user?.displayName}`,
          membershipId: member?.node?.user.id,
        }) as TOrgMembers,
    )
    setOrgMembers(members)
  }, [membersData, setOrgMembers])

  const orderByFilter = useMemo(() => {
    return orderBy || undefined
  }, [orderBy])

  const handleTabChange = (tab: 'table' | 'card') => {
    setActiveTab(tab)
  }

  const handleShowCompletedTasks = (val: boolean) => {
    setShowCompletedTasks(val)
  }

  function isVisibleColumn<T>(col: ColumnDef<T>): col is ColumnDef<T> & { accessorKey: string; header: string } {
    return 'accessorKey' in col && typeof col.accessorKey === 'string' && typeof col.header === 'string' && columnVisibility[col.accessorKey] !== false
  }

  const emptyUserMap = {}
  const mappedColumns: { accessorKey: string; header: string }[] = getTaskColumns({ userMap: emptyUserMap, selectedTasks, setSelectedTasks })
    .filter((column): column is { accessorKey: string; header: string } => 'accessorKey' in column && typeof column.accessorKey === 'string' && typeof column.header === 'string')
    .map((column) => ({
      accessorKey: column.accessorKey,
      header: column.header,
    }))

  const handleExport = () => {
    if (!hasTasks) return
    const tasks = tableRef.current?.exportData?.() ?? []

    const exportableColumns = getTaskColumns({ userMap: emptyUserMap, selectedTasks, setSelectedTasks })
      .filter(isVisibleColumn)
      .map((col) => {
        const key = col.accessorKey as keyof Task
        const label = col.header

        return {
          label,
          accessor: (task: Task) => {
            const value = task[key]

            if (key === 'due' && value) {
              return formatDate(value)
            }

            if (key === 'assignee') {
              return task.assignee?.displayName || '-'
            }

            if (key === 'assigner') {
              return task.assigner?.displayName
            }

            return typeof value === 'string' || typeof value === 'number' ? value : ''
          },
        }
      })

    exportToCSV(tasks, exportableColumns, 'task_list')
  }

  const handleBulkEdit = () => {
    setSelectedTasks([])
  }

  return (
    <>
      <TaskTableToolbar
        onFilterChange={setFilters}
        onTabChange={handleTabChange}
        handleBulkEdit={handleBulkEdit}
        onShowCompletedTasksChange={handleShowCompletedTasks}
        handleExport={handleExport}
        mappedColumns={mappedColumns}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        searchTerm={searchQuery}
        setSearchTerm={(val) => {
          setSearchQuery(val)
          setPagination(DEFAULT_PAGINATION)
        }}
        searching={searching}
        exportEnabled={hasTasks}
        canEdit={canEdit}
        permission={permission}
        selectedTasks={selectedTasks}
        setSelectedTasks={setSelectedTasks}
      />
      {activeTab === 'table' ? (
        <TasksTable
          ref={tableRef}
          orderByFilter={orderByFilter}
          pagination={pagination}
          onPaginationChange={setPagination}
          whereFilter={whereFilter}
          onSortChange={setOrderBy}
          columnVisibility={columnVisibility}
          setColumnVisibility={setColumnVisibility}
          onHasTasksChange={setHasTasks}
          selectedTasks={selectedTasks}
          setSelectedTasks={setSelectedTasks}
          canEdit={canEdit}
          permission={permission}
        />
      ) : (
        <TaskInfiniteCards ref={tableRef} whereFilter={whereFilter} orderByFilter={orderByFilter} />
      )}
    </>
  )
}

export default TasksPage

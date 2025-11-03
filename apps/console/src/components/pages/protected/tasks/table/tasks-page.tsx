'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import TaskTableToolbar from '@/components/pages/protected/tasks/table/task-table-toolbar'
import { TOrgMembers, useTaskStore } from '@/components/pages/protected/tasks/hooks/useTaskStore'
import { ExportExportFormat, ExportExportType, OrderDirection, Task, TaskOrderField, TasksWithFilterQueryVariables, TaskTaskStatus, TaskWhereInput } from '@repo/codegen/src/schema'
import { getTaskColumns } from '@/components/pages/protected/tasks/table/columns.tsx'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { ColumnDef, VisibilityState } from '@tanstack/react-table'
import TaskInfiniteCards from '@/components/pages/protected/tasks/cards/task-infinite-cards.tsx'
import TasksTable from '@/components/pages/protected/tasks/table/tasks-table.tsx'
import { useDebounce } from '@uidotdev/usehooks'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useGetSingleOrganizationMembers } from '@/lib/graphql-hooks/organization'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import { canEdit } from '@/lib/authz/utils.ts'
import useFileExport from '@/components/shared/export/use-file-export.ts'
import { Loading } from '@/components/shared/loading/loading'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'

const TasksPage: React.FC = () => {
  const { setSelectedTask, setOrgMembers } = useTaskStore()
  const [searchQuery, setSearchQuery] = useState('')
  const tableRef = useRef<{ exportData: () => Task[] }>(null)
  const [activeTab, setActiveTab] = useState<'table' | 'card'>('table')
  const [showCompletedTasks, setShowCompletedTasks] = useState<boolean>(false)
  const [showMyTasks, setShowMyTasks] = useState<boolean>(false)
  const [filters, setFilters] = useState<TaskWhereInput | null>(null)
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { data: membersData, isLoading: isMembersLoading } = useGetSingleOrganizationMembers({ organizationId: session?.user.activeOrganizationId })
  const { setCrumbs } = React.useContext(BreadcrumbContext)
  const { handleExport } = useFileExport()
  const [orderBy, setOrderBy] = useState<TasksWithFilterQueryVariables['orderBy']>([
    {
      field: TaskOrderField.due,
      direction: OrderDirection.ASC,
    },
  ])
  const allStatuses = useMemo(() => Object.values(TaskTaskStatus), [])
  const statusesWithoutComplete = useMemo(() => allStatuses.filter((status) => status !== TaskTaskStatus.COMPLETED), [allStatuses])
  const { data: permission } = useOrganizationRoles()
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
    if (!filters) return null

    const base = {
      titleContainsFold: debouncedSearch,
      ...(showMyTasks && { assigneeID: session?.user?.userId }),
      ...(showCompletedTasks ? { statusIn: allStatuses } : { statusIn: statusesWithoutComplete }),
    }

    const result = whereGenerator<TaskWhereInput>(filters, (key, value) => {
      if (key === 'hasProgramsWith') {
        return { hasProgramsWith: [{ idIn: value }] } as TaskWhereInput
      }
      return { [key]: value } as TaskWhereInput
    })

    return { ...base, ...result }
  }, [filters, showCompletedTasks, allStatuses, statusesWithoutComplete, debouncedSearch, session, showMyTasks])

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
    const myTasks = searchParams.get('showMyTasks')
    if (myTasks) {
      const doShowMyTasks = myTasks === 'true'
      setShowMyTasks(doShowMyTasks)
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

  const handleShowMyTasks = (val: boolean) => {
    setShowMyTasks(val)

    const params = new URLSearchParams(searchParams.toString())

    if (val) {
      params.set('showMyTasks', 'true')
    } else {
      params.delete('showMyTasks')
    }

    router.replace(`?${params.toString()}`, { scroll: false })
  }

  const emptyUserMap = {}
  const mappedColumns: { accessorKey: string; header: string }[] = getTaskColumns({ userMap: emptyUserMap, selectedTasks, setSelectedTasks })
    .filter((column): column is { accessorKey: string; header: string } => 'accessorKey' in column && typeof column.accessorKey === 'string' && typeof column.header === 'string')
    .map((column) => ({
      accessorKey: column.accessorKey,
      header: column.header,
    }))

  function isVisibleColumn<T>(col: ColumnDef<T>): col is ColumnDef<T> & { accessorKey: string; header: string } {
    return 'accessorKey' in col && typeof col.accessorKey === 'string' && typeof col.header === 'string' && columnVisibility[col.accessorKey] !== false
  }

  const handleExportFile = async () => {
    if (!hasTasks) {
      return
    }

    handleExport({
      exportType: ExportExportType.TASK,
      filters: JSON.stringify(whereFilter),
      fields: mappedColumns.filter(isVisibleColumn).map((item) => item.accessorKey),
      format: ExportExportFormat.CSV,
    })
  }

  const handleBulkEdit = () => {
    setSelectedTasks([])
  }

  if (isMembersLoading) {
    return <Loading />
  }

  return (
    <>
      <TaskTableToolbar
        onFilterChange={setFilters}
        onTabChange={handleTabChange}
        handleBulkEdit={handleBulkEdit}
        onShowCompletedTasksChange={handleShowCompletedTasks}
        handleExport={handleExportFile}
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
        showMyTasks={showMyTasks}
        onShowMyTasksChange={handleShowMyTasks}
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

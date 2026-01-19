import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React, { useEffect, useMemo, useState } from 'react'
import { getTasksFilterFields } from '@/components/pages/protected/tasks/table/table-config.ts'
import { CreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/create-task-dialog'
import { FilterField } from '@/types'
import { useTaskStore } from '@/components/pages/protected/tasks/hooks/useTaskStore'
import { DownloadIcon, LoaderCircle, SearchIcon, Upload } from 'lucide-react'
import { BulkCSVCreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/bulk-csv-create-task-dialog'
import { useProgramSelect } from '@/lib/graphql-hooks/programs'
import Menu from '@/components/shared/menu/menu'
import { VisibilityState } from '@tanstack/react-table'
import ColumnVisibilityMenu from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { Input } from '@repo/ui/input'
import { TaskTaskStatus, TaskWhereInput } from '@repo/codegen/src/schema'
import TableCardView from '@/components/shared/table-card-view/table-card-view'
import { Button } from '@repo/ui/button'
import { BulkEditTasksDialog } from '../bulk-edit/bulk-edit-tasks'
import { TableFilterKeysEnum } from '@/components/shared/table-filter/table-filter-keys.ts'
import { TAccessRole, TData } from '@/types/authz'
import { useSession } from 'next-auth/react'
import { endOfWeek, format, startOfDay, startOfWeek } from 'date-fns'
import { DateFormatStorage, TQuickFilter } from '@/components/shared/table-filter/table-filter-helper.ts'
import { useNotification } from '@/hooks/useNotification'
import { useBulkDeleteTask } from '@/lib/graphql-hooks/tasks'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { TableColumnVisibilityKeysEnum } from '@/components/shared/table-column-visibility/table-column-visibility-keys.ts'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enums'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

type TTaskTableToolbarProps = {
  onFilterChange: (filters: TaskWhereInput) => void
  onTabChange: (tab: 'table' | 'card') => void
  handleExport: () => void
  columnVisibility?: VisibilityState
  setColumnVisibility?: React.Dispatch<React.SetStateAction<VisibilityState>>
  mappedColumns: {
    accessorKey: string
    header: string
  }[]
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  searching?: boolean
  exportEnabled: boolean
  canEdit: (accessRole: TAccessRole[] | undefined) => boolean
  permission: TData | undefined
  handleClearSelectedTasks: () => void
  selectedTasks: { id: string }[]
  setSelectedTasks: React.Dispatch<React.SetStateAction<{ id: string }[]>>
  showMyTasks: boolean
}

const TaskTableToolbar: React.FC<TTaskTableToolbarProps> = (props: TTaskTableToolbarProps) => {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'table' | 'card'>('table')
  const { orgMembers } = useTaskStore()
  const { programOptions, isSuccess } = useProgramSelect({})
  const [filterFields, setFilterFields] = useState<FilterField[] | undefined>(undefined)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: bulkDeleteTasks } = useBulkDeleteTask()

  const { enumOptions: taskKindOptions, isSuccess: isEnumOptionsSuccess } = useGetCustomTypeEnums({
    where: {
      objectType: 'task',
      field: 'kind',
    },
  })

  const quickFilters: TQuickFilter[] = useMemo(() => {
    return [
      {
        label: 'Completed',
        key: 'completed',
        type: 'custom',
        getCondition: () => ({ statusIn: [TaskTaskStatus.COMPLETED] }),
        isActive: false,
      },
      {
        label: 'Open',
        key: 'open',
        type: 'custom',
        getCondition: () => ({ statusIn: [TaskTaskStatus.OPEN] }),
        isActive: false,
      },
      {
        label: 'My Tasks',
        key: 'myTasks',
        type: 'custom',
        getCondition: () => ({ assigneeID: session?.user?.userId }),
        isActive: props.showMyTasks ?? false,
      },
      {
        label: 'Overdue',
        key: 'overdue',
        type: 'custom',
        getCondition: () => ({ dueLT: format(startOfDay(new Date()), DateFormatStorage) }),
        isActive: false,
      },
      {
        label: 'Due This Week',
        key: 'dueThisWeek',
        type: 'custom',
        getCondition: () => {
          const start = startOfWeek(new Date(), { weekStartsOn: 1 })
          const end = endOfWeek(new Date(), { weekStartsOn: 1 })
          return {
            dueGTE: format(startOfDay(start), DateFormatStorage),
            dueLT: format(startOfDay(end), DateFormatStorage),
          }
        },
        isActive: false,
      },
      {
        label: 'Unassigned',
        key: 'unassigned',
        type: 'custom',
        getCondition: () => ({ assigneeIDIsNil: true }),
        isActive: false,
      },
    ]
  }, [props.showMyTasks, session?.user?.userId])

  const handleBulkDelete = async () => {
    if (!props.selectedTasks) {
      errorNotification({
        title: 'Missing tasks',
        description: 'Tasks not found.',
      })
      return
    }

    try {
      await bulkDeleteTasks({ ids: props.selectedTasks.map((task) => task.id) })
      successNotification({
        title: 'Selected tasks have been successfully deleted.',
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setIsBulkDeleteDialogOpen(false)
      props.setSelectedTasks([])
    }
  }

  useEffect(() => {
    if (filterFields || !orgMembers || !isSuccess || !isEnumOptionsSuccess) {
      return
    }
    const fields = getTasksFilterFields(orgMembers, programOptions, taskKindOptions ?? [])

    setFilterFields(fields)
  }, [orgMembers, programOptions, filterFields, isSuccess, taskKindOptions, isEnumOptionsSuccess])

  const handleTabChange = (tab: 'table' | 'card') => {
    setActiveTab(tab)
    props.onTabChange(tab)
  }

  return (
    <>
      <div className="flex items-center gap-2 my-2">
        <Input
          className="bg-transparent w-[280px]"
          icon={props.searching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
          placeholder="Search"
          value={props.searchTerm}
          onChange={(event) => props.setSearchTerm(event.currentTarget.value)}
          variant="searchTable"
          iconPosition="left"
        />
        <TableCardView activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="grow flex flex-row items-center gap-2 justify-end">
          {props.selectedTasks.length > 0 ? (
            <>
              {props.canEdit(props.permission?.roles) && <BulkEditTasksDialog selectedTasks={props.selectedTasks} setSelectedTasks={props.setSelectedTasks}></BulkEditTasksDialog>}
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsBulkDeleteDialogOpen(true)
                }}
              >
                {props.selectedTasks && props.selectedTasks.length > 0 ? `Bulk Delete (${props.selectedTasks.length})` : 'Bulk Delete'}
              </Button>
              {props.canEdit(props.permission?.roles) && (
                <>
                  <ConfirmationDialog
                    open={isBulkDeleteDialogOpen}
                    onOpenChange={setIsBulkDeleteDialogOpen}
                    onConfirm={handleBulkDelete}
                    title={`Delete selected tasks?`}
                    description={<>This action cannot be undone. This will permanently delete selected tasks.</>}
                    confirmationText="Delete"
                    confirmationTextVariant="destructive"
                    showInput={false}
                  />
                  <CancelButton
                    onClick={() => {
                      props.handleClearSelectedTasks()
                    }}
                  ></CancelButton>
                </>
              )}
            </>
          ) : (
            <>
              <Menu
                content={
                  <>
                    <BulkCSVCreateTaskDialog
                      trigger={
                        <div className="flex items-center space-x-2 px-1">
                          <Upload size={16} strokeWidth={2} />
                          <span>Bulk Upload</span>
                        </div>
                      }
                    />
                    <button className={`px-1 bg-transparent flex items-center space-x-2 cursor-pointer ${!props.exportEnabled ? 'opacity-50' : ''}`} onClick={props.handleExport}>
                      <DownloadIcon size={16} strokeWidth={2} />
                      <span>Export</span>
                    </button>
                  </>
                }
              />
              {props.mappedColumns && props.columnVisibility && props.setColumnVisibility && (
                <ColumnVisibilityMenu
                  mappedColumns={props.mappedColumns}
                  columnVisibility={props.columnVisibility}
                  setColumnVisibility={props.setColumnVisibility}
                  storageKey={TableColumnVisibilityKeysEnum.TASK}
                />
              )}
              {filterFields && <TableFilter filterFields={filterFields} onFilterChange={props.onFilterChange} pageKey={TableFilterKeysEnum.TASK} quickFilters={quickFilters} />}
              <CreateTaskDialog />
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default TaskTableToolbar

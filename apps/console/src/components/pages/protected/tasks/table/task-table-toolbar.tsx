import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React, { useEffect, useMemo, useState } from 'react'
import { getTaskQuickFilters, getTasksFilterFields } from '@/components/pages/protected/tasks/table/table-config.ts'
import { taskDefaultFilterValues } from '@/components/pages/protected/tasks/util/task'
import CreateTaskDropdown from '@/components/pages/protected/tasks/create-task/dialog/create-task-dropdown'
import { type FilterField } from '@/types'
import { useTaskStore } from '@/components/pages/protected/tasks/hooks/useTaskStore'
import { DownloadIcon, LoaderCircle, SearchIcon, Upload } from 'lucide-react'
import { BulkCSVCreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/bulk-csv-create-task-dialog'
import { useProgramSelect } from '@/lib/graphql-hooks/program'
import Menu from '@/components/shared/menu/menu'
import { type VisibilityState } from '@tanstack/react-table'
import ColumnVisibilityMenu from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { Input } from '@repo/ui/input'
import { type TaskWhereInput } from '@repo/codegen/src/schema'
import TableCardView from '@/components/shared/table-card-view/table-card-view'
import { type TTableViewMode } from '@/hooks/use-org-table-state'
import { Button } from '@repo/ui/button'
import { BulkEditTasksDialog } from '../bulk-edit/bulk-edit-tasks'
import { type TAccessRole, type TPermissionData } from '@/types/authz'
import { useSession } from 'next-auth/react'
import { type Session } from 'next-auth'
import { type TQuickFilter } from '@/components/shared/table-filter/table-filter-helper.ts'
import { useNotification } from '@/hooks/useNotification'
import { useBulkDeleteTask } from '@/lib/graphql-hooks/task'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { TableKeyEnum } from '@repo/ui/table-key'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { getBulkActionFailureDescription } from '@/components/shared/crud-base/bulk-action-feedback'

type TTaskTableToolbarProps = {
  onFilterChange: (filters: TaskWhereInput) => void
  activeTab: TTableViewMode
  onTabChange: (tab: TTableViewMode) => void
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
  canEdit: (accessRole: TAccessRole[] | undefined, session?: Session | null) => boolean
  permission: TPermissionData | undefined
  handleClearSelectedTasks: () => void
  selectedTasks: { id: string }[]
  setSelectedTasks: React.Dispatch<React.SetStateAction<{ id: string }[]>>
  showMyTasks: boolean
}

const TaskTableToolbar: React.FC<TTaskTableToolbarProps> = (props: TTaskTableToolbarProps) => {
  const { data: session } = useSession()
  const { orgMembers } = useTaskStore()
  const { programOptions, isSuccess, hasProgramAccess } = useProgramSelect()
  const [filterFields, setFilterFields] = useState<FilterField[] | undefined>(undefined)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false)
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: bulkDeleteTasks } = useBulkDeleteTask()

  const { enumOptions: taskKindOptions, isSuccess: isEnumOptionsSuccess } = useGetCustomTypeEnums({
    where: {
      objectType: 'task',
      field: 'kind',
    },
  })

  const quickFilters: TQuickFilter[] = useMemo(() => getTaskQuickFilters(session?.user?.userId, props.showMyTasks ?? false), [props.showMyTasks, session?.user?.userId])

  const handleBulkDelete = async () => {
    if (!props.selectedTasks) {
      errorNotification({
        title: 'Missing tasks',
        description: 'Tasks not found.',
      })
      return
    }

    try {
      const result = await bulkDeleteTasks({ ids: props.selectedTasks.map((task) => task.id) })

      if (result.deleteBulkTask.notDeletedIDs.length > 0 || result.deleteBulkTask.error) {
        const failedCount = result.deleteBulkTask.notDeletedIDs.length

        errorNotification({
          title: 'Some tasks were not deleted.',
          description: getBulkActionFailureDescription({ failedCount, singular: 'item', fallback: result.deleteBulkTask.error ?? 'Some tasks were not deleted.' }),
        })
        return
      }

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
    const fields = getTasksFilterFields(orgMembers, programOptions, taskKindOptions ?? [], hasProgramAccess)

    setFilterFields(fields)
  }, [orgMembers, programOptions, filterFields, isSuccess, hasProgramAccess, taskKindOptions, isEnumOptionsSuccess])

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
        <TableCardView activeTab={props.activeTab} onTabChange={props.onTabChange} cardLabel="Board" />
        <div className="grow flex flex-row items-center gap-2 justify-end">
          {props.selectedTasks.length > 0 ? (
            <>
              {props.canEdit(props.permission?.roles, session) && <BulkEditTasksDialog selectedTasks={props.selectedTasks} setSelectedTasks={props.setSelectedTasks}></BulkEditTasksDialog>}
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsBulkDeleteDialogOpen(true)
                }}
              >
                {props.selectedTasks && props.selectedTasks.length > 0 ? `Bulk Delete (${props.selectedTasks.length})` : 'Bulk Delete'}
              </Button>
              {props.canEdit(props.permission?.roles, session) && (
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
                closeOnSelect={true}
                content={(close) => (
                  <>
                    <button
                      type="button"
                      className="flex items-center bg-transparent space-x-2 px-1 cursor-pointer"
                      onClick={() => {
                        setIsBulkUploadOpen(true)
                        close()
                      }}
                    >
                      <Upload size={16} strokeWidth={2} />
                      <span>Bulk Upload</span>
                    </button>
                    <button className={`px-1 bg-transparent flex items-center space-x-2 cursor-pointer ${!props.exportEnabled ? 'opacity-50' : ''}`} onClick={props.handleExport}>
                      <DownloadIcon size={16} strokeWidth={2} />
                      <span>Export</span>
                    </button>
                  </>
                )}
              />
              <BulkCSVCreateTaskDialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen} />
              {props.mappedColumns && props.columnVisibility && props.setColumnVisibility && (
                <ColumnVisibilityMenu mappedColumns={props.mappedColumns} columnVisibility={props.columnVisibility} setColumnVisibility={props.setColumnVisibility} storageKey={TableKeyEnum.TASK} />
              )}
              {filterFields && (
                <TableFilter filterFields={filterFields} onFilterChange={props.onFilterChange} pageKey={TableKeyEnum.TASK} quickFilters={quickFilters} defaultFilterValues={taskDefaultFilterValues} />
              )}
              <CreateTaskDropdown />
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default TaskTableToolbar

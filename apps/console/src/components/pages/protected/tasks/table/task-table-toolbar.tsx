import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React, { useEffect, useState } from 'react'
import { TASK_FILTER_FIELDS } from '@/components/pages/protected/tasks/table/table-config'
import { CreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/create-task-dialog'
import { FilterField, SelectFilterField, SelectIsFilterField } from '@/types'
import { useTaskStore } from '@/components/pages/protected/tasks/hooks/useTaskStore'
import { DownloadIcon, LoaderCircle, SearchIcon, Upload } from 'lucide-react'
import { Checkbox } from '@repo/ui/checkbox'
import { BulkCSVCreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/bulk-csv-create-task-dialog'
import { useProgramSelect } from '@/lib/graphql-hooks/programs'
import Menu from '@/components/shared/menu/menu'
import { TaskIconBtn } from '@/components/shared/enum-mapper/task-enum'
import { CreateBtn } from '@/components/shared/enum-mapper/common-enum'
import { VisibilityState } from '@tanstack/react-table'
import ColumnVisibilityMenu from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { Input } from '@repo/ui/input'
import { TaskWhereInput } from '@repo/codegen/src/schema'
import TableCardView from '@/components/shared/table-card-view/table-card-view'
import { TAccessRole, TData } from '@/lib/authz/access-api'
import { Button } from '@repo/ui/button'
import { BulkEditTasksDialog } from '../bulk-edit/bulk-edit-tasks'

type TProps = {
  onFilterChange: (filters: TaskWhereInput) => void
  onTabChange: (tab: 'table' | 'card') => void
  onShowCompletedTasksChange: (val: boolean) => void
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
  canEdit: (accessRole: TAccessRole[]) => boolean
  permission: TData
  handleBulkEdit: () => void
  selectedTasks: { id: string }[]
  setSelectedTasks: React.Dispatch<React.SetStateAction<{ id: string }[]>>
  showMyTasks: boolean
  onShowMyTasksChange: (val: boolean) => void
}

const TaskTableToolbar: React.FC<TProps> = (props: TProps) => {
  const [activeTab, setActiveTab] = useState<'table' | 'card'>('table')
  const [showCompletedTasks, setShowCompletedTasks] = useState<boolean>(false)
  const { orgMembers } = useTaskStore()
  const { programOptions, isSuccess } = useProgramSelect()
  const [filterFields, setFilterFields] = useState<FilterField[] | undefined>(undefined)
  const [isBulkEditing, setIsBulkEditing] = useState<boolean>(false)

  useEffect(() => {
    setIsBulkEditing(props.selectedTasks.length > 0)
  }, [props.selectedTasks])

  useEffect(() => {
    if (filterFields || !orgMembers || !isSuccess) {
      return
    }

    setFilterFields([
      ...TASK_FILTER_FIELDS,
      {
        key: 'assignerID',
        label: 'Assigner',
        type: 'select',
        options: orgMembers,
      } as SelectFilterField,
      {
        key: 'assigneeID',
        label: 'Assignee',
        type: 'select',
        options: orgMembers,
      } as SelectFilterField,
      {
        key: 'hasProgramsWith',
        label: 'Program Name',
        type: 'selectIs',
        options: programOptions,
      } as SelectIsFilterField,
    ])
  }, [orgMembers, programOptions, filterFields, isSuccess])

  const handleTabChange = (tab: 'table' | 'card') => {
    setActiveTab(tab)
    props.onTabChange(tab)
  }

  const handleShowCompletedTasks = (val: boolean) => {
    setShowCompletedTasks(val)
    props.onShowCompletedTasksChange(val)
  }

  const handleShowMyTasks = (val: boolean) => {
    props.onShowMyTasksChange(val)
  }

  return (
    <>
      <div className="flex items-center gap-2 my-2">
        <TableCardView activeTab={activeTab} onTabChange={handleTabChange}></TableCardView>
        <div className="grow flex flex-row items-center gap-2">
          {props.mappedColumns && props.columnVisibility && props.setColumnVisibility && (
            <ColumnVisibilityMenu mappedColumns={props.mappedColumns} columnVisibility={props.columnVisibility} setColumnVisibility={props.setColumnVisibility}></ColumnVisibilityMenu>
          )}
          {filterFields && <TableFilter filterFields={filterFields} onFilterChange={props.onFilterChange} />}
          <Input
            icon={props.searching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
            placeholder="Search"
            value={props.searchTerm}
            onChange={(event) => props.setSearchTerm(event.currentTarget.value)}
            variant="searchTable"
          />
          <Checkbox checked={showCompletedTasks} onCheckedChange={(val: boolean) => handleShowCompletedTasks(val)} />
          <p>Show completed tasks</p>
          <Checkbox checked={props.showMyTasks} onCheckedChange={(val: boolean) => handleShowMyTasks(val)} />
          <p>Show my tasks</p>
        </div>
        <div className="grow flex flex-row items-center gap-2 justify-end">
          {isBulkEditing ? (
            <>
              {props.canEdit(props.permission?.roles) && (
                <>
                  <BulkEditTasksDialog setIsBulkEditing={setIsBulkEditing} selectedTasks={props.selectedTasks} setSelectedTasks={props.setSelectedTasks}></BulkEditTasksDialog>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsBulkEditing(false)
                      props.handleBulkEdit()
                    }}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </>
          ) : (
            <>
              <Menu trigger={CreateBtn} content={<CreateTaskDialog trigger={TaskIconBtn} />} />
            </>
          )}
          <Menu
            content={
              <>
                <BulkCSVCreateTaskDialog
                  trigger={
                    <div className="flex items-center space-x-2 hover:bg-muted">
                      <Upload size={16} strokeWidth={2} />
                      <span>Bulk Upload</span>
                    </div>
                  }
                />
                <div className={`flex items-center space-x-2 hover:bg-muted cursor-pointer ${!props.exportEnabled ? 'opacity-50' : ''}`} onClick={props.handleExport}>
                  <DownloadIcon size={16} strokeWidth={2} />
                  <span>Export</span>
                </div>
              </>
            }
          />
        </div>
      </div>
      <div id="datatable-filter-portal" />
    </>
  )
}

export default TaskTableToolbar

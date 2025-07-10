import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React, { useEffect, useState } from 'react'
import { TASK_FILTER_FIELDS } from '@/components/pages/protected/tasks/table/table-config'
import { CreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/create-task-dialog'
import { FilterField, SelectFilterField, SelectIsFilterField } from '@/types'
import { useTaskStore } from '@/components/pages/protected/tasks/hooks/useTaskStore'
import { CreditCard as CardIcon, DownloadIcon, LoaderCircle, SearchIcon, Table as TableIcon, Upload } from 'lucide-react'
import { Checkbox } from '@repo/ui/checkbox'
import { BulkCSVCreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/bulk-csv-create-task-dialog'
import { useProgramSelect } from '@/lib/graphql-hooks/programs'
import Menu from '@/components/shared/menu/menu'
import { TaskIconBtn } from '@/components/shared/icon-enum/task-enum.tsx'
import { CreateBtn } from '@/components/shared/icon-enum/common-enum.tsx'
import { VisibilityState } from '@tanstack/react-table'
import ColumnVisibilityMenu from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { Input } from '@repo/ui/input'
import { TaskWhereInput } from '@repo/codegen/src/schema'

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
}

const TaskTableToolbar: React.FC<TProps> = (props: TProps) => {
  const [activeTab, setActiveTab] = useState<'table' | 'card'>('table')
  const [showCompletedTasks, setShowCompletedTasks] = useState<boolean>(false)
  const { orgMembers } = useTaskStore()
  const { programOptions } = useProgramSelect()
  const [filterFields, setFilterFields] = useState<FilterField[] | undefined>(undefined)

  useEffect(() => {
    if (filterFields || !orgMembers || !programOptions) {
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
  }, [orgMembers, programOptions, filterFields])

  const handleTabChange = (tab: 'table' | 'card') => {
    setActiveTab(tab)
    props.onTabChange(tab)
  }

  const handleShowCompletedTasks = (val: boolean) => {
    setShowCompletedTasks(val)
    props.onShowCompletedTasksChange(val)
  }

  return (
    <>
      <div className="flex items-center gap-2 my-2">
        <div className="flex gap-1 size-fit bg-transparent py-0.5 px-1 border rounded-md">
          <div className={`py-1.5 px-2.5 rounded-md cursor-pointer ${activeTab === 'table' ? 'bg-card' : 'bg-transparent'}`} onClick={() => handleTabChange('table')}>
            <TableIcon size={16} />
          </div>
          <div className={`py-1.5 px-2.5 rounded-md cursor-pointer ${activeTab === 'card' ? 'bg-card' : 'bg-transparent'}`} onClick={() => handleTabChange('card')}>
            <CardIcon size={16} />
          </div>
        </div>
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
          <div className="grow flex flex-row items-center gap-2 pl-5">
            <Checkbox checked={showCompletedTasks} onCheckedChange={(val: boolean) => handleShowCompletedTasks(val)} />
            <p>Show completed tasks</p>
          </div>
        </div>
        <div className="grow flex flex-row items-center gap-2 justify-end">
          <Menu trigger={CreateBtn} content={<CreateTaskDialog trigger={TaskIconBtn} />} />
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
                <div className="flex items-center space-x-2 hover:bg-muted cursor-pointer" onClick={props.handleExport}>
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

import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React, { useState } from 'react'
import { TASK_FILTER_FIELDS } from '@/components/pages/protected/tasks/table/table-config'
import { CreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/create-task-dialog'
import { SelectFilterField } from '@/types'
import { TOrgMembers, useTaskStore } from '@/components/pages/protected/tasks/hooks/useTaskStore'
import { CreditCard as CardIcon, DownloadIcon, Table as TableIcon } from 'lucide-react'
import { Checkbox } from '@repo/ui/checkbox'
import { BulkCSVCreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/bulk-csv-create-task-dialog'
import { Button } from '@repo/ui/button'

type TProps = {
  onFilterChange: (filters: Record<string, any>) => void
  members: TOrgMembers[] | undefined
  onTabChange: (tab: 'table' | 'card') => void
  onShowCompletedTasksChange: (val: boolean) => void
  handleExport: () => void
}

const TaskTableToolbar: React.FC<TProps> = (props: TProps) => {
  const [activeTab, setActiveTab] = useState<'table' | 'card'>('table')
  const [showCompletedTasks, setShowCompletedTasks] = useState<boolean>(false)
  const { orgMembers } = useTaskStore()

  const filterFields = [
    ...TASK_FILTER_FIELDS,
    {
      key: 'assignerID',
      label: 'Assigner',
      type: 'select',
      options: props.members,
    } as SelectFilterField,
    {
      key: 'assigneeID',
      label: 'Assignee',
      type: 'select',
      options: orgMembers,
    } as SelectFilterField,
  ]

  const handleTabChange = (tab: 'table' | 'card') => {
    setActiveTab(tab)
    props.onTabChange(tab)
  }

  const handleShowCompletedTasks = (val: boolean) => {
    setShowCompletedTasks(val)
    props.onShowCompletedTasksChange(val)
  }

  return (
    <div className="flex items-center gap-2 my-5">
      <div className="flex gap-1 size-fit bg-transparent py-0.5 px-1 border rounded-md">
        <div className={`py-1.5 px-2.5 rounded-md cursor-pointer ${activeTab === 'table' ? 'bg-card' : 'bg-transparent'}`} onClick={() => handleTabChange('table')}>
          <TableIcon size={16} />
        </div>
        <div className={`py-1.5 px-2.5 rounded-md cursor-pointer ${activeTab === 'card' ? 'bg-card' : 'bg-transparent'}`} onClick={() => handleTabChange('card')}>
          <CardIcon size={16} />
        </div>
      </div>
      <div className="grow flex flex-row items-center gap-2">
        <TableFilter filterFields={filterFields} onFilterChange={props.onFilterChange} />
        <div className="grow flex flex-row items-center gap-2 pl-5">
          <Checkbox checked={showCompletedTasks} onCheckedChange={(val: boolean) => handleShowCompletedTasks(val)} />
          <p>Show completed tasks</p>
        </div>
      </div>

      <div className="grow flex flex-row items-center gap-2 justify-end">
        <BulkCSVCreateTaskDialog />
        <CreateTaskDialog />
      </div>
      <Button onClick={props.handleExport} icon={<DownloadIcon />} iconPosition="left">
        Export
      </Button>
    </div>
  )
}

export default TaskTableToolbar

import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React, { useState } from 'react'
import { TASK_FILTER_FIELDS, TASK_SORT_FIELDS } from '@/components/pages/protected/tasks/table/table-config'
import { CreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/create-task-dialog'
import { SelectFilterField } from '@/types'
import { TOrgMembers } from '@/components/pages/protected/tasks/hooks/useTaskStore'
import { TableSort } from '@/components/shared/table-filter/table-sort'
import { CreditCard as CardIcon, Table as TableIcon } from 'lucide-react'

type TProps = {
  onFilterChange: (filters: Record<string, any>) => void
  onSortChange: (data: any) => void
  members: TOrgMembers[] | undefined
  onTabChange: (tab: 'table' | 'card') => void
}

const TaskTableToolbar: React.FC<TProps> = (props: TProps) => {
  const [activeTab, setActiveTab] = useState<'table' | 'card'>('table')

  const filterFields = [
    ...TASK_FILTER_FIELDS,
    {
      key: 'assignerID',
      label: 'Assigner',
      type: 'select',
      options: props.members,
    } as SelectFilterField,
  ]

  const handleSort = (data: any) => {
    props.onSortChange(data)
  }

  const handleTabChange = (tab: 'table' | 'card') => {
    setActiveTab(tab)
    props.onTabChange(tab)
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
        <TableSort sortFields={TASK_SORT_FIELDS} onSortChange={(data) => handleSort(data)} />
      </div>

      <div className="grow flex flex-row items-center gap-2 justify-end">
        <CreateTaskDialog />
      </div>
    </div>
  )
}

export default TaskTableToolbar

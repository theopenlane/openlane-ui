import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React from 'react'
import { TASK_FILTER_FIELDS, TASK_SORT_FIELDS } from '@/components/pages/protected/tasks/table/table-config'
import { CreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/create-task-dialog'
import { SelectFilterField } from '@/types'
import { TOrgMembers } from '@/components/pages/protected/tasks/hooks/useTaskStore'
import { TableSort } from '@/components/shared/table-filter/table-sort'

type TProps = {
  onFilterChange: (filters: Record<string, any>) => void
  onSortChange: (data: any) => void
  members: TOrgMembers[] | undefined
}

const TaskTableToolbar: React.FC<TProps> = (props: TProps) => {
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

  return (
    <div className="flex items-center gap-2 my-5">
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

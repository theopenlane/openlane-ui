import { TableFilter } from '@/components/shared/table-filter/table-filter'
import { PlusCircle } from 'lucide-react'
import React, { useState } from 'react'
import { TableSort } from '@/components/shared/table-filter/table-sort'
import { Button } from '@repo/ui/button'
import { TASK_FILTER_FIELDS } from '@/components/pages/protected/tasks/table/table-config'
import { CreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/create-task-dialog'

type TProps = {
  onFilterChange: (filters: Record<string, any>) => void
  isLoading: boolean
}

const TaskTableToolbar: React.FC<TProps> = (props: TProps) => {
  const handleCreateNew = () => {}

  return (
    <div className="flex items-center gap-2 my-5">
      <div className="grow flex flex-row items-center gap-2">
        <TableFilter filterFields={TASK_FILTER_FIELDS} onFilterChange={() => props.onFilterChange} />
        {/*
        <TableSort sortFields={InternalPolicySortableFields} onSortChange={setSort} />
*/}
      </div>

      <div className="grow flex flex-row items-center gap-2 justify-end">
        <CreateTaskDialog />
      </div>
    </div>
  )
}

export default TaskTableToolbar

import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React from 'react'
import { CreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/create-task-dialog'
import { DownloadIcon } from 'lucide-react'
import { BulkCSVCreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/bulk-csv-create-task-dialog'
import { Button } from '@repo/ui/button'
import { LOGS_FILTER_FIELDS } from '@/components/pages/protected/organization/logs/table-config.ts'

type TProps = {
  onFilterChange: (filters: Record<string, any>) => void
  handleExport?: () => void
}

const LogsTableToolbar: React.FC<TProps> = (props: TProps) => {
  return (
    <div className="flex items-center gap-2 my-5">
      <div className="grow flex flex-row items-center gap-2">
        <TableFilter filterFields={LOGS_FILTER_FIELDS} onFilterChange={props.onFilterChange} />
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

export default LogsTableToolbar

import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React, { useState } from 'react'
import { SelectFilterField } from '@/types'
import { CreditCard as CardIcon, Table as TableIcon } from 'lucide-react'
import { CONTROLS_FILTER_FIELDS } from './table-config'

type TProps = {
  onFilterChange: (filters: Record<string, any>) => void
  owners?: { value: string; label: string }[]
}

const ControlsTableToolbar: React.FC<TProps> = (props: TProps) => {
  const [activeTab, setActiveTab] = useState<'table' | 'card'>('table')

  const filterFields = [
    ...CONTROLS_FILTER_FIELDS,
    {
      key: 'ownerID',
      label: 'Owners',
      type: 'select',
      options: props?.owners ?? [{ value: 'owner_1', label: 'Owner 1' }],
    } as SelectFilterField,
  ]

  return (
    <div className="flex items-center gap-2 my-5">
      <div className="grow flex flex-row items-center gap-2">
        <TableFilter filterFields={filterFields} onFilterChange={props.onFilterChange} />
      </div>
    </div>
  )
}

export default ControlsTableToolbar

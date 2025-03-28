import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React, { useState } from 'react'
import { SelectFilterField } from '@/types'
import { TableSort } from '@/components/shared/table-filter/table-sort'
import { CreditCard as CardIcon, Table as TableIcon } from 'lucide-react'
import { CONTROLS_FILTER_FIELDS, CONTROLS_SORT_FIELDS } from './table-config'

type TProps = {
  onFilterChange: (filters: Record<string, any>) => void
  onSortChange: (data: any) => void
  onTabChange: (tab: 'table' | 'card') => void
  //@todo for Bruno
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
        <TableSort sortFields={CONTROLS_SORT_FIELDS} onSortChange={props.onSortChange} />
      </div>
    </div>
  )
}

export default ControlsTableToolbar

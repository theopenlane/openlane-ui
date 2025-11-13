import React, { useMemo, useState } from 'react'
import { FilterField } from '@/types'
import { Popover, PopoverTrigger, PopoverContent } from '@repo/ui/popover'
import { Input } from '@repo/ui/input'
import { Checkbox } from '@repo/ui/checkbox'
import { ChevronDown } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'

type DropdownSearchFieldProps = {
  field: FilterField
  value: string | undefined
  onChange: (value: string | undefined) => void
}

export const DropdownSearchField: React.FC<DropdownSearchFieldProps> = ({ field, value, onChange }) => {
  const [search, setSearch] = useState('')

  const filteredOptions = useMemo(() => field.options?.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase())) ?? [], [field.options, search])

  const selectedLabel = value ? field.options?.find((o) => o.value === value)?.label : `Select ${field.label}`

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex text-sm h-10 px-3 justify-between border bg-input rounded-md items-center cursor-pointer">
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </div>
      </PopoverTrigger>

      <PopoverContent className="p-2 w-[240px]">
        <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-2" />
        <ul className="max-h-48 overflow-y-auto border rounded-md">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <li
                key={opt.value}
                onClick={() => onChange(value === opt.value ? undefined : opt.value)}
                className={cn('flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-muted text-sm', value === opt.value && 'bg-muted font-medium')}
              >
                <Checkbox checked={value === opt.value} />
                <span>{opt.label}</span>
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-sm text-muted-foreground">No results found</li>
          )}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

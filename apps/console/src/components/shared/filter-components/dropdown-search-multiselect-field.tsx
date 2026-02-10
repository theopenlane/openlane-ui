import React, { useMemo, useState } from 'react'
import { FilterField } from '@/types'
import { Popover, PopoverTrigger, PopoverContent } from '@repo/ui/popover'
import { Input } from '@repo/ui/input'
import { ChevronDown } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'

type DropdownSearchMultiselectProps = {
  field: FilterField
  value: string[] | undefined
  onChange: (value: string[] | undefined) => void
}

export const DropdownSearchMultiselect: React.FC<DropdownSearchMultiselectProps> = ({ field, value = [], onChange }) => {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const filteredOptions = useMemo(() => field.options?.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase())) ?? [], [field.options, search])

  const selectedLabel =
    value.length > 0
      ? field.options
          ?.filter((o) => value.includes(o.value))
          .map((o) => o.label)
          .join(', ')
      : `Select ${field.label}`

  const handleToggle = (val: string) => {
    const next = value.includes(val) ? value.filter((v) => v !== val) : [...value, val]
    onChange(next.length ? next : undefined)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary" className={cn('w-full justify-start text-left font-normal', value.length === 0 && 'text-muted-foreground')}>
          {selectedLabel}
          <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="p-2 w-[400px]">
        <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-2" />

        <ul className="max-h-48 overflow-y-auto border rounded-md flex flex-col">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <li key={opt.value} className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted cursor-pointer text-sm" onClick={() => handleToggle(opt.value)}>
                <Checkbox checked={value.includes(opt.value)} className="accent-primary" />
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

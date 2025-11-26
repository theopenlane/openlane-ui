import React, { useMemo, useState } from 'react'
import { FilterField } from '@/types'
import { Popover, PopoverTrigger, PopoverContent } from '@repo/ui/popover'
import { Input } from '@repo/ui/input'
import { ChevronDown } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import { Button } from '@repo/ui/button'

type DropdownSearchFieldProps = {
  field: FilterField
  value: string | undefined
  onChange: (value: string | undefined) => void
}

export const DropdownSearchField: React.FC<DropdownSearchFieldProps> = ({ field, value, onChange }) => {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const filteredOptions = useMemo(() => field.options?.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase())) ?? [], [field.options, search])

  const selectedLabel = value ? field.options?.find((o) => o.value === value)?.label : `Select ${field.label}`

  const handleClick = (value: string | undefined) => {
    onChange(value)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary" className={cn('w-full justify-start text-left font-normal', !value && 'text-muted-foreground')}>
          {selectedLabel}
          <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="p-2 w-[400px]">
        <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-2" />

        <div className="max-h-48 overflow-y-auto border rounded-md flex flex-col">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <div
                key={opt.value}
                role="radio"
                aria-checked={value === opt.value}
                onClick={() => handleClick(opt.value)}
                className={cn('flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-muted text-sm', value === opt.value && 'bg-muted font-medium')}
              >
                <div className="relative h-4 w-4 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full border border-primary" />
                  {value === opt.value && <div className="absolute h-1 w-1 rounded-full bg-primary" />}
                </div>
                {opt.label}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">No results found</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

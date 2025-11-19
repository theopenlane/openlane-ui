'use client'

import { useState, useMemo, JSX } from 'react'
import { Popover, PopoverTrigger, PopoverContent } from '../popover/popover'
import { Command, CommandInput, CommandGroup, CommandItem, CommandList, CommandEmpty } from '../command'
import { CircleFlag } from 'react-circle-flags'
import { countries } from 'country-data-list'
import { cn } from '../../lib/utils'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { Checkbox } from '../checkbox/checkbox'

interface Country {
  alpha2: string
  alpha3: string
  name: string
  emoji?: string
  status: string
  ioc: string
}

interface CountryDropdownProps {
  value: string[]
  onChange?: (value: string[]) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

const flagCache = new Map<string, JSX.Element>()
const getFlag = (alpha2: string) => {
  const key = alpha2.toLowerCase()
  if (!flagCache.has(key)) {
    flagCache.set(key, <CircleFlag countryCode={key} height={18} width={18} />)
  }
  return flagCache.get(key)!
}

const rawList: Country[] = countries.all.filter((c: any) => c.emoji && c.name && c.status !== 'deleted' && c.ioc !== 'PRK')

const COUNTRY_LIST: Country[] = Array.from(new Map(rawList.map((c) => [c.alpha3, c])).values())
export function CountryDropdown({ value = [], onChange, disabled, placeholder = 'Select countries', className }: CountryDropdownProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const s = search.toLowerCase()
    return COUNTRY_LIST.filter((c) => c.name.toLowerCase().includes(s))
  }, [search])

  const selectedCountries = COUNTRY_LIST.filter((c) => value.includes(c.alpha3))

  return (
    <Popover modal>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        )}
      >
        <div className="flex items-center gap-2 flex-wrap truncate max-w-[90%]">
          {selectedCountries.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            selectedCountries.map((c) => (
              <div key={c.alpha3} className="flex items-center gap-1 bg-accent px-1 py-0.5 text-xs rounded-md">
                {getFlag(c.alpha2)}
                {c.name}
              </div>
            ))
          )}
        </div>
        <ChevronDown size={16} />
      </PopoverTrigger>

      <PopoverContent side="bottom" collisionPadding={10} className="p-0 w-full min-w-[250px] pointer-events-auto overflow-visible">
        {/* Search input */}
        <div className="sticky top-0 z-10 bg-popover px-2 py-1 border-b">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-full h-8 px-2 rounded-md border bg-background text-sm" />
        </div>

        {/* Scrollable list */}
        <ul className="max-h-64 overflow-y-auto">
          {filtered.length === 0 && <li className="p-3 text-sm text-muted-foreground">No country found.</li>}

          {filtered.map((country) => {
            const isSelected = value.includes(country.alpha3)

            return (
              <li
                key={country.alpha3}
                onClick={() => {
                  const newSelection = isSelected ? value.filter((v) => v !== country.alpha3) : [...value, country.alpha3]

                  onChange?.(newSelection)
                }}
                className={cn('flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground', isSelected && 'bg-accent')}
              >
                <Checkbox checked={value.includes(country.alpha3)} />
                {getFlag(country.alpha2)}
                <span className="truncate">{country.name}</span>
              </li>
            )
          })}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

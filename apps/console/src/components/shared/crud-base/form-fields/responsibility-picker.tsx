'use client'

import { activatable } from '@repo/ui/lib/a11y'
import { useMemo, useState } from 'react'
import { User, Users, Type, Check, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { useUserSelect } from '@/lib/graphql-hooks/member'
import { usePersonnelSelect } from '@/lib/graphql-hooks/identity-holder'
import { useGroupSelect } from '@/lib/graphql-hooks/group'
import { useNotification } from '@/hooks/useNotification'
import { type ResponsibilitySelection } from './responsibility-field-utils'
import { PersonnelOptionItem } from './personnel-option-item'
import { isValidEmail } from '@/lib/validators'
import { ResponsibilitySelectionLabel } from './responsibility-type-icon'
import { cn } from '@repo/ui/lib/utils'

interface ResponsibilityPickerProps {
  allowPersonnel?: boolean
  value: ResponsibilitySelection
  onChange: (selection: ResponsibilitySelection) => void
  placeholder?: string
  triggerClassName?: string
  disabled?: boolean
}

export const ResponsibilityPicker: React.FC<ResponsibilityPickerProps> = ({ allowPersonnel = true, value, onChange, placeholder = 'Select owner...', triggerClassName, disabled = false }) => {
  const [open, setOpen] = useState(false)
  const [searchText, setSearchText] = useState('')

  const { userOptions } = useUserSelect({ enabled: open })
  const { groupOptions } = useGroupSelect({ enabled: open })
  const { personnelOptions } = usePersonnelSelect({
    searchText,
    enabled: open && allowPersonnel,
  })
  const { errorNotification } = useNotification()

  const normalizedSearchText = searchText.toLowerCase()

  const filteredUsers = useMemo(() => userOptions.filter((u) => u.label.toLowerCase().includes(normalizedSearchText)), [userOptions, normalizedSearchText])

  const filteredGroups = useMemo(() => groupOptions.filter((g) => g.label.toLowerCase().includes(normalizedSearchText)), [groupOptions, normalizedSearchText])

  const hasExactMatch = useMemo(
    () => filteredUsers.some((u) => u.label.toLowerCase() === normalizedSearchText) || filteredGroups.some((g) => g.label.toLowerCase() === normalizedSearchText),
    [filteredUsers, filteredGroups, normalizedSearchText],
  )

  const customEmailLabel = `Use "${searchText.trim()}" as custom email`

  const handleSelect = (selection: ResponsibilitySelection) => {
    if (selection?.type === 'string' && !isValidEmail(selection.value)) {
      errorNotification({ title: 'Invalid email', description: 'Custom values must be a valid email address' })
      return
    }

    onChange(selection)
    setOpen(false)
    setSearchText('')
  }

  return (
    <Popover open={open && !disabled} onOpenChange={(next) => !disabled && setOpen(next)}>
      <PopoverTrigger asChild>
        <div
          aria-disabled={disabled || undefined}
          className={cn('flex w-60 items-center gap-2 rounded-md border bg-input px-3 py-2 text-sm h-10', disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer', triggerClassName)}
          {...activatable(disabled ? undefined : () => setOpen(true))}
        >
          {value ? <ResponsibilitySelectionLabel selection={value} /> : <span className="text-muted-foreground truncate">{placeholder}</span>}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 bg-input! border w-(--radix-popover-trigger-width) min-w-(--radix-popover-trigger-width) max-h-(--radix-popover-content-available-height)"
        side="bottom"
        align="start"
        sideOffset={4}
      >
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search users, groups, personnel, or type a name/email..." value={searchText} onValueChange={setSearchText} />
          <CommandList className="max-h-[min(300px,var(--radix-popover-content-available-height,300px))]">
            <CommandEmpty>No results found.</CommandEmpty>
            {value && (
              <CommandGroup heading="Actions">
                <CommandItem value="clear-selection" onSelect={() => handleSelect(null)}>
                  <X className="mr-2 h-4 w-4" />
                  <span>Clear selection</span>
                </CommandItem>
              </CommandGroup>
            )}
            {filteredUsers.length > 0 && (
              <CommandGroup heading="Users">
                {filteredUsers.map((option) => (
                  <CommandItem key={`user-${option.value}`} value={`user-${option.label}`} onSelect={() => handleSelect({ type: 'user', value: option.value, displayName: option.label })}>
                    <User className="mr-2 h-4 w-4" />
                    <span className="truncate" title={option.label}>
                      {option.label}
                    </span>
                    {value?.type === 'user' && value?.value === option.value && <Check className="ml-auto h-4 w-4" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {filteredGroups.length > 0 && (
              <CommandGroup heading="Groups">
                {filteredGroups.map((option) => (
                  <CommandItem key={`group-${option.value}`} value={`group-${option.label}`} onSelect={() => handleSelect({ type: 'group', value: option.value, displayName: option.label })}>
                    <Users className="mr-2 h-4 w-4" />
                    <span className="truncate" title={option.label}>
                      {option.label}
                    </span>
                    {value?.type === 'group' && value?.value === option.value && <Check className="ml-auto h-4 w-4" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {allowPersonnel && personnelOptions.length > 0 && (
              <CommandGroup heading="Personnel">
                {personnelOptions.map((option) => (
                  <PersonnelOptionItem
                    key={`personnel-${option.value}`}
                    option={option}
                    isSelected={value?.type === 'personnel' && value.value === option.value}
                    onSelect={() => handleSelect({ type: 'personnel', value: option.value, displayName: option.label })}
                  />
                ))}
              </CommandGroup>
            )}
            {searchText.trim() && !hasExactMatch && !personnelOptions.some((person) => person.label.toLowerCase() === normalizedSearchText || person.email?.toLowerCase() === normalizedSearchText) && (
              <CommandGroup heading="Custom">
                <CommandItem value={`custom-${searchText}`} onSelect={() => handleSelect({ type: 'string', value: searchText.trim(), displayName: searchText.trim() })}>
                  <Type className="mr-2 h-4 w-4" />
                  <span className="truncate" title={customEmailLabel}>
                    {customEmailLabel}
                  </span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

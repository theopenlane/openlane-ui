'use client'

import { useMemo, useState } from 'react'
import { User, Users, Type, Check, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { useUserSelect } from '@/lib/graphql-hooks/member'
import { useGroupSelect } from '@/lib/graphql-hooks/group'
import { useNotification } from '@/hooks/useNotification'
import { type ResponsibilitySelection } from './responsibility-field-utils'
import { isValidEmail } from '@/lib/validators'

interface BulkResponsibilityPickerProps {
  value: ResponsibilitySelection
  onChange: (selection: ResponsibilitySelection) => void
}

export const BulkResponsibilityPicker: React.FC<BulkResponsibilityPickerProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false)
  const [searchText, setSearchText] = useState('')

  const { userOptions } = useUserSelect({})
  const { groupOptions } = useGroupSelect()
  const { errorNotification } = useNotification()

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'user':
        return <User className="h-3.5 w-3.5 text-muted-foreground" />
      case 'group':
        return <Users className="h-3.5 w-3.5 text-muted-foreground" />
      case 'string':
        return <Type className="h-3.5 w-3.5 text-muted-foreground" />
      default:
        return null
    }
  }

  const normalizedSearchText = searchText.toLowerCase()

  const filteredUsers = useMemo(() => userOptions.filter((u) => u.label.toLowerCase().includes(normalizedSearchText)), [userOptions, normalizedSearchText])

  const filteredGroups = useMemo(() => groupOptions.filter((g) => g.label.toLowerCase().includes(normalizedSearchText)), [groupOptions, normalizedSearchText])

  const hasExactMatch = useMemo(
    () => filteredUsers.some((u) => u.label.toLowerCase() === normalizedSearchText) || filteredGroups.some((g) => g.label.toLowerCase() === normalizedSearchText),
    [filteredUsers, filteredGroups, normalizedSearchText],
  )

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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex w-60 items-center gap-2 rounded-md border bg-input px-3 py-2 text-sm cursor-pointer h-10" onClick={() => setOpen(true)}>
          {value ? (
            <>
              {getTypeIcon(value.type)}
              <span className="truncate">{value.displayName || value.value}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Select owner...</span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 bg-input! border w-(--radix-popover-trigger-width) min-w-(--radix-popover-trigger-width) max-h-(--radix-popover-content-available-height)"
        side="bottom"
        align="start"
        sideOffset={4}
      >
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search users, groups, or type a name..." value={searchText} onValueChange={setSearchText} />
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
                    <span>{option.label}</span>
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
                    <span>{option.label}</span>
                    {value?.type === 'group' && value?.value === option.value && <Check className="ml-auto h-4 w-4" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {searchText.trim() && !hasExactMatch && (
              <CommandGroup heading="Custom">
                <CommandItem value={`custom-${searchText}`} onSelect={() => handleSelect({ type: 'string', value: searchText.trim(), displayName: searchText.trim() })}>
                  <Type className="mr-2 h-4 w-4" />
                  <span>Use &quot;{searchText.trim()}&quot; as custom email</span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

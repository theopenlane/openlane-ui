'use client'

import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { useFormContext } from 'react-hook-form'
import { type InternalEditingType } from '../generic-sheet'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon, User, Users, Type, Check, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { useMemo, useRef, useState } from 'react'
import useClickOutsideWithPortal from '@/hooks/useClickOutsideWithPortal'
import useEscapeKey from '@/hooks/useEscapeKey'
import { useUserSelect } from '@/lib/graphql-hooks/member'
import { useGroupSelect } from '@/lib/graphql-hooks/group'
import { useNotification } from '@/hooks/useNotification'
import { type ResponsibilitySelection, buildResponsibilityInlineUpdate } from './responsibility-field-utils'
import { isValidEmail } from '@/lib/validators'

interface ResponsibilityFieldProps {
  name: string
  label: string
  fieldBaseName: string
  isEditing: boolean
  isEditAllowed: boolean
  isCreate?: boolean
  internalEditing: string | null
  setInternalEditing: InternalEditingType
  handleUpdate?: (input: Record<string, string | boolean | undefined>) => Promise<void>
  tooltipContent?: string
}

export const ResponsibilityField: React.FC<ResponsibilityFieldProps> = ({
  name,
  label,
  fieldBaseName,
  isEditing,
  isEditAllowed,
  isCreate = false,
  internalEditing,
  setInternalEditing,
  handleUpdate,
  tooltipContent,
}) => {
  const { control } = useFormContext()
  const [open, setOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const { userOptions } = useUserSelect({})
  const { groupOptions } = useGroupSelect()
  const { errorNotification } = useNotification()

  const isFieldEditing = isCreate || isEditing || internalEditing === name

  useClickOutsideWithPortal(
    () => {
      if (open) {
        setOpen(false)
        if (!isEditing) {
          setInternalEditing(null)
        }
      }
    },
    { refs: { triggerRef, popoverRef } },
  )

  useEscapeKey(() => {
    if (open) {
      setOpen(false)
      if (!isEditing) {
        setInternalEditing(null)
      }
    }
  })

  const handleClick = () => {
    if (!isEditing && isEditAllowed) {
      setInternalEditing(name)
      setOpen(true)
    }
  }

  const handleSelect = async (selection: ResponsibilitySelection, field: { onChange: (value: ResponsibilitySelection) => void }) => {
    if (selection?.type === 'string' && !isValidEmail(selection.value)) {
      errorNotification({ title: 'Invalid email', description: 'Custom values must be a valid email address' })
      return
    }

    field.onChange(selection)
    setOpen(false)
    setSearchText('')

    if (!isEditing && !isCreate && handleUpdate) {
      const payload = buildResponsibilityInlineUpdate(fieldBaseName, selection)
      await handleUpdate(payload)
    }

    if (!isEditing) {
      setInternalEditing(null)
    }
  }

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

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const currentValue = field.value as ResponsibilitySelection

        return (
          <FormItem>
            <div className="flex items-center gap-1">
              <FormLabel>{label}</FormLabel>
              {tooltipContent && <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={tooltipContent} />}
            </div>
            <FormControl>
              {isFieldEditing ? (
                <div ref={triggerRef}>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <div className="flex w-full items-center gap-2 rounded-md border bg-input px-3 py-2 text-sm cursor-pointer h-10" onClick={() => setOpen(true)}>
                        {currentValue ? (
                          <>
                            {getTypeIcon(currentValue.type)}
                            <span className="truncate">{currentValue.displayName || currentValue.value}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">Select owner...</span>
                        )}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent
                      ref={popoverRef}
                      className="p-0 bg-input! border w-(--radix-popover-trigger-width) min-w-(--radix-popover-trigger-width)"
                      side="bottom"
                      align="start"
                      sideOffset={4}
                    >
                      <Command shouldFilter={false}>
                        <CommandInput placeholder="Search users, groups, or type a name..." value={searchText} onValueChange={setSearchText} />
                        <CommandList>
                          <CommandEmpty>No results found.</CommandEmpty>
                          {currentValue && (
                            <CommandGroup heading="Actions">
                              <CommandItem value="clear-selection" onSelect={() => handleSelect(null, field)}>
                                <X className="mr-2 h-4 w-4" />
                                <span>Clear selection</span>
                              </CommandItem>
                            </CommandGroup>
                          )}
                          {filteredUsers.length > 0 && (
                            <CommandGroup heading="Users">
                              {filteredUsers.map((option) => (
                                <CommandItem
                                  key={`user-${option.value}`}
                                  value={`user-${option.label}`}
                                  onSelect={() => handleSelect({ type: 'user', value: option.value, displayName: option.label }, field)}
                                >
                                  <User className="mr-2 h-4 w-4" />
                                  <span>{option.label}</span>
                                  {currentValue?.type === 'user' && currentValue?.value === option.value && <Check className="ml-auto h-4 w-4" />}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                          {filteredGroups.length > 0 && (
                            <CommandGroup heading="Groups">
                              {filteredGroups.map((option) => (
                                <CommandItem
                                  key={`group-${option.value}`}
                                  value={`group-${option.label}`}
                                  onSelect={() => handleSelect({ type: 'group', value: option.value, displayName: option.label }, field)}
                                >
                                  <Users className="mr-2 h-4 w-4" />
                                  <span>{option.label}</span>
                                  {currentValue?.type === 'group' && currentValue?.value === option.value && <Check className="ml-auto h-4 w-4" />}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                          {searchText.trim() && !hasExactMatch && (
                            <CommandGroup heading="Custom">
                              <CommandItem value={`custom-${searchText}`} onSelect={() => handleSelect({ type: 'string', value: searchText.trim(), displayName: searchText.trim() }, field)}>
                                <Type className="mr-2 h-4 w-4" />
                                <span>Use &quot;{searchText.trim()}&quot; as custom email</span>
                              </CommandItem>
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-md px-1 py-2 text-sm cursor-pointer hover:bg-accent" onClick={handleClick}>
                  {currentValue ? (
                    <>
                      {getTypeIcon(currentValue.type)}
                      <span>{currentValue.displayName || currentValue.value}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground italic">Not set</span>
                  )}
                </div>
              )}
            </FormControl>
          </FormItem>
        )
      }}
    />
  )
}

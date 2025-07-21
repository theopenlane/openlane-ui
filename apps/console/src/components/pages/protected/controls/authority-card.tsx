'use client'

import React, { useState } from 'react'
import { useGetAllGroups } from '@/lib/graphql-hooks/groups'
import { ControlDetailsFieldsFragment, Group, UpdateControlInput, UpdateSubcontrolInput } from '@repo/codegen/src/schema'
import { Card } from '@repo/ui/cardpanel'
import { CircleUser, CircleArrowRight, ChevronDown } from 'lucide-react'
import { Avatar } from '@/components/shared/avatar/avatar'
import { useFormContext, Controller } from 'react-hook-form'
import { Option } from '@repo/ui/multiple-selector'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'

interface AuthorityCardProps {
  controlOwner?: ControlDetailsFieldsFragment['controlOwner']
  delegate?: ControlDetailsFieldsFragment['delegate']
  isEditing: boolean
  handleUpdate?: (val: UpdateControlInput | UpdateSubcontrolInput) => void
}

const AuthorityCard: React.FC<AuthorityCardProps> = ({ controlOwner, delegate, isEditing, handleUpdate }) => {
  const [editingField, setEditingField] = useState<'owner' | 'delegate' | null>(null)
  const { data } = useGetAllGroups({ where: {}, enabled: !!isEditing || !!editingField })
  const groups = data?.groups?.edges?.map((edge) => edge?.node) || []

  const options: Option[] = groups.map((g) => ({
    label: g?.name || '',
    value: g?.id || '',
  }))

  const handleSelect = (field: 'controlOwnerID' | 'delegateID', value: string) => {
    handleUpdate?.({ [field]: value })
    setEditingField(null)
  }

  const renderField = (fieldKey: 'controlOwnerID' | 'delegateID', label: string, icon: React.ReactNode, value: Group | null | undefined, editingKey: 'owner' | 'delegate') => {
    const displayName = value?.displayName || `No ${label}`
    const showEditable = isEditing || editingField === editingKey

    return (
      <div className="flex justify-between items-center">
        <div className="flex gap-2 items-center">
          {icon}
          <span>{label}</span>
        </div>

        {showEditable ? (
          <SearchableSingleSelect fieldName={fieldKey} options={options} placeholder={`Select ${label.toLowerCase()}`} onChange={(val) => handleSelect(fieldKey, val)} autoFocus />
        ) : (
          <TooltipProvider disableHoverableContent>
            <Tooltip>
              <TooltipTrigger
                className="w-[200px] cursor-pointer"
                onClick={() => {
                  if (!isEditing) setEditingField(editingKey)
                }}
              >
                <div className="flex gap-2 items-center">
                  <Avatar entity={value as Group} variant="small" />
                  <span className="truncate">{displayName}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">{displayName}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    )
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-medium mb-2">Authority</h3>
      <div className="flex flex-col gap-4">
        {renderField('controlOwnerID', 'Owner', <CircleUser size={16} className="text-brand" />, controlOwner as Group, 'owner')}
        {renderField('delegateID', 'Delegate', <CircleArrowRight size={16} className="text-brand" />, delegate as Group, 'delegate')}
      </div>
    </Card>
  )
}

export default AuthorityCard

interface SearchableSingleSelectProps {
  fieldName: string
  options: Option[]
  placeholder?: string
  onChange?: (val: string) => void
  autoFocus?: boolean
}

export const SearchableSingleSelect: React.FC<SearchableSingleSelectProps> = ({ fieldName, options, placeholder = 'Select an option...', onChange, autoFocus }) => {
  const { control } = useFormContext()
  const [open, setOpen] = React.useState(false)

  return (
    <Controller
      name={fieldName}
      control={control}
      render={({ field }) => {
        const selected = options.find((opt) => opt.value === field.value)

        return (
          <div className="w-[200px]">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <div className="w-full flex text-sm h-10 px-3 !py-0 justify-between border bg-input-background rounded-md items-center cursor-pointer" onClick={() => setOpen(true)}>
                  <span className="truncate">{selected?.label || placeholder}</span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0 !bg-input-background border" side="bottom">
                <Command shouldFilter autoFocus={autoFocus}>
                  <CommandInput placeholder="Search..." />
                  <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup>
                      {options.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.label}
                          onSelect={() => {
                            field.onChange(option.value)
                            onChange?.(option.value)
                            setOpen(false)
                          }}
                        >
                          {option.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        )
      }}
    />
  )
}

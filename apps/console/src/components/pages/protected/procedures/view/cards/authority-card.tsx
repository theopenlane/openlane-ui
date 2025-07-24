'use client'

import React, { useState } from 'react'
import { Group, ProcedureByIdFragment, UpdateProcedureInput } from '@repo/codegen/src/schema'
import { Card } from '@repo/ui/cardpanel'
import { ChevronDown, Stamp, CircleArrowRight, HelpCircle } from 'lucide-react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { Option } from '@repo/ui/multiple-selector'
import { Avatar } from '@/components/shared/avatar/avatar'
import { useGetAllGroups } from '@/lib/graphql-hooks/groups'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { EditProcedureMetadataFormData } from '../hooks/use-form-schema'
import useClickOutsideWithPortal from '@/hooks/useClickOutsideWithPortal'
import useEscapeKey from '@/hooks/useEscapeKey'

type TAuthorityCardProps = {
  form: UseFormReturn<EditProcedureMetadataFormData>
  approver?: ProcedureByIdFragment['approver']
  delegate?: ProcedureByIdFragment['delegate']
  isEditing: boolean
  editAllowed: boolean
  handleUpdate?: (val: UpdateProcedureInput) => void
  inputClassName?: string
}

const AuthorityCard: React.FC<TAuthorityCardProps> = ({ form, isEditing, approver, delegate, editAllowed, handleUpdate, inputClassName }) => {
  const [editingField, setEditingField] = useState<'approver' | 'delegate' | null>(null)

  const { data } = useGetAllGroups({ where: {}, enabled: isEditing || !!editingField })
  const groups = data?.groups?.edges?.map((edge) => edge?.node) || []

  const options: Option[] = groups.map((g) => ({
    label: g?.name || '',
    value: g?.id || '',
  }))

  const handleSelect = (field: 'approverID' | 'delegateID', value: string) => {
    const currentValue = form.getValues(field)

    if (!isEditing && handleUpdate && currentValue !== value) {
      handleUpdate({ [field]: value })
    }

    setEditingField(null)
  }

  const renderField = (fieldKey: 'approverID' | 'delegateID', label: string, icon: React.ReactNode, value: Group | null | undefined, editingKey: 'approver' | 'delegate') => {
    const displayName = value?.displayName || `No ${label}`
    const showEditable = editAllowed && (isEditing || editingField === editingKey)

    return (
      <div className="flex justify-between items-center">
        <div className={`flex gap-2 w-[200px] items-center ${inputClassName ?? ''} `}>
          {icon}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <span className="cursor-help">{label}</span>
                  <HelpCircle size={12} className="text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {label === 'Approver'
                    ? 'The group or individual responsible for approving this policy before it can be published.'
                    : 'The group or individual who can act on behalf of the approver when they are unavailable.'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {showEditable ? (
          <SearchableSingleSelect
            form={form}
            fieldName={fieldKey}
            placeholder={`Select ${label.toLowerCase()}`}
            options={options}
            autoFocus
            onChange={(val) => handleSelect(fieldKey, val)}
            onClose={() => setEditingField(null)}
          />
        ) : (
          <TooltipProvider disableHoverableContent>
            <Tooltip>
              <TooltipTrigger
                type="button"
                className={`w-[200px] ${editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                onDoubleClick={() => {
                  if (!isEditing && editAllowed) {
                    setEditingField(editingKey)
                  }
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
        {renderField('approverID', 'Approver', <Stamp size={16} className="text-brand" />, approver as Group, 'approver')}
        {renderField('delegateID', 'Delegate', <CircleArrowRight size={16} className="text-brand" />, delegate as Group, 'delegate')}
      </div>
    </Card>
  )
}

export default AuthorityCard

interface SearchableSingleSelectProps {
  fieldName: keyof EditProcedureMetadataFormData
  placeholder?: string
  form: UseFormReturn<EditProcedureMetadataFormData>
  options: Option[]
  onChange?: (val: string) => void
  autoFocus?: boolean
  onClose?: () => void
}

export const SearchableSingleSelect: React.FC<SearchableSingleSelectProps> = ({ fieldName, form, placeholder = 'Select an option...', options, onChange, autoFocus, onClose }) => {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLDivElement>(null)
  const popoverRef = React.useRef<HTMLDivElement>(null)

  useClickOutsideWithPortal(() => {
    onClose?.()
  }, [triggerRef, popoverRef])

  useEscapeKey(() => {
    onClose?.()
  })

  return (
    <Controller
      name={fieldName}
      control={form.control}
      render={({ field }) => {
        const selected = options.find((opt) => opt.value === field.value)

        return (
          <div ref={triggerRef} className="w-[200px]">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <div className="w-full flex text-sm h-10 px-3 !py-0 justify-between border bg-input-background rounded-md items-center cursor-pointer" onClick={() => setOpen(true)}>
                  <span className="truncate">{selected?.label || placeholder}</span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </div>
              </PopoverTrigger>
              <PopoverContent ref={popoverRef} className="w-[200px] p-0 !bg-input-background border" side="bottom">
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
                            onChange?.(option.value)
                            field.onChange(option.value)
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

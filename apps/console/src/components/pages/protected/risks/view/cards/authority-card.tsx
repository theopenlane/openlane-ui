'use client'

import React, { useState } from 'react'
import { Group, RiskFieldsFragment, UpdateRiskInput } from '@repo/codegen/src/schema'
import { Card } from '@repo/ui/cardpanel'
import { ChevronDown, Stamp, CircleArrowRight } from 'lucide-react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { Option } from '@repo/ui/multiple-selector'
import { Avatar } from '@/components/shared/avatar/avatar'
import { useGetAllGroups } from '@/lib/graphql-hooks/groups'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { EditRisksFormData } from '@/components/pages/protected/risks/view/hooks/use-form-schema'
import useClickOutsideWithPortal from '@/hooks/useClickOutsideWithPortal'
import useEscapeKey from '@/hooks/useEscapeKey'

type TAuthorityCardProps = {
  form: UseFormReturn<EditRisksFormData>
  stakeholder?: RiskFieldsFragment['stakeholder']
  delegate?: RiskFieldsFragment['delegate']
  isEditing: boolean
  isEditAllowed?: boolean
  handleUpdate?: (val: UpdateRiskInput) => void
  inputClassName?: string
  risk?: RiskFieldsFragment
}

const AuthorityCard: React.FC<TAuthorityCardProps> = ({ form, isEditing, stakeholder, delegate, isEditAllowed = true, handleUpdate, inputClassName, risk }) => {
  const [editingField, setEditingField] = useState<'stakeholder' | 'delegate' | null>(null)
  const { data } = useGetAllGroups({ where: {}, enabled: isEditing || !!editingField })
  const groups = data?.groups?.edges?.map((edge) => edge?.node) || []

  const options: Option[] = groups.map((g) => ({
    label: g?.name || '',
    value: g?.id || '',
  }))

  const handleSelect = (field: keyof EditRisksFormData, value: string) => {
    if (!isEditing && handleUpdate && risk) {
      const currentValue = field === 'stakeholderID' ? risk.stakeholder?.id ?? null : field === 'delegateID' ? risk.delegate?.id ?? null : null
      // only call handleUpdate if the value actually changed
      if (currentValue !== value) {
        handleUpdate({ [field]: value })
      }
    }

    setEditingField(null)
  }

  const renderField = (fieldKey: keyof EditRisksFormData, label: string, icon: React.ReactNode, value: Group | null | undefined, editingKey: 'stakeholder' | 'delegate') => {
    const displayName = value?.displayName || `No ${label}`
    const showEditable = isEditAllowed && (isEditing || editingField === editingKey)

    return (
      <div className="flex justify-between items-center">
        <div className={`flex gap-2 w-[200px] items-center ${inputClassName ?? ''}`}>
          {icon}
          <span>{label}</span>
        </div>

        {showEditable ? (
          <SearchableSingleSelect
            form={form}
            fieldName={fieldKey}
            options={options}
            placeholder={`Select ${label.toLowerCase()}`}
            onChange={(val) => handleSelect(fieldKey, val)}
            autoFocus
            onClose={() => setEditingField(null)}
          />
        ) : (
          <TooltipProvider disableHoverableContent>
            <Tooltip>
              <TooltipTrigger
                type="button"
                className={`w-[200px] ${isEditAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                onDoubleClick={() => {
                  if (!isEditing && isEditAllowed) setEditingField(editingKey)
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
    <Card className="p-4 !mt-2">
      <h3 className="text-lg font-medium mb-2">Authority</h3>
      <div className="flex flex-col gap-4">
        {renderField('stakeholderID', 'Stakeholder', <Stamp size={16} className="text-brand" />, stakeholder as Group, 'stakeholder')}
        {renderField('delegateID', 'Delegate', <CircleArrowRight size={16} className="text-brand" />, delegate as Group, 'delegate')}
      </div>
    </Card>
  )
}

export default AuthorityCard

interface SearchableSingleSelectProps {
  fieldName: keyof EditRisksFormData
  form: UseFormReturn<EditRisksFormData>
  options: Option[]
  placeholder?: string
  onChange?: (val: string) => void
  autoFocus?: boolean
  onClose?: () => void
}

export const SearchableSingleSelect: React.FC<SearchableSingleSelectProps> = ({ fieldName, form, options, placeholder = 'Select an option...', onChange, autoFocus, onClose }) => {
  const [open, setOpen] = React.useState(false)

  const triggerRef = React.useRef<HTMLDivElement>(null)
  const popoverRef = React.useRef<HTMLDivElement>(null)

  useClickOutsideWithPortal(
    () => {
      onClose?.()
    },
    { refs: { triggerRef, popoverRef } },
  )

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

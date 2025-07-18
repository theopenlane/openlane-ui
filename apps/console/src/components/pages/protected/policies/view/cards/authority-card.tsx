'use client'

import React from 'react'
import { Group, InternalPolicyByIdFragment } from '@repo/codegen/src/schema'
import { Card } from '@repo/ui/cardpanel'
import { ChevronDown, Stamp, CircleArrowRight, HelpCircle } from 'lucide-react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { Option } from '@repo/ui/multiple-selector'
import { Avatar } from '@/components/shared/avatar/avatar.tsx'
import { useGetAllGroups } from '@/lib/graphql-hooks/groups.ts'
import { EditPolicyMetadataFormData } from '@/components/pages/protected/policies/view/hooks/use-form-schema.ts'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'

type TAuthorityCardProps = {
  form: UseFormReturn<EditPolicyMetadataFormData>
  approver?: InternalPolicyByIdFragment['approver']
  delegate?: InternalPolicyByIdFragment['delegate']
  isEditing: boolean
  inputClassName?: string
}

const AuthorityCard: React.FC<TAuthorityCardProps> = ({ form, isEditing, approver, delegate, inputClassName }) => {
  const { data } = useGetAllGroups({ where: {}, enabled: isEditing })
  const groups = data?.groups?.edges?.map((edge) => edge?.node) || []

  return (
    <Card className="p-4">
      <h3 className="text-lg font-medium mb-2">Authority</h3>
      <div className="flex flex-col gap-4">
        {/* Approver */}
        <div className="flex justify-between items-center">
          <div className={`flex gap-2 w-[200px] items-center ${inputClassName ?? ''} `}>
            <Stamp size={16} className="text-brand" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <span className="cursor-help">Approver</span>
                    <HelpCircle size={12} className="text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>The group or individual responsible for approving this policy before it can be published.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {isEditing && (
            <SearchableSingleSelect
              form={form}
              fieldName="approverID"
              placeholder="Select approver"
              options={groups.map((g) => ({
                label: g?.name || '',
                value: g?.id || '',
              }))}
            />
          )}

          {!isEditing && (
            <TooltipProvider disableHoverableContent>
              <Tooltip>
                <Avatar entity={approver as Group} variant="small" />
                <TooltipTrigger className="w-[200px] cursor-default min-w-[160px] max-w-[160px]">
                  <div className="flex gap-2">
                    <span className="truncate">{approver?.displayName || 'No Approver'} </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">{approver?.displayName || 'No Approver'}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Delegate */}
        <div className="flex justify-between items-center">
          <div className={`flex gap-2 w-[200px] items-center ${inputClassName ?? ''}`}>
            <CircleArrowRight size={16} className="text-brand" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <span className="cursor-help">Delegate</span>
                    <HelpCircle size={12} className="text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>The group or individual who can act on behalf of the approver when they are unavailable.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {isEditing && (
            <SearchableSingleSelect
              form={form}
              fieldName="delegateID"
              placeholder="Select delegate"
              options={groups.map((g) => ({
                label: g?.name || '',
                value: g?.id || '',
              }))}
            />
          )}

          {!isEditing && (
            <TooltipProvider disableHoverableContent>
              <Tooltip>
                <Avatar entity={delegate as Group} variant="small" />
                <TooltipTrigger className="w-[200px] cursor-default  min-w-[160px] max-w-[160px]">
                  <div className="flex gap-2">
                    <span className="truncate">{delegate?.displayName || 'No Delegate'} </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">{delegate?.displayName || 'No Delegate'}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </Card>
  )
}

interface SearchableSingleSelectProps {
  fieldName: keyof EditPolicyMetadataFormData
  placeholder?: string
  form: UseFormReturn<EditPolicyMetadataFormData>
  options: Option[]
}

export const SearchableSingleSelect: React.FC<SearchableSingleSelectProps> = ({ fieldName, form, placeholder = 'Select an option...', options }) => {
  const [open, setOpen] = React.useState(false)

  return (
    <Controller
      name={fieldName}
      control={form.control}
      render={({ field }) => {
        const selected = options.find((opt) => opt.value === field.value)

        return (
          <div className="w-[200px]">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <div className="w-full h-10 px-3 border bg-input-background rounded-md flex items-center justify-between cursor-pointer overflow-hidden min-w-[180px]">
                  <span className="block truncate whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">{selected?.label || placeholder}</span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0 !bg-input-background border">
                <Command>
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

export default AuthorityCard

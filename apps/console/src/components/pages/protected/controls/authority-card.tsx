'use client'

import React from 'react'
import { useGetAllGroups } from '@/lib/graphql-hooks/groups'
import { ControlDetailsFieldsFragment, Group } from '@repo/codegen/src/schema'
import { Card } from '@repo/ui/cardpanel'
import { CircleUser, CircleArrowRight, ChevronsUpDown, Check, ChevronDown } from 'lucide-react'
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
}

const AuthorityCard: React.FC<AuthorityCardProps> = ({ controlOwner, delegate, isEditing }) => {
  const { data } = useGetAllGroups({ where: {}, enabled: !!isEditing })

  const groups = data?.groups?.edges?.map((edge) => edge?.node!) || []

  return (
    <Card className="p-4">
      <h3 className="text-lg font-medium mb-2">Authority</h3>
      <div className="flex flex-col gap-4">
        {/* Owner */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <CircleUser size={16} className="text-brand" />
            <span>Owner</span>
          </div>

          {isEditing ? (
            <SearchableSingleSelect
              fieldName="controlOwnerID"
              placeholder="Select a group"
              options={groups.map((g) => ({
                label: g.name,
                value: g.id,
              }))}
            />
          ) : (
            <TooltipProvider disableHoverableContent>
              <Tooltip>
                <Avatar entity={controlOwner as Group} variant="small" />
                <TooltipTrigger className="w-[200px] cursor-default">
                  <div className="flex gap-2">
                    <span className="truncate">{controlOwner?.displayName || 'No Owner'} </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">{controlOwner?.displayName || 'No Owner'}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {/* Delegate */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <CircleArrowRight size={16} className="text-brand" />
            <span>Delegate</span>
          </div>

          {isEditing ? (
            <SearchableSingleSelect
              fieldName="delegateID"
              placeholder="Select a group"
              options={groups.map((g) => ({
                label: g.name,
                value: g.id,
              }))}
            />
          ) : (
            <TooltipProvider disableHoverableContent>
              <Tooltip>
                <Avatar entity={delegate as Group} variant="small" />
                <TooltipTrigger className="w-[200px] cursor-default">
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

export default AuthorityCard

interface SearchableSingleSelectProps {
  fieldName: string
  formLabel?: string
  placeholder?: string
  options: Option[]
}

export const SearchableSingleSelect: React.FC<SearchableSingleSelectProps> = ({ fieldName, formLabel, placeholder = 'Select an option...', options }) => {
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
            {formLabel && <label className="text-sm font-medium block mb-1">{formLabel}</label>}
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild className="flex">
                <div className="w-full flex text-sm h-10 px-3 !py-0 justify-between border bg-input-background rounded-md items-center cursor-pointer ">
                  <span className="truncate">{selected?.label || placeholder}</span>
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

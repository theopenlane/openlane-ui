'use client'

import React, { useState } from 'react'
import { useGetAllGroups } from '@/lib/graphql-hooks/groups'
import { ControlDetailsFieldsFragment, Group } from '@repo/codegen/src/schema'
import { Card } from '@repo/ui/cardpanel'
import { CircleUser, CircleArrowRight, ChevronsUpDown, Check, ChevronDown } from 'lucide-react'
import { Avatar } from '@/components/shared/avatar/avatar'
import { useFormContext, Controller } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import MultipleSelector, { Option } from '@repo/ui/multiple-selector'
import { Input } from '@repo/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Button } from '@repo/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { cn } from '@repo/ui/lib/utils'

interface AuthorityCardProps {
  controlOwner: ControlDetailsFieldsFragment['controlOwner']
  delegate: ControlDetailsFieldsFragment['delegate']
  isEditing: boolean
}

const AuthorityCard: React.FC<AuthorityCardProps> = ({ controlOwner, delegate, isEditing }) => {
  const { data } = useGetAllGroups({ where: {}, enabled: !!isEditing })
  const { control } = useFormContext()

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
              formLabel="Owner"
              placeholder="Select a group"
              options={groups.map((g) => ({
                label: g.displayName,
                value: g.id,
              }))}
            />
          ) : (
            <div className="flex gap-2">
              <Avatar entity={controlOwner as Group} variant="small" />
              <span>{controlOwner?.displayName || 'No Owner'}</span>
            </div>
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
              formLabel="Delegate"
              placeholder="Select a group"
              options={groups.map((g) => ({
                label: g.displayName,
                value: g.id,
              }))}
            />
          ) : (
            <div className="flex gap-2">
              <Avatar entity={delegate as Group} variant="small" />
              <span>{delegate?.displayName || 'No Delegate'}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export default AuthorityCard

interface SearchableSingleSelectProps {
  fieldName: string
  formLabel: string
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
            <label className="text-sm font-medium block mb-1">{formLabel}</label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild className="flex">
                <div className="w-full flex text-sm h-10 px-3 !py-0 justify-between border-border-light dark:border-border-dark border bg-input-background  rounded-md items-center cursor-pointer ">
                  <span>{selected?.label || placeholder}</span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0 !bg-input-background">
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

'use client'

import React, { useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { Label } from '@repo/ui/label'
import { Check } from 'lucide-react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { cn } from '@repo/ui/lib/utils'
import { useStandardsSelect } from '@/lib/graphql-hooks/standard'

interface Props {
  isEditing: boolean
}

export const StandardField = ({ isEditing }: Props) => {
  const { control, watch } = useFormContext()
  const [open, setOpen] = useState(false)

  const { standardOptions, isLoading } = useStandardsSelect({})

  const selectedId = watch('standardID')
  const selectedStandard = standardOptions.find((s) => s.value === selectedId)

  return (
    <div className="flex flex-col gap-2">
      <Label>Standard</Label>
      {isEditing ? (
        <Controller
          control={control}
          name="standardID"
          render={({ field }) => (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  role="combobox"
                  aria-expanded={open}
                  disabled={isLoading}
                  className="w-full flex justify-between font-normal border border-border bg-input rounded-md h-10 items-center px-3 text-sm"
                >
                  <span className="truncate">{field.value ? selectedStandard?.label || 'Select a standard...' : 'Select a standard...'}</span>

                  <span className="flex items-center gap-2">
                    {field.value && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          field.onChange(undefined) // or null
                          setOpen(false)
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        ✕
                      </button>
                    )}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search standards..." />
                  <CommandList>
                    <CommandEmpty>No standards found.</CommandEmpty>
                    <CommandGroup>
                      {standardOptions.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.label}
                          onSelect={() => {
                            field.onChange(option.value)
                            setOpen(false)
                          }}
                        >
                          <Check className={cn('mr-2 h-4 w-4', field.value === option.value ? 'opacity-100' : 'opacity-0')} />
                          {option.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        />
      ) : (
        <p className="text-base text-muted-foreground mt-1">{selectedStandard?.label || '—'}</p>
      )}
    </div>
  )
}

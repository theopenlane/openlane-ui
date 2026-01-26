'use client'
import React, { useMemo, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { Label } from '@repo/ui/label'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enums'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { cn } from '@repo/ui/lib/utils'

interface Props {
  isEditing: boolean
}

interface Option {
  label: string
  value: string
}

export const CategoryField = ({ isEditing }: Props) => {
  const {
    control,
    formState: { errors },
    watch,
  } = useFormContext()

  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [createdOptions, setCreatedOptions] = useState<Option[]>([])

  const { enumOptions, isLoading } = useGetCustomTypeEnums({
    where: {
      objectType: 'trust_center_doc',
      field: 'kind',
    },
  })

  const allOptions = useMemo(() => {
    const combined = [...enumOptions, ...createdOptions]
    const seen = new Set()
    return combined.filter((option) => {
      const duplicate = seen.has(option.value)
      seen.add(option.value)
      return !duplicate
    })
  }, [enumOptions, createdOptions])

  const selectedValue = watch('category')

  const showCreateOption = useMemo(() => {
    if (!searchValue) return false
    return !allOptions.some((option) => option.label.toLowerCase() === searchValue.toLowerCase())
  }, [searchValue, allOptions])

  const handleCreateNew = (val: string, onChange: (val: string) => void) => {
    const trimmedVal = val.trim()
    if (!trimmedVal) return

    const newOption = { label: trimmedVal, value: trimmedVal }
    setCreatedOptions((prev) => [...prev, newOption])
    onChange(trimmedVal)
    setOpen(false)
    setSearchValue('')
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>Category</Label>
      {isEditing ? (
        <>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <button role="combobox" aria-expanded={open} className="w-full flex justify-between font-normal border border-border bg-input rounded-md h-10 items-center px-3" disabled={isLoading}>
                    {field.value ? allOptions.find((option) => option.value === field.value)?.label || field.value : 'Select or create category...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                  <Command
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === 'Tab') && showCreateOption) {
                        e.preventDefault()
                        handleCreateNew(searchValue, field.onChange)
                      }
                    }}
                  >
                    <CommandInput placeholder="Search category..." value={searchValue} onValueChange={setSearchValue} />
                    <CommandList>
                      <CommandEmpty className="p-0">
                        {showCreateOption && (
                          <div
                            className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                            onClick={() => handleCreateNew(searchValue, field.onChange)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            <span>Create &quot;{searchValue}&quot;</span>
                          </div>
                        )}
                        {!showCreateOption && !isLoading && <div className="p-4 text-center text-sm text-muted-foreground">No results found.</div>}
                      </CommandEmpty>
                      <CommandGroup>
                        {allOptions.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.label}
                            onSelect={() => {
                              field.onChange(option.value)
                              setOpen(false)
                              setSearchValue('')
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
          {errors.category && <p className="text-red-500 text-sm mt-1">{String(errors.category.message)}</p>}
        </>
      ) : (
        <p className="text-base text-muted-foreground mt-1">{allOptions.find((o) => o.value === selectedValue)?.label || selectedValue || '—'}</p>
      )}
    </div>
  )
}

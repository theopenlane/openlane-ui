'use client'

import { useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { ChevronDown, Check } from 'lucide-react'
import { FormField, FormItem, FormControl, FormLabel } from '@repo/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { cn } from '@repo/ui/lib/utils'

type SubprocessorOption = {
  label: string
  value: string
  logo?: string | null
}

interface SubprocessorSelectFieldProps {
  options: SubprocessorOption[]
  isEditing: boolean
}

export const SubprocessorSelectField = ({ options, isEditing }: SubprocessorSelectFieldProps) => {
  const {
    control,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext()

  const [open, setOpen] = useState(false)
  const selectedValue = watch('subprocessorID')

  const selectedOption = useMemo(() => options.find((opt) => opt.value === selectedValue), [options, selectedValue])

  return (
    <FormField
      control={control}
      name="subprocessorID"
      render={() => (
        <FormItem>
          <FormLabel>Subprocessor</FormLabel>
          <FormControl>
            {isEditing ? (
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <div className="flex text-sm h-10 px-3 justify-between border bg-input rounded-md items-center cursor-pointer w-full">
                    <div className="flex items-center gap-2 truncate">
                      {selectedOption?.logo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={selectedOption.logo} alt="" className="h-5 w-5 rounded object-contain shrink-0" />
                      )}
                      <span className="truncate">{selectedOption?.label ?? 'Select subprocessor'}</span>
                    </div>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="p-0 border w-(--radix-popover-trigger-width) min-w-(--radix-popover-trigger-width)" align="start">
                  <Command shouldFilter>
                    <CommandInput placeholder="Search subprocessors..." />
                    <CommandList>
                      <CommandEmpty>No subprocessor found.</CommandEmpty>
                      <CommandGroup>
                        {options.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.label}
                            onSelect={() => {
                              setValue('subprocessorID', option.value)
                              setOpen(false)
                            }}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Check className={cn('h-4 w-4', selectedValue === option.value ? 'opacity-100' : 'opacity-0')} />
                            {option.logo && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={option.logo} alt="" className="h-5 w-5 rounded object-contain shrink-0" />
                            )}
                            <span className="truncate">{option.label}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                {selectedOption?.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedOption.logo} alt="" className="h-5 w-5 rounded object-contain shrink-0" />
                )}
                <span>{selectedOption?.label ?? '—'}</span>
              </div>
            )}
          </FormControl>
          {errors.subprocessorID && <p className="text-red-500 text-sm mt-1">{String(errors.subprocessorID.message)}</p>}
        </FormItem>
      )}
    />
  )
}

'use client'

import { useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { ChevronDown, Check } from 'lucide-react'
import { FormField, FormItem, FormControl, FormLabel } from '@repo/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { cn } from '@repo/ui/lib/utils'
import { useGetSubprocessors } from '@/lib/graphql-hooks/subprocessors'
import { useDebounce } from '@uidotdev/usehooks'
import { CreateSubprocessorMutation } from '@repo/codegen/src/schema'

interface SubprocessorSelectFieldProps {
  isEditing: boolean
  createdSubprocessor?: CreateSubprocessorMutation['createSubprocessor']['subprocessor'] | null
  selectedSubprocessor?: {
    id?: string | null
    name?: string | null
    logoFile?: { presignedURL?: string | null } | null
    logoRemoteURL?: string | null
  } | null
}

export const SubprocessorSelectField = ({ isEditing, createdSubprocessor, selectedSubprocessor }: SubprocessorSelectFieldProps) => {
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState('')

  const debouncedKeyword = useDebounce(keyword, 300)

  const { subprocessors } = useGetSubprocessors({
    where: {
      hasTrustCenterSubprocessors: false,
      nameContainsFold: debouncedKeyword,
    },
  })

  const subprocessorOptions = useMemo(
    () =>
      subprocessors?.map((sp) => ({
        label: sp?.name ?? '',
        value: sp?.id ?? '',
        logo: sp?.logoFile?.presignedURL || sp?.logoRemoteURL,
      })) ?? [],
    [subprocessors],
  )

  const {
    control,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext()

  const selectedValue = watch('subprocessorID')

  const selectedOption = useMemo(() => {
    if (createdSubprocessor && selectedValue === createdSubprocessor.id) {
      return {
        label: createdSubprocessor.name,
        value: createdSubprocessor.id,
        logo: createdSubprocessor.logoFile?.presignedURL || createdSubprocessor.logoRemoteURL,
      }
    }

    if (selectedSubprocessor && selectedValue === selectedSubprocessor.id) {
      return {
        label: selectedSubprocessor.name ?? '',
        value: selectedSubprocessor.id ?? '',
        logo: selectedSubprocessor.logoFile?.presignedURL || selectedSubprocessor.logoRemoteURL,
      }
    }

    return subprocessorOptions.find((opt) => opt.value === selectedValue)
  }, [subprocessorOptions, selectedValue, createdSubprocessor, selectedSubprocessor])

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
                        <img src={selectedOption.logo} alt="" className="h-5 w-5 rounded-md object-contain shrink-0" />
                      )}
                      <span className="truncate">{selectedOption?.label ?? 'Select subprocessor'}</span>
                    </div>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </div>
                </PopoverTrigger>

                <PopoverContent className="p-0 border w-(--radix-popover-trigger-width) min-w-(--radix-popover-trigger-width)" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput placeholder="Search subprocessors..." value={keyword} onValueChange={setKeyword} />

                    <CommandList>
                      <CommandEmpty>No subprocessor found.</CommandEmpty>

                      <CommandGroup>
                        {subprocessorOptions.map((option) => (
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
                              <img src={option.logo} alt="" className="h-5 w-5 rounded-md object-contain shrink-0" />
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

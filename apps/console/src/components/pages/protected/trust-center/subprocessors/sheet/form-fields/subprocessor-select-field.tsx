'use client'

import { useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { ChevronDown, Check } from 'lucide-react'
import { FormField, FormItem, FormControl, FormLabel } from '@repo/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { cn } from '@repo/ui/lib/utils'
import { useGetSubprocessors } from '@/lib/graphql-hooks/subprocessor'
import { useAsyncCommandSearch } from '@/hooks/useAsyncCommandSearch'
import { type CreateSubprocessorMutation } from '@repo/codegen/src/schema'
import { toBase64DataUri } from '@/lib/image-utils'

const MIN_SEARCH_LENGTH = 2

type SubprocessorOption = {
  label: string
  value: string
  logo?: string | null
}

type SubprocessorSource = {
  id?: string | null
  name?: string | null
  logoFile?: { base64?: string | null } | null
  logoRemoteURL?: string | null
}

const toOption = (source?: SubprocessorSource | null): SubprocessorOption | null =>
  source?.id
    ? {
        label: source.name ?? '',
        value: source.id,
        logo: (source.logoFile?.base64 ? toBase64DataUri(source.logoFile.base64) : null) || source.logoRemoteURL,
      }
    : null

interface SubprocessorSelectFieldProps {
  isEditing: boolean
  createdSubprocessor?: CreateSubprocessorMutation['createSubprocessor']['subprocessor'] | null
}

export const SubprocessorSelectField = ({ isEditing, createdSubprocessor }: SubprocessorSelectFieldProps) => {
  const [open, setOpen] = useState(false)
  const [pickedOption, setPickedOption] = useState<SubprocessorOption | null>(null)

  const { searchText, setSearchText, debouncedTerm, hasMinLength, canQuery, getIsSearching } = useAsyncCommandSearch({ minLength: MIN_SEARCH_LENGTH })

  const { subprocessors, isFetching } = useGetSubprocessors({
    where: {
      hasTrustCenterSubprocessors: false,
      nameContainsFold: debouncedTerm,
    },
    pagination: {
      page: 1,
      pageSize: 10,
      query: { first: 10 },
    },
    enabled: canQuery,
  })

  const isSearching = getIsSearching(isFetching)

  const subprocessorOptions = useMemo(() => subprocessors?.map(toOption).filter((option): option is SubprocessorOption => option !== null) ?? [], [subprocessors])

  const visibleOptions = hasMinLength && !isSearching ? subprocessorOptions : []

  const {
    control,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext()

  const selectedValue = watch('subprocessorID')

  const selectedOption = useMemo(() => {
    const created = toOption(createdSubprocessor)
    if (created && selectedValue === created.value) {
      return created
    }

    if (pickedOption && selectedValue === pickedOption.value) {
      return pickedOption
    }

    return subprocessorOptions.find((opt) => opt.value === selectedValue)
  }, [subprocessorOptions, selectedValue, createdSubprocessor, pickedOption])

  return (
    <FormField
      control={control}
      name="subprocessorID"
      render={() => (
        <FormItem>
          <FormLabel>Subprocessor</FormLabel>

          <FormControl>
            {isEditing ? (
              <Popover modal open={open} onOpenChange={setOpen}>
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

                <PopoverContent className="p-0 border w-(--radix-popover-trigger-width) min-w-(--radix-popover-trigger-width) flex flex-col" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput placeholder="Search subprocessors..." value={searchText} onValueChange={setSearchText} searching={isSearching} />

                    <CommandList>
                      <CommandEmpty>{isSearching ? 'Searching...' : hasMinLength ? 'No subprocessor found.' : `Type at least ${MIN_SEARCH_LENGTH} characters to search.`}</CommandEmpty>

                      <CommandGroup>
                        {visibleOptions.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.value}
                            onSelect={() => {
                              setPickedOption(option)
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
                  <img src={selectedOption.logo} alt="" className="h-5 w-5 rounded-md object-contain shrink-0" />
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

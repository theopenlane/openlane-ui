'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { Check, User } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useUserSelect } from '@/lib/graphql-hooks/member'
import { cn } from '@repo/ui/lib/utils'
import { ResponsibilityField } from '@/components/shared/crud-base/form-fields/responsibility-field'
import { type EditPlatformFormData } from '../../hooks/use-form-schema'

const PlatformOwnerSelect: React.FC = () => {
  const form = useFormContext<EditPlatformFormData>()
  const [open, setOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const { data: session } = useSession()

  const { userOptions, isLoading } = useUserSelect({})

  const watchedId = form.watch('platformOwnerID')

  const selectedUser = useMemo(() => {
    return userOptions.find((u) => u.value === watchedId)
  }, [watchedId, userOptions])

  const filteredUserOptions = useMemo(() => {
    if (!searchText.trim()) return userOptions
    return userOptions.filter((u) => u.label.toLowerCase().includes(searchText.toLowerCase()))
  }, [userOptions, searchText])

  // Default to current user on mount
  useEffect(() => {
    if (session?.user?.id && !watchedId) {
      form.setValue('platformOwnerID', session.user.id)
    }
  }, [session?.user?.id, watchedId, form])

  return (
    <FormField
      control={form.control}
      name="platformOwnerID"
      render={() => (
        <FormItem>
          <FormLabel>Platform Owner</FormLabel>
          <FormControl>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <div className="flex h-10 w-full cursor-pointer items-center rounded-md border bg-input px-3 py-2 text-sm">
                  {selectedUser ? (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedUser.label}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Select platform owner...</span>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) min-w-(--radix-popover-trigger-width) border bg-input! p-0" side="bottom" align="start" sideOffset={4}>
                <Command shouldFilter={false}>
                  <CommandInput placeholder="Search users..." value={searchText} onValueChange={setSearchText} />
                  <CommandList>
                    <CommandEmpty>{isLoading ? 'Loading...' : 'No users found.'}</CommandEmpty>
                    {filteredUserOptions.length > 0 && (
                      <CommandGroup>
                        {filteredUserOptions.map((user) => {
                          const isSelected = watchedId === user.value
                          return (
                            <CommandItem
                              key={user.value}
                              value={user.value}
                              onSelect={() => {
                                form.setValue('platformOwnerID', user.value)
                                setOpen(false)
                              }}
                            >
                              <div className={cn('mr-2 flex h-4 w-4 items-center justify-center rounded-sm border', isSelected ? 'border-primary bg-primary text-primary-foreground' : 'opacity-50')}>
                                {isSelected && <Check className="h-3 w-3" />}
                              </div>
                              <User className="mr-2 h-4 w-4 text-muted-foreground" />
                              <span>{user.label}</span>
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </FormControl>
        </FormItem>
      )}
    />
  )
}

const StepOwnership: React.FC = () => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">All fields on this step are optional. Click Next to skip.</p>

      <PlatformOwnerSelect />

      <ResponsibilityField
        name="businessOwner"
        fieldBaseName="businessOwner"
        label="Business Owner"
        tooltipContent="The business owner responsible for this platform"
        isEditing={true}
        isEditAllowed={true}
        isCreate={true}
        internalEditing={null}
        setInternalEditing={() => {}}
      />

      <ResponsibilityField
        name="technicalOwner"
        fieldBaseName="technicalOwner"
        label="Technical Owner"
        tooltipContent="The technical owner responsible for this platform"
        isEditing={true}
        isEditAllowed={true}
        isCreate={true}
        internalEditing={null}
        setInternalEditing={() => {}}
      />
    </div>
  )
}

export default StepOwnership

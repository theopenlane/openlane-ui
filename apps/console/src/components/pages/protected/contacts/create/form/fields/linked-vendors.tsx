'use client'

import React, { useMemo, useState } from 'react'
import { Building2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { type ContactQuery, type UpdateContactInput } from '@repo/codegen/src/schema'
import { useUpdateContact } from '@/lib/graphql-hooks/contact'
import { useVendorsWithFilter, vendorDisplayName, vendorSearchWhere } from '@/lib/graphql-hooks/entity'
import { useNotification } from '@/hooks/useNotification'
import { useAsyncCommandSearch } from '@/hooks/useAsyncCommandSearch'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

interface LinkedVendorsProps {
  data: ContactQuery['contact'] | undefined
  isEditAllowed: boolean
}

const LinkedVendors: React.FC<LinkedVendorsProps> = ({ data, isEditAllowed }) => {
  const contactId = data?.id
  const linkedVendors = useMemo(() => (data?.entities?.edges ?? []).map((edge) => edge?.node).filter((node): node is NonNullable<typeof node> => !!node), [data])
  const linkedIds = useMemo(() => new Set(linkedVendors.map((v) => v.id)), [linkedVendors])

  const [open, setOpen] = useState(false)
  const { searchText, setSearchText, debouncedTerm, getIsSearching } = useAsyncCommandSearch()

  const { mutateAsync: updateContact, isPending } = useUpdateContact()
  const { successNotification, errorNotification } = useNotification()

  const { vendorNodes, isFetching } = useVendorsWithFilter({
    where: vendorSearchWhere(debouncedTerm),
    enabled: open,
  })
  const isSearching = getIsSearching(isFetching)
  const availableVendors = isSearching ? [] : vendorNodes.filter((v) => !linkedIds.has(v.id))

  const mutateLink = async (input: UpdateContactInput, successTitle: string, successDescription: string, onSuccess?: () => void) => {
    if (!contactId) return
    try {
      await updateContact({ updateContactId: contactId, input })
      successNotification({ title: successTitle, description: successDescription })
      onSuccess?.()
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  const linkVendor = (vendorId: string) =>
    mutateLink({ addEntityIDs: [vendorId] }, 'Vendor linked', 'The vendor has been linked to this contact.', () => {
      setOpen(false)
      setSearchText('')
    })

  const unlinkVendor = (vendorId: string) => mutateLink({ removeEntityIDs: [vendorId] }, 'Vendor unlinked', 'The vendor has been unlinked from this contact.')

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 min-h-8">
        <span className="font-medium text-sm">Linked vendors</span>
        {isEditAllowed && contactId && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="secondary" size="sm" icon={<Plus size={16} strokeWidth={2} />} iconPosition="left">
                Link Vendor
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-0">
              <Command shouldFilter={false}>
                <CommandInput placeholder="Search vendors..." value={searchText} onValueChange={setSearchText} searching={isSearching} />
                <CommandList>
                  <CommandEmpty>{isSearching ? 'Searching...' : 'No vendors found.'}</CommandEmpty>
                  {availableVendors.length > 0 && (
                    <CommandGroup>
                      {availableVendors.map((v) => (
                        <CommandItem key={v.id} value={v.id} onSelect={() => linkVendor(v.id)} disabled={isPending}>
                          <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                          {vendorDisplayName(v)}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {linkedVendors.length > 0 ? (
        <div className="space-y-2">
          {linkedVendors.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2 text-sm">
              <span className="flex items-center gap-2">
                <Building2 size={14} className="text-muted-foreground" />
                {vendorDisplayName(v)}
              </span>
              {isEditAllowed && (
                <Button
                  type="button"
                  variant="transparent"
                  size="icon-xs"
                  aria-label={`Unlink ${vendorDisplayName(v)}`}
                  onClick={() => unlinkVendor(v.id)}
                  disabled={isPending}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  icon={<Trash2 size={14} />}
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm italic text-muted-foreground">No vendors linked</p>
      )}
    </div>
  )
}

export default LinkedVendors

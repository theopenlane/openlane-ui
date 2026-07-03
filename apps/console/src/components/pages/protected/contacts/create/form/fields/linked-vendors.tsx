'use client'

import React, { useMemo, useState } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { Building2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@repo/ui/cardpanel'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { type ContactQuery } from '@repo/codegen/src/schema'
import { useUpdateContact } from '@/lib/graphql-hooks/contact'
import { useVendorsWithFilter } from '@/lib/graphql-hooks/entity'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

interface LinkedVendorsProps {
  data: ContactQuery['contact'] | undefined
  isEditAllowed: boolean
}

/**
 * Lists the vendors a contact is linked to and lets the user add/remove links.
 * Add/remove go through UpdateContact (addEntityIDs / removeEntityIDs); the mutation
 * invalidates the ['contacts'] query, refreshing this contact's linked vendors.
 */
const LinkedVendors: React.FC<LinkedVendorsProps> = ({ data, isEditAllowed }) => {
  const contactId = data?.id
  const linkedVendors = useMemo(() => (data?.entities?.edges ?? []).map((edge) => edge?.node).filter((node): node is NonNullable<typeof node> => !!node), [data])
  const linkedIds = new Set(linkedVendors.map((v) => v.id))

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const { mutateAsync: updateContact, isPending } = useUpdateContact()
  const { successNotification, errorNotification } = useNotification()

  const { vendorNodes } = useVendorsWithFilter({
    where: debouncedSearch.trim() ? { displayNameContainsFold: debouncedSearch.trim() } : undefined,
    enabled: open,
  })
  const availableVendors = vendorNodes.filter((v) => !linkedIds.has(v.id))

  const linkVendor = async (vendorId: string) => {
    if (!contactId) return
    try {
      await updateContact({ updateContactId: contactId, input: { addEntityIDs: [vendorId] } })
      successNotification({ title: 'Vendor linked', description: 'The vendor has been linked to this contact.' })
      setOpen(false)
      setSearch('')
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  const unlinkVendor = async (vendorId: string) => {
    if (!contactId) return
    try {
      await updateContact({ updateContactId: contactId, input: { removeEntityIDs: [vendorId] } })
      successNotification({ title: 'Vendor unlinked', description: 'The vendor has been unlinked from this contact.' })
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-md p-0">Linked Vendors</CardTitle>
          <CardDescription className="p-0">Vendors this contact is associated with</CardDescription>
        </div>
        {isEditAllowed && contactId && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="secondary" size="md" icon={<Plus size={16} strokeWidth={2} />} iconPosition="left">
                Link Vendor
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-0">
              <Command shouldFilter={false}>
                <CommandInput placeholder="Search vendors..." value={search} onValueChange={setSearch} />
                <CommandList>
                  <CommandEmpty>No vendors found.</CommandEmpty>
                  {availableVendors.length > 0 && (
                    <CommandGroup>
                      {availableVendors.map((v) => (
                        <CommandItem key={v.id} value={v.id} onSelect={() => linkVendor(v.id)} disabled={isPending}>
                          <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                          {v.displayName || v.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </CardHeader>
      <CardContent>
        {linkedVendors.length > 0 ? (
          <div className="space-y-2">
            {linkedVendors.map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2 text-sm">
                <span className="flex items-center gap-2">
                  <Building2 size={14} className="text-muted-foreground" />
                  {v.displayName || v.name}
                </span>
                {isEditAllowed && (
                  <button type="button" onClick={() => unlinkVendor(v.id)} disabled={isPending} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm italic text-muted-foreground">No vendors linked</p>
        )}
      </CardContent>
    </Card>
  )
}

export default LinkedVendors

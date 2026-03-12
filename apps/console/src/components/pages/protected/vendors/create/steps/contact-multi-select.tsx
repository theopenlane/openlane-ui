'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { Badge } from '@repo/ui/badge'
import { Check, X, Users } from 'lucide-react'
import { useContacts } from '@/lib/graphql-hooks/contact'
import { cn } from '@repo/ui/lib/utils'
import type { EditVendorFormData } from '../../hooks/use-form-schema'

type ContactInfo = { id: string; fullName?: string | null; email?: string | null }

const ContactMultiSelect: React.FC = () => {
  const form = useFormContext<EditVendorFormData>()
  const [open, setOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [contactsCache, setContactsCache] = useState<Map<string, ContactInfo>>(() => new Map())

  const { contacts, isLoading } = useContacts({
    where: searchText.trim() ? { fullNameContainsFold: searchText.trim() } : undefined,
    enabled: true,
  })

  const watchedContactIDs = form.watch('contactIDs')
  const selectedIds = useMemo(() => watchedContactIDs ?? [], [watchedContactIDs])

  useEffect(() => {
    setContactsCache((prev) => {
      const next = new Map(prev)
      let changed = false
      for (const contact of contacts) {
        if (!next.has(contact.id)) {
          next.set(contact.id, contact)
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [contacts])

  const selectedContacts = useMemo(() => {
    return selectedIds.map((id) => contactsCache.get(id)).filter(Boolean) as ContactInfo[]
  }, [selectedIds, contactsCache])

  const toggleContact = (contact: ContactInfo) => {
    const current = form.getValues('contactIDs') ?? []
    if (current.includes(contact.id)) {
      form.setValue(
        'contactIDs',
        current.filter((id) => id !== contact.id),
      )
      setContactsCache((prev) => {
        const next = new Map(prev)
        next.delete(contact.id)
        return next
      })
    } else {
      setContactsCache((prev) => new Map(prev).set(contact.id, contact))
      form.setValue('contactIDs', [...current, contact.id])
    }
  }

  const removeContact = (contactId: string) => {
    const current = form.getValues('contactIDs') ?? []
    form.setValue(
      'contactIDs',
      current.filter((id) => id !== contactId),
    )
    setContactsCache((prev) => {
      const next = new Map(prev)
      next.delete(contactId)
      return next
    })
  }

  return (
    <FormField
      control={form.control}
      name="contactIDs"
      render={() => (
        <FormItem>
          <FormLabel>Contacts</FormLabel>
          <FormControl>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <div className="flex min-h-10 w-full cursor-pointer flex-wrap items-center gap-1.5 rounded-md border bg-input px-3 py-2 text-sm">
                  {selectedContacts.length > 0 ? (
                    selectedContacts.map((contact) => (
                      <Badge key={contact.id} variant="outline" className="flex items-center gap-1 pr-1">
                        <span>{contact.fullName}</span>
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeContact(contact.id)
                          }}
                        />
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">Search and select contacts...</span>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) min-w-(--radix-popover-trigger-width) border bg-input! p-0" side="bottom" align="start" sideOffset={4}>
                <Command shouldFilter={false}>
                  <CommandInput placeholder="Search contacts..." value={searchText} onValueChange={setSearchText} />
                  <CommandList>
                    <CommandEmpty>{isLoading ? 'Loading...' : 'No contacts found.'}</CommandEmpty>
                    {contacts.length > 0 && (
                      <CommandGroup>
                        {contacts.map((contact) => {
                          const isSelected = selectedIds.includes(contact.id)
                          return (
                            <CommandItem key={contact.id} value={contact.id} onSelect={() => toggleContact(contact)}>
                              <div className={cn('mr-2 flex h-4 w-4 items-center justify-center rounded-sm border', isSelected ? 'border-primary bg-primary text-primary-foreground' : 'opacity-50')}>
                                {isSelected && <Check className="h-3 w-3" />}
                              </div>
                              <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                              <div className="flex flex-col">
                                <span>{contact.fullName}</span>
                                {contact.email && <span className="text-xs text-muted-foreground">{contact.email}</span>}
                              </div>
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

export default ContactMultiSelect

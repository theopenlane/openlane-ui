'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/dialog'
import { Input } from '@repo/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { FormField, FormItem, FormLabel, FormControl, Form } from '@repo/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { CREATE_CONTACT } from '@repo/codegen/query/contact'
import { ContactUserStatus, type CreateContactMutation, type CreateContactMutationVariables } from '@repo/codegen/src/schema'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { useContacts } from '@/lib/graphql-hooks/contact'
import { useUpdateEntity } from '@/lib/graphql-hooks/entity'
import { Check, Sparkles, Users } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import useContactFormSchema, { type AddContactFormData } from './use-contact-form-schema'
import { useSuggestedContacts } from './use-suggested-contacts'

type DialogMode = 'create' | 'link'

interface AddContactDialogProps {
  vendorId: string
  onClose: () => void
  vendorName?: string
  existingContactIds?: string[]
  initialMode?: DialogMode
  preselectSuggested?: boolean
}

const STATUS_OPTIONS = enumToOptions(ContactUserStatus)

const AddContactDialog: React.FC<AddContactDialogProps> = ({ vendorId, onClose, vendorName, existingContactIds = [], initialMode = 'create', preselectSuggested = false }) => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()
  const [mode, setMode] = useState<DialogMode>(initialMode)
  const [searchText, setSearchText] = useState('')
  const debouncedSearch = useDebounce(searchText.trim(), 300)
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(() => new Set())

  const { form } = useContactFormSchema(vendorName)

  const createContactMutation = useMutation<CreateContactMutation, unknown, CreateContactMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_CONTACT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })

  const { mutateAsync: updateEntity, isPending: isLinking } = useUpdateEntity()

  const { contacts: searchResults, isLoading: isSearching } = useContacts({
    where: debouncedSearch ? { fullNameContainsFold: debouncedSearch } : undefined,
    enabled: mode === 'link',
  })

  const { suggestedContacts } = useSuggestedContacts({ vendorId, search: debouncedSearch, enabled: mode === 'link' })

  const didPreselectRef = useRef(false)
  useEffect(() => {
    if (preselectSuggested && !didPreselectRef.current && suggestedContacts.length > 0) {
      didPreselectRef.current = true
      setSelectedContactIds(new Set(suggestedContacts.map((c) => c.id)))
    }
  }, [preselectSuggested, suggestedContacts])

  const availableContacts = useMemo(() => {
    const suggestedIds = new Set(suggestedContacts.map((c) => c.id))
    return searchResults.filter((c) => !existingContactIds.includes(c.id) && !suggestedIds.has(c.id))
  }, [searchResults, suggestedContacts, existingContactIds])

  const handleSubmit = async (data: AddContactFormData) => {
    try {
      await createContactMutation.mutateAsync({
        input: {
          fullName: data.fullName,
          email: data.email || undefined,
          company: data.company || undefined,
          title: data.title || undefined,
          phoneNumber: data.phoneNumber || undefined,
          status: data.status || undefined,
          address: data.address || undefined,
          entityIDs: [vendorId],
        },
      })

      successNotification({
        title: 'Contact added',
        description: 'The contact has been successfully added.',
      })
      onClose()
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const toggleContact = (id: string) => {
    setSelectedContactIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleLinkContacts = async () => {
    if (selectedContactIds.size === 0) return

    const count = selectedContactIds.size
    try {
      await updateEntity({ updateEntityId: vendorId, input: { addContactIDs: [...selectedContactIds] } })
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      successNotification({
        title: count === 1 ? 'Contact linked' : 'Contacts linked',
        description: `${count} contact${count === 1 ? '' : 's'} linked to this vendor.`,
      })
      onClose()
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const renderContactItem = (contact: (typeof searchResults)[number], isSuggested = false) => {
    const isSelected = selectedContactIds.has(contact.id)
    return (
      <CommandItem key={contact.id} value={contact.id} onSelect={() => toggleContact(contact.id)}>
        <div className={cn('mr-2 flex h-4 w-4 items-center justify-center rounded-sm border', isSelected ? 'border-primary bg-primary text-primary-foreground' : 'opacity-50')}>
          {isSelected && <Check className="h-3 w-3" />}
        </div>
        {isSuggested ? <Sparkles className="mr-2 h-4 w-4 text-primary" /> : <Users className="mr-2 h-4 w-4 text-muted-foreground" />}
        <div className="flex flex-col">
          <span>{contact.fullName}</span>
          {contact.email && <span className="text-xs text-muted-foreground">{contact.email}</span>}
        </div>
      </CommandItem>
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-137.5">
        <DialogHeader>
          <DialogTitle>Add Contact</DialogTitle>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as DialogMode)} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="create" className="flex-1">
              Create New
            </TabsTrigger>
            <TabsTrigger value="link" className="flex-1">
              Link Existing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. John Doe" {...field} />
                        </FormControl>
                        {form.formState.errors.fullName?.message && <p className="text-sm text-red-500">{form.formState.errors.fullName.message}</p>}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="e.g. john@acme.com" {...field} />
                        </FormControl>
                        {form.formState.errors.email?.message && <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>}
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Acme Corp" {...field} />
                        </FormControl>
                        {form.formState.errors.company?.message && <p className="text-sm text-red-500">{form.formState.errors.company.message}</p>}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Chief Technology Officer" {...field} />
                        </FormControl>
                        {form.formState.errors.title?.message && <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>}
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 555-345-9876" {...field} />
                        </FormControl>
                        {form.formState.errors.phoneNumber?.message && <p className="text-sm text-red-500">{form.formState.errors.phoneNumber.message}</p>}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STATUS_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.status?.message && <p className="text-sm text-red-500">{form.formState.errors.status.message}</p>}
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 123 Main St, City, State" {...field} />
                      </FormControl>
                      {form.formState.errors.address?.message && <p className="text-sm text-red-500">{form.formState.errors.address.message}</p>}
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <CancelButton onClick={onClose} />
                  <SaveButton disabled={createContactMutation.isPending} isSaving={createContactMutation.isPending} title="Create Contact" savingTitle="Creating..." />
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="link">
            <Command shouldFilter={false} className="overflow-visible border rounded-md">
              <CommandInput placeholder="Search contacts by name..." value={searchText} onValueChange={setSearchText} />
              <CommandList className="max-h-62.5">
                <CommandEmpty>{isSearching ? 'Searching...' : 'No contacts found.'}</CommandEmpty>
                {suggestedContacts.length > 0 && <CommandGroup heading="Suggested — matching email domain">{suggestedContacts.map((contact) => renderContactItem(contact, true))}</CommandGroup>}
                {availableContacts.length > 0 && (
                  <CommandGroup heading={suggestedContacts.length > 0 ? 'All contacts' : undefined}>{availableContacts.map((contact) => renderContactItem(contact))}</CommandGroup>
                )}
              </CommandList>
            </Command>

            <DialogFooter className="mt-4">
              <CancelButton onClick={onClose} />
              <SaveButton
                disabled={selectedContactIds.size === 0 || isLinking}
                isSaving={isLinking}
                title={selectedContactIds.size > 1 ? `Link ${selectedContactIds.size} Contacts` : 'Link Contact'}
                savingTitle="Linking..."
                onClick={handleLinkContacts}
              />
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default AddContactDialog

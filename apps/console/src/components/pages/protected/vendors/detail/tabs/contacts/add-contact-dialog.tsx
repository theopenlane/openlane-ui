'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { useContacts, useUpdateContact } from '@/lib/graphql-hooks/contact'
import { Check, Users } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'

const addContactSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  company: z.string().optional(),
  title: z.string().optional(),
  phoneNumber: z.string().optional(),
  status: z.nativeEnum(ContactUserStatus).optional(),
  address: z.string().optional(),
})

type AddContactFormData = z.infer<typeof addContactSchema>

interface AddContactDialogProps {
  vendorId: string
  onClose: () => void
  vendorName?: string
  existingContactIds?: string[]
}

const STATUS_OPTIONS = [
  { value: ContactUserStatus.ACTIVE, label: 'Active' },
  { value: ContactUserStatus.INACTIVE, label: 'Inactive' },
  { value: ContactUserStatus.DEACTIVATED, label: 'Deactivated' },
  { value: ContactUserStatus.ONBOARDING, label: 'Onboarding' },
  { value: ContactUserStatus.SUSPENDED, label: 'Suspended' },
]

type DialogMode = 'create' | 'link'

const AddContactDialog: React.FC<AddContactDialogProps> = ({ vendorId, onClose, vendorName, existingContactIds = [] }) => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()
  const [mode, setMode] = useState<DialogMode>('create')
  const [searchText, setSearchText] = useState('')
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)

  const form = useForm<AddContactFormData>({
    resolver: zodResolver(addContactSchema),
    defaultValues: {
      fullName: '',
      email: '',
      company: vendorName ?? '',
      title: '',
      phoneNumber: '',
      status: ContactUserStatus.ACTIVE,
      address: '',
    },
  })

  const createContactMutation = useMutation<CreateContactMutation, unknown, CreateContactMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_CONTACT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })

  const { mutateAsync: updateContact, isPending: isLinking } = useUpdateContact()

  const { contacts: searchResults, isLoading: isSearching } = useContacts({
    where: searchText.trim() ? { fullNameContainsFold: searchText.trim() } : undefined,
    enabled: mode === 'link',
  })

  const availableContacts = searchResults.filter((c) => !existingContactIds.includes(c.id))

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

  const handleLinkContact = async () => {
    if (!selectedContactId) return

    try {
      await updateContact({ id: selectedContactId, input: { addEntityIDs: [vendorId] } })
      successNotification({
        title: 'Contact linked',
        description: 'The contact has been linked to this vendor.',
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

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px]">
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
                          <Input placeholder="e.g. Acme Corp" {...field} />
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
              <CommandList className="max-h-[250px]">
                <CommandEmpty>{isSearching ? 'Searching...' : 'No contacts found.'}</CommandEmpty>
                {availableContacts.length > 0 && (
                  <CommandGroup>
                    {availableContacts.map((contact) => {
                      const isSelected = selectedContactId === contact.id
                      return (
                        <CommandItem key={contact.id} value={contact.id} onSelect={() => setSelectedContactId(isSelected ? null : contact.id)}>
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

            <DialogFooter className="mt-4">
              <CancelButton onClick={onClose} />
              <SaveButton disabled={!selectedContactId || isLinking} isSaving={isLinking} title="Link Contact" savingTitle="Linking..." onClick={handleLinkContact} />
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default AddContactDialog

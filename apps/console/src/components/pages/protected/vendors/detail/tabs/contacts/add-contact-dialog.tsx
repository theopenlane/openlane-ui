'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/dialog'
import { Input } from '@repo/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { FormField, FormItem, FormLabel, FormControl, Form } from '@repo/ui/form'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { CREATE_CONTACT } from '@repo/codegen/query/contact'
import { ContactUserStatus, type CreateContactMutation, type CreateContactMutationVariables } from '@repo/codegen/src/schema'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

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
}

const STATUS_OPTIONS = [
  { value: ContactUserStatus.ACTIVE, label: 'Active' },
  { value: ContactUserStatus.INACTIVE, label: 'Inactive' },
  { value: ContactUserStatus.DEACTIVATED, label: 'Deactivated' },
  { value: ContactUserStatus.ONBOARDING, label: 'Onboarding' },
  { value: ContactUserStatus.SUSPENDED, label: 'Suspended' },
]

const AddContactDialog: React.FC<AddContactDialogProps> = ({ vendorId, onClose }) => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()

  const form = useForm<AddContactFormData>({
    resolver: zodResolver(addContactSchema),
    defaultValues: {
      fullName: '',
      email: '',
      company: '',
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

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Add Contact</DialogTitle>
        </DialogHeader>

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
                      <Input type="email" placeholder="e.g. Acme Corporation Inc." {...field} />
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
                    <Input placeholder="e.g. Acme Corporation Inc." {...field} />
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
      </DialogContent>
    </Dialog>
  )
}

export default AddContactDialog

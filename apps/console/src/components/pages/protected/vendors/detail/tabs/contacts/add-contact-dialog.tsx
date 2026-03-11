'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/dialog'
import { Input } from '@repo/ui/input'
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from '@repo/ui/form'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { CREATE_CONTACT } from '@repo/codegen/query/contact'
import { type CreateContactMutation, type CreateContactMutationVariables } from '@repo/codegen/src/schema'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

const addContactSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  company: z.string().optional(),
  title: z.string().optional(),
  phoneNumber: z.string().optional(),
})

type AddContactFormData = z.infer<typeof addContactSchema>

interface AddContactDialogProps {
  vendorId: string
  onClose: () => void
}

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
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Add Contact</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Full name" {...field} />
                  </FormControl>
                  <FormMessage />
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
                    <Input type="email" placeholder="email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input placeholder="Company name" {...field} />
                    </FormControl>
                    <FormMessage />
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
                      <Input placeholder="Job title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <CancelButton onClick={onClose} />
              <SaveButton disabled={createContactMutation.isPending} isSaving={createContactMutation.isPending} title="Add Contact" savingTitle="Adding..." />
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default AddContactDialog

'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Input } from '@repo/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { FormField, FormItem, FormLabel, FormControl, Form } from '@repo/ui/form'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { useNotification } from '@/hooks/useNotification'
import { useContact, useUpdateContact } from '@/lib/graphql-hooks/contact'
import { ContactUserStatus, type UpdateContactInput } from '@repo/codegen/src/schema'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { LoaderCircle } from 'lucide-react'

const contactSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  company: z.string().optional(),
  title: z.string().optional(),
  phoneNumber: z.string().optional(),
  status: z.nativeEnum(ContactUserStatus).optional(),
  address: z.string().optional(),
})

type ContactFormData = z.infer<typeof contactSchema>

const STATUS_OPTIONS = [
  { value: ContactUserStatus.ACTIVE, label: 'Active' },
  { value: ContactUserStatus.INACTIVE, label: 'Inactive' },
  { value: ContactUserStatus.DEACTIVATED, label: 'Deactivated' },
  { value: ContactUserStatus.ONBOARDING, label: 'Onboarding' },
  { value: ContactUserStatus.SUSPENDED, label: 'Suspended' },
]

interface ContactDetailSheetProps {
  contactId: string
  onClose: () => void
  canEdit: boolean
}

const ContactDetailSheet: React.FC<ContactDetailSheetProps> = ({ contactId, onClose, canEdit }) => {
  const { contact, isLoading } = useContact(contactId)
  const { mutateAsync: updateContact, isPending } = useUpdateContact()
  const { successNotification, errorNotification } = useNotification()

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
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

  useEffect(() => {
    if (contact) {
      form.reset({
        fullName: contact.fullName ?? '',
        email: contact.email ?? '',
        company: contact.company ?? '',
        title: contact.title ?? '',
        phoneNumber: contact.phoneNumber ?? '',
        status: contact.status ?? ContactUserStatus.ACTIVE,
        address: contact.address ?? '',
      })
    }
  }, [contact, form])

  const handleSubmit = async (data: ContactFormData) => {
    if (!contact) return

    const input: UpdateContactInput = {}
    if (data.fullName !== (contact.fullName ?? '')) input.fullName = data.fullName
    if (data.email !== (contact.email ?? '')) input.email = data.email || undefined
    if (data.company !== (contact.company ?? '')) input.company = data.company || undefined
    if (data.title !== (contact.title ?? '')) input.title = data.title || undefined
    if (data.phoneNumber !== (contact.phoneNumber ?? '')) input.phoneNumber = data.phoneNumber || undefined
    if (data.status !== contact.status) input.status = data.status
    if (data.address !== (contact.address ?? '')) input.address = data.address || undefined

    if (Object.keys(input).length === 0) {
      onClose()
      return
    }

    try {
      await updateContact({ id: contactId, input })
      successNotification({ title: 'Contact updated', description: 'The contact has been successfully updated.' })
      onClose()
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({ title: 'Error', description: errorMessage })
    }
  }

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex flex-col overflow-y-auto" minWidth="35vw">
        <SheetHeader>
          <SheetTitle>{contact?.fullName ?? 'Contact Details'}</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoaderCircle className="animate-spin" size={20} />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 p-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canEdit} />
                    </FormControl>
                    {form.formState.errors.fullName?.message && <p className="text-sm text-red-500">{form.formState.errors.fullName.message}</p>}
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} disabled={!canEdit} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!canEdit} />
                      </FormControl>
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
                        <Input {...field} disabled={!canEdit} />
                      </FormControl>
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
                        <Input {...field} disabled={!canEdit} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!canEdit}>
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
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canEdit} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {canEdit && (
                <div className="flex justify-end pt-4">
                  <SaveButton disabled={isPending} isSaving={isPending} title="Save Changes" savingTitle="Saving..." />
                </div>
              )}
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default ContactDetailSheet

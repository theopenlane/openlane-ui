'use client'

import React, { useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Input } from '@repo/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { FormField, FormItem, FormLabel, FormControl, Form } from '@repo/ui/form'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { useNotification } from '@/hooks/useNotification'
import { useContact, useUpdateContact } from '@/lib/graphql-hooks/contact'
import { ContactUserStatus, type UpdateContactInput } from '@repo/codegen/src/schema'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { LoaderCircle } from 'lucide-react'
import useContactFormSchema, { type AddContactFormData } from './use-contact-form-schema'

const STATUS_OPTIONS = enumToOptions(ContactUserStatus)

interface ContactDetailSheetProps {
  contactId: string
  onClose: () => void
  canEdit: boolean
}

const ContactDetailSheet: React.FC<ContactDetailSheetProps> = ({ contactId, onClose, canEdit }) => {
  const { data, isLoading } = useContact(contactId)
  const contact = data?.contact
  const { mutateAsync: updateContact, isPending } = useUpdateContact()
  const { successNotification, errorNotification } = useNotification()
  const { form } = useContactFormSchema()

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

  const handleSubmit = async (data: AddContactFormData) => {
    if (!contact) return

    const input: UpdateContactInput = {}
    const fields = ['fullName', 'email', 'company', 'title', 'phoneNumber', 'address'] as const
    for (const field of fields) {
      if (data[field] !== (contact[field] ?? '')) {
        input[field] = data[field] || undefined
      }
    }
    if (data.status !== contact.status) input.status = data.status

    if (Object.keys(input).length === 0) {
      onClose()
      return
    }

    try {
      await updateContact({ updateContactId: contactId, input })
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

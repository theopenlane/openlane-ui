'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ContactUserStatus } from '@repo/codegen/src/schema'

export const addContactSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  company: z.string().optional(),
  title: z.string().optional(),
  phoneNumber: z.string().optional(),
  status: z.nativeEnum(ContactUserStatus).optional(),
  address: z.string().optional(),
})

export type AddContactFormData = z.infer<typeof addContactSchema>

const useContactFormSchema = (vendorName?: string) => {
  return {
    form: useForm<AddContactFormData>({
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
    }),
  }
}

export default useContactFormSchema

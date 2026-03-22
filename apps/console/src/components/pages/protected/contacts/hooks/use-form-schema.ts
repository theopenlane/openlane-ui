'use client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ContactUserStatus } from '@repo/codegen/src/schema'

const formSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  company: z.string().optional(),
  title: z.string().optional(),
  address: z.string().optional(),
  phoneNumber: z.string().optional(),
  status: z.nativeEnum(ContactUserStatus).optional(),
  tags: z.array(z.string()).optional(),
})

export const bulkEditFieldSchema = z.object({
  status: z.nativeEnum(ContactUserStatus).optional(),
  company: z.string().optional(),
  title: z.string().optional(),
})

export type ContactFormData = z.infer<typeof formSchema>

const useFormSchema = () => {
  return {
    form: useForm<ContactFormData>({
      resolver: zodResolver(formSchema),
      defaultValues: {},
    }),
  }
}

export default useFormSchema

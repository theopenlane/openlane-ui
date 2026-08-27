'use client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ContactUserStatus } from '@repo/codegen/src/schema'
import { isPlausiblePhoneNumber } from '@/lib/validators'

const formSchema = z.object({
  fullName: z.string({ error: (issue) => (issue.input === undefined ? 'Full name is required' : 'Full name must be a string') }).min(1, 'Full name is required'),
  email: z.email({ error: (issue) => (issue.input ? 'Invalid Email' : 'Email is required') }),
  company: z.string().optional(),
  title: z.string().optional(),
  address: z.string().optional(),
  phoneNumber: z.string().refine(isPlausiblePhoneNumber, { error: 'Enter a valid phone number' }).optional(),
  status: z.enum(ContactUserStatus).optional(),
  tags: z.array(z.string()).optional(),
  entityIDs: z.array(z.string()).optional(),
})

export const bulkEditFieldSchema = z.object({
  status: z.enum(ContactUserStatus).optional(),
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

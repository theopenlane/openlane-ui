'use client'
import { z } from 'zod'
import { useMemo } from 'react'
import { type DefaultValues, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ContactUserStatus } from '@repo/codegen/src/schema'
import { isPlausiblePhoneNumber } from '@/lib/validators'

const isEmailAddress = (value: string) => z.email().safeParse(value).success

const buildFormSchema = (requireEmail: boolean) =>
  z.object({
    fullName: z.string({ error: 'Full name is required' }).min(1, 'Full name is required'),
    email: z
      .string()
      .optional()
      .refine((value) => !requireEmail || !!value?.trim(), { error: 'Email is required' })
      .refine((value) => !value?.trim() || isEmailAddress(value.trim()), { error: 'Invalid Email' }),
    company: z.string().optional(),
    title: z.string().optional(),
    address: z.string().optional(),
    phoneNumber: z.string().refine(isPlausiblePhoneNumber, { error: 'Enter a valid phone number' }).optional(),
    status: z.enum(ContactUserStatus).optional(),
    tags: z.array(z.string()).optional(),
    entityIDs: z.array(z.string()).max(1).optional(),
  })

export const bulkEditFieldSchema = z.object({
  status: z.enum(ContactUserStatus).optional(),
  company: z.string().optional(),
  title: z.string().optional(),
})

export type ContactFormData = z.infer<ReturnType<typeof buildFormSchema>>

export const CONTACT_CREATE_DEFAULT_VALUES: DefaultValues<ContactFormData> = { status: ContactUserStatus.ACTIVE }

const useFormSchema = ({ isCreate = false }: { isCreate?: boolean } = {}) => {
  const schema = useMemo(() => buildFormSchema(isCreate), [isCreate])

  return {
    form: useForm<ContactFormData>({
      resolver: zodResolver(schema),
      defaultValues: {},
    }),
  }
}

export default useFormSchema

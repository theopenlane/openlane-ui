'use client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isValidUrl } from '@/utils/normalizeUrl'

const customerUrlField = z
  .string()
  .trim()
  .refine((url) => !url || isValidUrl(url), 'Enter a valid URL, like https://example.com')

const createCustomerLogoSchema = z.object({
  name: z.string().trim().min(1, 'Customer name is required'),
  url: customerUrlField,
})

const editCustomerLogoSchema = z.object({
  url: customerUrlField,
})

export type TCreateCustomerLogoFormValues = z.infer<typeof createCustomerLogoSchema>
export type TEditCustomerLogoFormValues = z.infer<typeof editCustomerLogoSchema>

export const useCreateCustomerLogoForm = () =>
  useForm<TCreateCustomerLogoFormValues>({
    resolver: zodResolver(createCustomerLogoSchema),
    defaultValues: { name: '', url: '' },
  })

export const useEditCustomerLogoForm = (url?: string | null) =>
  useForm<TEditCustomerLogoFormValues>({
    resolver: zodResolver(editCustomerLogoSchema),
    defaultValues: { url: url ?? '' },
  })

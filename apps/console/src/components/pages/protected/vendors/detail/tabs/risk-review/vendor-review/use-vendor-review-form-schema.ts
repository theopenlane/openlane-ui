'use client'

import { z } from 'zod'
import { type Value } from 'platejs'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { EntityVendorTier } from '@repo/codegen/src/schema'

export const vendorReviewSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.custom<Value | string>().optional(),
  tier: z.enum(EntityVendorTier).optional(),
  riskRating: z.string().optional(),
  riskScore: z
    .string()
    .optional()
    .refine((value) => !value || /^\d+$/.test(value), 'Risk score must be a whole number'),
})

export type VendorReviewFormData = z.infer<typeof vendorReviewSchema>

const useVendorReviewFormSchema = (defaultValues: VendorReviewFormData) => {
  const form = useForm<VendorReviewFormData>({
    resolver: zodResolver(vendorReviewSchema),
    defaultValues,
  })

  return { form }
}

export default useVendorReviewFormSchema

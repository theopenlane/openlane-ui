'use client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Value } from 'platejs'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.custom<Value | string>().optional(),
  tags: z.array(z.string()).optional(),
  accessModelName: z.string().optional(),
  assetDataClassificationName: z.string().optional(),
  assetSubtypeName: z.string().optional(),
  assetType: z.string().optional(),
  costCenter: z.string().optional(),
  cpe: z.string().optional(),
  criticalityName: z.string().optional(),
  encryptionStatusName: z.string().optional(),
  environmentName: z.string().optional(),
  estimatedMonthlyCost: z.union([z.string(), z.number()]).optional(),
  identifier: z.string().optional(),
  physicalLocation: z.string().optional(),
  purchaseDate: z.string().optional(),
  region: z.string().optional(),
  scopeName: z.string().optional(),
  securityTierName: z.string().optional(),
  sourceIdentifier: z.string().optional(),
  sourceType: z.string().optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
})

export type CreateAssetFormatData = z.infer<typeof formSchema>
export type EditAssetFormData = z.infer<typeof formSchema>

const useFormSchema = () => {
  return {
    form: useForm<CreateAssetFormatData>({
      resolver: zodResolver(formSchema),
      defaultValues: {},
    }),
  }
}

export default useFormSchema

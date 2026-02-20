'use client'
import { z } from 'zod'
import { useForm, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Value } from 'platejs'
import { AssetAssetType, AssetSourceType } from '@repo/codegen/src/schema'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.custom<Value | string>().optional(),
  tags: z.array(z.string()).optional(),
  accessModelName: z.string().optional(),
  assetDataClassificationName: z.string().optional(),
  assetSubtypeName: z.string().optional(),
  assetType: z.nativeEnum(AssetAssetType).optional(),
  costCenter: z.string().optional(),
  cpe: z.string().optional(),
  criticalityName: z.string().optional(),
  encryptionStatusName: z.string().optional(),
  environmentName: z.string().optional(),
  estimatedMonthlyCost: z.preprocess((val) => {
    if (val === '' || val === undefined || val === null) return undefined
    return Number(val)
  }, z.number().optional()),
  identifier: z.string().optional(),
  physicalLocation: z.string().optional(),
  purchaseDate: z.string().optional(),
  region: z.string().optional(),
  scopeName: z.string().optional().nullable(),
  securityTierName: z.string().optional(),
  sourceIdentifier: z.string().optional(),
  sourceType: z.nativeEnum(AssetSourceType).optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
})

export const bulkEditFieldSchema = z.object({
  accessModelName: z.string().optional(),
  assetDataClassificationName: z.string().optional(),
  assetSubtypeName: z.string().optional(),
  assetType: z.nativeEnum(AssetAssetType).optional(),
  costCenter: z.string().optional(),
  cpe: z.string().optional(),
  criticalityName: z.string().optional(),
  encryptionStatusName: z.string().optional(),
  environmentName: z.string().optional(),
  identifier: z.string().optional(),
  physicalLocation: z.string().optional(),
  region: z.string().optional(),
  scopeName: z.string().optional().nullable(),
  securityTierName: z.string().optional(),
  sourceIdentifier: z.string().optional(),
  sourceType: z.nativeEnum(AssetSourceType).optional(),
})

export type AssetFormData = z.infer<typeof formSchema>

const useFormSchema = () => {
  return {
    form: useForm<AssetFormData>({
      resolver: zodResolver(formSchema) as Resolver<AssetFormData>,
      defaultValues: {},
    }),
  }
}

export default useFormSchema

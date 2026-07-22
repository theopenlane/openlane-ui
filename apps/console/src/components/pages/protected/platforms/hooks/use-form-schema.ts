'use client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { type Value } from 'platejs'
import { PlatformPlatformStatus } from '@repo/codegen/src/schema'
import { responsibilityFieldSchema } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  businessPurpose: z.custom<Value | string>().optional(),
  dataFlowSummary: z.custom<Value | string>().optional(),
  trustBoundaryDescription: z.custom<Value | string>().optional(),
  status: z.nativeEnum(PlatformPlatformStatus).optional(),
  environmentName: z.string().optional().nullable(),
  scopeName: z.string().optional().nullable(),
  containsPii: z.boolean().optional(),
  platformOwner: responsibilityFieldSchema,
  businessOwner: responsibilityFieldSchema,
  technicalOwner: responsibilityFieldSchema,
  internalOwner: responsibilityFieldSchema,
  securityOwner: responsibilityFieldSchema,
  entityIDs: z.array(z.string()).optional(),
  outOfScopeVendorIDs: z.array(z.string()).optional(),
  assetIDs: z.array(z.string()).optional(),
  outOfScopeAssetIDs: z.array(z.string()).optional(),
})

export type EditPlatformFormData = z.infer<typeof formSchema>

const useFormSchema = () => {
  return {
    form: useForm<EditPlatformFormData>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        status: PlatformPlatformStatus.ACTIVE,
        scopeName: 'in-scope',
        environmentName: 'production',
        entityIDs: [],
        outOfScopeVendorIDs: [],
        assetIDs: [],
        outOfScopeAssetIDs: [],
      },
    }),
  }
}

export default useFormSchema

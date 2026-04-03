'use client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { IdentityHolderUserStatus, IdentityHolderIdentityHolderType } from '@repo/codegen/src/schema'
import { responsibilityFieldSchema } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'

const formSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  alternateEmail: z.string().email().optional().or(z.literal('')),
  title: z.string().optional(),
  department: z.string().optional(),
  team: z.string().optional(),
  location: z.string().optional(),
  phoneNumber: z.string().optional(),
  status: z.nativeEnum(IdentityHolderUserStatus).optional(),
  identityHolderType: z.nativeEnum(IdentityHolderIdentityHolderType).optional(),
  isActive: z.boolean().optional(),
  isOpenlaneUser: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  externalUserID: z.string().optional(),
  externalReferenceID: z.string().optional(),
  environmentName: z.string().optional(),
  scopeName: z.string().optional().nullable(),
  internalOwner: responsibilityFieldSchema,
  tags: z.array(z.string()).optional(),
  assetIDs: z.array(z.string()).optional(),
  controlIDs: z.array(z.string()).optional(),
  subcontrolIDs: z.array(z.string()).optional(),
  entityIDs: z.array(z.string()).optional(),
  campaignIDs: z.array(z.string()).optional(),
  internalPolicyIDs: z.array(z.string()).optional(),
  taskIDs: z.array(z.string()).optional(),
})

export const bulkEditFieldSchema = z.object({
  status: z.nativeEnum(IdentityHolderUserStatus).optional(),
  identityHolderType: z.nativeEnum(IdentityHolderIdentityHolderType).optional(),
  internalOwner: responsibilityFieldSchema,
  isActive: z.boolean().optional(),
  isOpenlaneUser: z.boolean().optional(),
  environmentName: z.string().optional(),
  scopeName: z.string().optional(),
})

export type EditPersonnelFormData = z.infer<typeof formSchema>

const useFormSchema = () => {
  return {
    form: useForm<EditPersonnelFormData>({
      resolver: zodResolver(formSchema),
      defaultValues: {},
    }),
  }
}

export default useFormSchema

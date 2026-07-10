'use client'
import { useMemo } from 'react'
import { z, type infer as zInfer } from 'zod'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { type EditTokenData } from '../personal-access-token-crud-slideout'

type tokenFormProps = {
  isApiKeyPage: boolean
  isEditMode: boolean
  editToken?: EditTokenData
}

const baseFormSchema = z.object({
  name: z.string().min(1, { message: 'Token name is required' }).min(3, { message: 'Token name must be at least 3 characters' }),
  description: z.string().optional(),
  organizationIDs: z.array(z.string()).optional(),
  expiryDate: z.date().optional(),
  noExpire: z.boolean().optional(),
  scopes: z.array(z.string()).optional(),
})

export type TokenFormData = zInfer<typeof baseFormSchema>

const useFormSchema = ({ ...props }: tokenFormProps) => {
  const formSchema = baseFormSchema
    .refine(
      (data) => {
        if (!props.isApiKeyPage && (!data.organizationIDs || data.organizationIDs.length === 0)) {
          return false
        }
        return true
      },
      { message: 'At least one organization must be selected', path: ['organizationIDs'] },
    )
    .refine((data) => data.expiryDate || data.noExpire, {
      message: 'Please specify an expiry date or select the Never expires toggle',
      path: ['expiryDate'],
    })

  const initialOrgIds = props.editToken?.authorizedOrganizations?.map((o: { id: string; name: string }) => o.id) ?? []

  const expiresAt = props.editToken?.expiresAt
  const expiryDate = useMemo(() => (expiresAt ? new Date(expiresAt) : undefined), [expiresAt])

  return {
    initialOrgIds,
    form: useForm<TokenFormData>({
      resolver: zodResolver(formSchema) as Resolver<TokenFormData>,
      defaultValues: {
        name: props.editToken?.name ?? '',
        description: props.editToken?.description ?? '',
        expiryDate,
        organizationIDs: initialOrgIds,
        noExpire: props.isEditMode ? !props.editToken?.expiresAt : false,
        scopes: props.editToken?.scopes ?? [],
      },
    }),
  }
}

export default useFormSchema

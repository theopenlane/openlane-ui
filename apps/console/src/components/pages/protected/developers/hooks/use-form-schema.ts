'use client'
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

export const tokenFormValuesFrom = ({ isEditMode, editToken }: Pick<tokenFormProps, 'isEditMode' | 'editToken'>): TokenFormData => ({
  name: editToken?.name ?? '',
  description: editToken?.description ?? '',
  expiryDate: editToken?.expiresAt ? new Date(editToken.expiresAt) : undefined,
  organizationIDs: editToken?.authorizedOrganizations?.map((organization) => organization.id) ?? [],
  noExpire: isEditMode ? !editToken?.expiresAt : false,
  scopes: editToken?.scopes ?? [],
})

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

  return {
    form: useForm<TokenFormData>({
      resolver: zodResolver(formSchema) as Resolver<TokenFormData>,
      defaultValues: tokenFormValuesFrom(props),
    }),
  }
}

export default useFormSchema

'use client'
import { z } from 'zod'
import { useForm, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const urlField = z.string().url('Please enter a valid URL').optional().or(z.literal(''))

const formSchema = z.object({
  title: z.string().optional(),
  summary: z.string().optional(),
  explanation: z.string().optional(),
  instructions: z.string().optional(),
  intent: z.string().optional(),
  state: z.string().optional(),
  source: z.string().optional(),
  externalID: z.string().optional(),
  externalOwnerID: z.string().optional(),
  externalURI: urlField,
  ownerReference: z.string().optional(),
  ticketReference: z.string().optional(),
  pullRequestURI: urlField,
  repositoryURI: urlField,
  environmentName: z.string().optional().nullable(),
  scopeName: z.string().optional().nullable(),
})

export const bulkEditFieldSchema = z.object({
  state: z.string().optional(),
  environmentName: z.string().optional().nullable(),
  scopeName: z.string().optional().nullable(),
})

export type RemediationFormData = z.infer<typeof formSchema>

const useFormSchema = () => {
  return {
    form: useForm<RemediationFormData>({
      resolver: zodResolver(formSchema) as Resolver<RemediationFormData>,
      defaultValues: {},
    }),
  }
}

export default useFormSchema

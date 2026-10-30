'use client'
import { useMemo } from 'react'
import { z } from 'zod'
import { type Value } from 'platejs'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RemediationRemediationStatus } from '@repo/codegen/src/schema'
import { REMEDIATION_CONTEXT_TYPES } from '@/lib/graphql-hooks/remediation'
import { isPlateValueEmpty } from '@/components/shared/plate/plate-utils'
import { isValidUrl } from '@/utils/normalizeUrl'

const urlField = z
  .string()
  .trim()
  .refine((url) => !url || isValidUrl(url), 'Please enter a valid URL')
  .optional()

const richTextField = z.custom<Value | string>().optional()

const buildFormSchema = (isCreate: boolean) =>
  z
    .object({
      contextType: z.enum(REMEDIATION_CONTEXT_TYPES).optional(),
      contextId: z.string().optional(),
      title: z.string().optional(),
      status: z.enum(RemediationRemediationStatus).nullable().optional(),
      explanation: richTextField,
      instructions: richTextField,
      intent: richTextField,
      environmentName: z.string().optional().nullable(),
      scopeName: z.string().optional().nullable(),
      repositoryURI: urlField,
      pullRequestURI: urlField,
      ticketReference: z.string().trim().optional(),
      externalURI: urlField,
      fileIDs: z.array(z.string()).optional(),
      uploads: z.array(z.custom<File>()).optional(),
    })
    .superRefine((values, ctx) => {
      if (!isCreate) {
        return
      }

      if (!values.contextType) {
        ctx.addIssue({ code: 'custom', path: ['contextType'], message: 'Select an issue type' })
      }
      if (!values.contextId) {
        ctx.addIssue({ code: 'custom', path: ['contextId'], message: 'Select the object this remediation addresses' })
      }
      if (!values.title?.trim()) {
        ctx.addIssue({ code: 'custom', path: ['title'], message: 'Title is required' })
      }
      if (!values.status) {
        ctx.addIssue({ code: 'custom', path: ['status'], message: 'Status is required' })
      }
      if (isPlateValueEmpty(values.explanation)) {
        ctx.addIssue({ code: 'custom', path: ['explanation'], message: 'Explanation is required' })
      }
      if (isPlateValueEmpty(values.instructions)) {
        ctx.addIssue({ code: 'custom', path: ['instructions'], message: 'Instructions are required' })
      }
    })

export const bulkEditFieldSchema = z.object({
  status: z.enum(RemediationRemediationStatus).optional().nullable(),
  environmentName: z.string().optional().nullable(),
  scopeName: z.string().optional().nullable(),
})

export type RemediationFormData = z.infer<ReturnType<typeof buildFormSchema>>

const useFormSchema = ({ isCreate = false, defaultValues = {} }: { isCreate?: boolean; defaultValues?: RemediationFormData } = {}) => {
  const schema = useMemo(() => buildFormSchema(isCreate), [isCreate])
  return {
    form: useForm<RemediationFormData>({
      resolver: zodResolver(schema),
      defaultValues,
    }),
  }
}

export default useFormSchema

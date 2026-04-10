'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { type Resolver, useForm } from 'react-hook-form'
import { z } from 'zod'
import { SystemDetailSystemSensitivityLevel } from '@repo/codegen/src/schema'

const isValidJson = (value?: string) => {
  if (!value?.trim()) {
    return true
  }

  try {
    JSON.parse(value)
    return true
  } catch {
    return false
  }
}

const formSchema = z.object({
  systemName: z.string().min(1, 'System name is required'),
  description: z.string().optional(),
  version: z.string().optional(),
  authorizationBoundary: z.string().optional(),
  sensitivityLevel: z.nativeEnum(SystemDetailSystemSensitivityLevel).optional(),
  lastReviewed: z.union([z.string(), z.date()]).optional().nullable(),
  tags: z.array(z.string()).optional(),
  oscalMetadataJSON: z.string().optional().refine(isValidJson, 'OSCAL metadata must be valid JSON'),
  revisionHistory: z.string().optional().refine(isValidJson, 'Revision history must be valid JSON'),
  platformID: z.string().optional().nullable(),
  programID: z.string().optional().nullable(),
})

export const bulkEditFieldSchema = z.object({
  sensitivityLevel: z.nativeEnum(SystemDetailSystemSensitivityLevel).optional(),
  version: z.string().optional(),
})

export type SystemDetailFormData = z.infer<typeof formSchema>

const useFormSchema = () => {
  return {
    form: useForm<SystemDetailFormData>({
      resolver: zodResolver(formSchema) as Resolver<SystemDetailFormData>,
      defaultValues: {
        tags: [],
      },
    }),
  }
}

export default useFormSchema

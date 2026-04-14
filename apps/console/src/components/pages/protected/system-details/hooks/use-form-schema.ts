'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { type Resolver, useForm } from 'react-hook-form'
import { z } from 'zod'
import { type Value } from 'platejs'
import { SystemDetailSystemSensitivityLevel } from '@repo/codegen/src/schema'

const formSchema = z.object({
  systemName: z.string().min(1, 'System name is required'),
  description: z.custom<Value | string>().optional(),
  authorizationBoundary: z.string().optional(),
  revisionHistory: z.custom<Value | string>().optional(),
  sensitivityLevel: z.nativeEnum(SystemDetailSystemSensitivityLevel).optional(),
  lastReviewed: z.union([z.string(), z.date()]).optional().nullable(),
  tags: z.array(z.string()).optional(),
  platformID: z.string().optional().nullable(),
  programID: z.string().optional().nullable(),
})

export const bulkEditFieldSchema = z.object({
  sensitivityLevel: z.nativeEnum(SystemDetailSystemSensitivityLevel).optional(),
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

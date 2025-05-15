'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ControlObjectiveControlSource, ControlObjectiveObjectiveStatus } from '@repo/codegen/src/schema'

export enum VersionBump {
  MAJOR = 'MAJOR',
  MINOR = 'MINOR',
  PATCH = 'PATCH',
  DRAFT = 'DRAFT',
}

export const controlObjectiveSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  desiredOutcome: z.any().optional(),
  status: z.nativeEnum(ControlObjectiveObjectiveStatus),
  source: z.nativeEnum(ControlObjectiveControlSource),
  controlObjectiveType: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  controlIDs: z.array(z.string()).optional(),
  subcontrolIDs: z.array(z.string()).optional(),
  RevisionBump: z.enum(['MAJOR', 'MINOR', 'PATCH', 'DRAFT']).optional(),
})

export type TFormData = z.infer<typeof controlObjectiveSchema> & { id?: string; revision?: string }

const useFormSchema = () => {
  return {
    form: useForm<TFormData>({
      resolver: zodResolver(controlObjectiveSchema),
      defaultValues: {
        status: ControlObjectiveObjectiveStatus.DRAFT,
        source: ControlObjectiveControlSource.USER_DEFINED,
      },
    }),
  }
}

export default useFormSchema

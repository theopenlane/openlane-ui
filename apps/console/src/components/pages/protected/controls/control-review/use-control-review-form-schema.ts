'use client'

import { z } from 'zod'
import { type Value } from 'platejs'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FindingSecurityLevel } from '@repo/codegen/src/schema'

export const controlReviewSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  testApplied: z.string().optional(),
  auditorNotes: z.custom<Value | string>().optional(),
  externalID: z.string().optional(),
  linkedControlIDs: z.array(z.string()),
  linkedSubcontrolIDs: z.array(z.string()),
  findingTitle: z.string().optional(),
  findingSeverity: z.nativeEnum(FindingSecurityLevel).optional(),
  findingDescription: z.string().optional(),
})

export type ControlReviewFormData = z.infer<typeof controlReviewSchema>

export const CONTROL_REVIEW_DEFAULT_VALUES: ControlReviewFormData = {
  title: '',
  linkedControlIDs: [],
  linkedSubcontrolIDs: [],
}

const useControlReviewFormSchema = () => {
  const form = useForm<ControlReviewFormData>({
    resolver: zodResolver(controlReviewSchema),
    defaultValues: CONTROL_REVIEW_DEFAULT_VALUES,
  })

  return { form }
}

export default useControlReviewFormSchema

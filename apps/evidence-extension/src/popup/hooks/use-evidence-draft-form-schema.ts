import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const evidenceDraftSchema = z.object({
  name: z.string().trim().min(1, 'Evidence name is required'),
  description: z.string().optional(),
  controls: z.array(
    z.object({
      id: z.string(),
      refCode: z.string(),
      referenceFramework: z.string().nullish(),
    }),
  ),
})

export type TEvidenceDraft = z.infer<typeof evidenceDraftSchema>

export const useEvidenceDraftForm = (defaultValues: TEvidenceDraft) =>
  useForm<TEvidenceDraft>({
    resolver: zodResolver(evidenceDraftSchema),
    defaultValues,
  })

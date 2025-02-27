import { z } from 'zod'

export const EditPolicySchema = z.object({
  name: z.string().min(3, { message: 'Policy name must be more than 3 characters' }),
  description: z.string().optional(),
  background: z.string().optional(),
  purposeAndScope: z.string().optional(),
})

export type EditPolicyFormData = z.infer<typeof EditPolicySchema>

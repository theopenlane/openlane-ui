import { z } from 'zod'

export const EditPolicySchema = z.object({
  name: z.string().min(3, { message: 'Policy name must be more than 3 characters' }),
  policyType: z.string().optional(),
  tags: z.array(z.string()).optional(),
  details: z.string().optional(),
})

export type EditPolicyFormData = z.infer<typeof EditPolicySchema>

import { z } from 'zod'

export const EditProcedureSchema = z.object({
  name: z.string().min(3, { message: 'Procedure name must be more than 3 characters' }),
  description: z.string().optional(),
  background: z.string().optional(),
  purposeAndScope: z.string().optional(),
  procedureType: z.string().optional(),
  tags: z.array(z.string()).optional(),
  details: z.object({
    content: z.array(z.any()).optional(),
  }),
})

export type EditProcedureFormData = z.infer<typeof EditProcedureSchema>

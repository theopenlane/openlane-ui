import { z } from 'zod'

export const EditProcedureSchema = z.object({
  name: z.string().min(3, { message: 'Procedure name must be more than 3 characters' }),
  procedureType: z.string().optional(),
  tags: z.array(z.string()).optional(),
  details: z.string().optional(),
})

export type EditProcedureFormData = z.infer<typeof EditProcedureSchema>

import { z } from 'zod'
import { ControlControlStatus } from '@repo/codegen/src/schema'

export const controlFormSchema = z.object({
  refCode: z.string().min(1, 'Name is required'),
  description: z.any(),
  controlOwnerID: z.string().optional(),
  delegateID: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  status: z.nativeEnum(ControlControlStatus).optional(),
  mappedCategories: z.array(z.string()).optional(),
  controlID: z.string().min(1),
})

export type ControlFormData = z.infer<typeof controlFormSchema>

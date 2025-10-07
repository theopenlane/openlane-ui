import { z } from 'zod'
export const selectFrameworkSchema = z.object({
  framework: z
    .string({
      required_error: 'Framework is required',
    })
    .optional(),
  standardID: z.string().optional(),
})

import { z } from 'zod'
export const selectFrameworkSchema = z.object({
  framework: z
    .string({
      required_error: 'Framework is required',
    })
    .min(1, { message: 'Framework is required' }),
  standardID: z.string().optional(),
})

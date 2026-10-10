import { z } from 'zod'

export const subprocessorListingSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  countries: z.array(z.string()).min(1, 'Select at least one country'),
})

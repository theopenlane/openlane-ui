import { z } from 'zod'

const MAX_LABEL_LENGTH = 300

export const toCandidateLabel = (value?: string | null): string => (value ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_LABEL_LENGTH)

export const MAX_SUGGESTION_CANDIDATES = 1000
export const MAX_SUGGESTION_DETAILS_LENGTH = 8000
export const MAX_SUGGESTED_CONTROLS = 5

const labelSchema = z.string().max(MAX_LABEL_LENGTH).transform(toCandidateLabel)

export const controlSuggestionsRequestSchema = z.object({
  details: z.string().trim().min(1).max(MAX_SUGGESTION_DETAILS_LENGTH),
  candidates: z
    .array(
      z.object({
        refCode: labelSchema,
        title: labelSchema,
        framework: labelSchema,
      }),
    )
    .min(1)
    .max(MAX_SUGGESTION_CANDIDATES),
})

export const controlSuggestionsResponseSchema = z.object({ matches: z.array(z.number().int().nonnegative()) })

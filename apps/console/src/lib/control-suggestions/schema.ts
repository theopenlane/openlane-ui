import { z } from 'zod'
import { htmlToInlineText } from '@/lib/html/html-to-text'

const MAX_LABEL_LENGTH = 300
const MAX_DESCRIPTION_LENGTH = 200

const toInlineText = (value: string | null | undefined, maxLength: number): string => htmlToInlineText(value ?? '').slice(0, maxLength)

export const toCandidateLabel = (value?: string | null): string => toInlineText(value, MAX_LABEL_LENGTH)

export const toCandidateDescription = (value?: string | null): string => toInlineText(value, MAX_DESCRIPTION_LENGTH)

export const MAX_SUGGESTION_CANDIDATES = 1000
export const MAX_SUGGESTION_DETAILS_LENGTH = 8000
export const MAX_SUGGESTED_CONTROLS = 5

const labelSchema = z.string().max(MAX_LABEL_LENGTH).transform(toCandidateLabel)
const descriptionSchema = z.string().max(MAX_DESCRIPTION_LENGTH).transform(toCandidateDescription)

export const controlSuggestionsRequestSchema = z.object({
  details: z.string().trim().min(1).max(MAX_SUGGESTION_DETAILS_LENGTH),
  candidates: z
    .array(
      z.object({
        refCode: labelSchema,
        title: labelSchema,
        framework: labelSchema,
        description: descriptionSchema,
      }),
    )
    .min(1)
    .max(MAX_SUGGESTION_CANDIDATES),
})

export type TControlSuggestionCandidate = z.input<typeof controlSuggestionsRequestSchema>['candidates'][number]

export const controlSuggestionsResponseSchema = z.object({ matches: z.array(z.number().int().nonnegative()) })

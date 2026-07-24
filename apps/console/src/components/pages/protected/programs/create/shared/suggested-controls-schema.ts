import { z } from 'zod'
import { MappedControlMappingType } from '@repo/codegen/src/schema'

export const suggestedControlMappingSchema = z.object({
  fromRefCodes: z.array(z.string()),
  toRefCodes: z.array(z.string()),
  mappingType: z.nativeEnum(MappedControlMappingType),
  confidence: z.number().nullable().optional(),
  relation: z.string().nullable().optional(),
})

export const suggestedControlsStepSchema = z.object({
  suggestedControlIDs: z.array(z.string()).optional(),
  suggestedControlCategories: z.array(z.string()).optional(),
  suggestedControlMappings: z.array(suggestedControlMappingSchema).optional(),
  suggestedControlsInitialized: z.boolean().optional(),
})

export type SuggestedControlMappingGroup = z.infer<typeof suggestedControlMappingSchema>

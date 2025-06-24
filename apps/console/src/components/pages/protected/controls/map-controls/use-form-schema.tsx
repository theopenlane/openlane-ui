import { z } from 'zod'
import { MappedControlMappingType, MappedControlMappingSource } from '@repo/codegen/src/schema'

export const mapControlsSchema = z.object({
  fromControlIDs: z.array(z.string()).optional(),
  fromSubcontrolIDs: z.array(z.string()).optional(),
  toControlIDs: z.array(z.string()).optional(),
  toSubcontrolIDs: z.array(z.string()).optional(),
  confidence: z.number().optional(),
  mappingType: z.nativeEnum(MappedControlMappingType).default(MappedControlMappingType.PARTIAL),
  relation: z.string().optional(),
  source: z.nativeEnum(MappedControlMappingSource).default(MappedControlMappingSource.MANUAL),
})

export type MapControlsFormData = z.infer<typeof mapControlsSchema>

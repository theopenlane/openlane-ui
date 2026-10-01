import { z } from 'zod'

export const CAPTURE_PROVENANCE_METADATA_KEY = 'capture_provenance'

export const CAPTURE_SOURCE_NAME = 'Openlane Evidence Capture'

export const captureProvenanceSchema = z.object({
  schema_version: z.literal(1),
  capture_type: z.enum(['browser_screenshot', 'browser_recording']),
  captured_at: z.iso.datetime({ offset: true }),
  captured_at_source: z.enum(['server', 'client']),
  client_captured_at: z.iso.datetime({ offset: true }),
  capture_started_at: z.iso.datetime({ offset: true }).optional(),
  capture_ended_at: z.iso.datetime({ offset: true }).optional(),
  source_url: z.string(),
  source_domain: z.string(),
  page_title: z.string(),
  collector: z.string(),
  collector_email: z.string(),
  organization_id: z.string(),
  capture_source: z.string(),
  extension_version: z.string(),
  user_agent: z.string(),
  viewport: z.object({
    width: z.number().int(),
    height: z.number().int(),
    device_pixel_ratio: z.number(),
  }),
  artifact_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  artifact_mime_type: z.string(),
  artifact_size_bytes: z.number().int().nonnegative(),
})

export type TCaptureProvenance = z.infer<typeof captureProvenanceSchema>

const fileMetadataSchema = z.object({ [CAPTURE_PROVENANCE_METADATA_KEY]: captureProvenanceSchema })

export const readCaptureProvenance = (fileMetadata: unknown): TCaptureProvenance | null => {
  const parsed = fileMetadataSchema.safeParse(fileMetadata)
  return parsed.success ? parsed.data[CAPTURE_PROVENANCE_METADATA_KEY] : null
}

export const toSha256Hex = async (data: BufferSource): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

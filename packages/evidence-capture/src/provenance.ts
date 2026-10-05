import { z } from 'zod'

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

export const fileProvenanceSchema = z.object({
  claims: captureProvenanceSchema,
  serverSha256: z.string().regex(/^[a-f0-9]{64}$/),
  hashVerified: z.boolean(),
  receivedAt: z.iso.datetime({ offset: true }),
  uploadedBy: z.object({
    subjectId: z.string(),
    authenticationType: z.string(),
    impersonatorId: z.string().optional(),
    systemAdminId: z.string().optional(),
  }),
})

export type TFileProvenance = z.infer<typeof fileProvenanceSchema>

export const readFileProvenance = (provenance: unknown): TFileProvenance | null => {
  const parsed = fileProvenanceSchema.safeParse(provenance)
  return parsed.success ? parsed.data : null
}

export const toSha256Hex = async (data: BufferSource): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

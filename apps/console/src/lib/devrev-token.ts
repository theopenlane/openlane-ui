import { z } from 'zod'

export const devRevTokenResponseSchema = z.object({
  session_token: z.string(),
  organization_id: z.string(),
})

export const devRevTokenErrorSchema = z.object({ error: z.string() })

export type TDevRevTokenResponse = z.infer<typeof devRevTokenResponseSchema>

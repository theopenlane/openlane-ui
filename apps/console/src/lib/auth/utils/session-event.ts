import { z } from 'zod'

export const SESSION_EVENT_ENDPOINT = '/api/session-event'

export const sessionEventSchema = z.object({
  verdict: z.enum(['expiry-confirmed', 'false-alarm']),
  path: z.string().max(512),
  clientTime: z.number().int().nonnegative(),
  access: z.object({
    jti: z.string().max(64).nullable(),
    expiresInSec: z.number().int().nullable(),
    expired: z.boolean().nullable(),
  }),
})

export type TSessionEvent = z.infer<typeof sessionEventSchema>

export const reportSessionEvent = (event: Omit<TSessionEvent, 'path' | 'clientTime'>) => {
  const payload: TSessionEvent = { ...event, path: window.location.pathname, clientTime: Date.now() }

  void fetch(SESSION_EVENT_ENDPOINT, {
    method: 'POST',
    keepalive: true,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch((error: unknown) => {
    console.warn('[session] could not report session event', error)
  })
}

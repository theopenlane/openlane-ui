import { z } from 'zod'

export const EVIDENCE_EXTENSION_ID = 'fppomhmoaekepbikkkeofimhgknfdhdb'

export const EVIDENCE_EXTENSION_PUBLIC_KEY =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuBF7J496A9SDyXmuASboIW/LaOSkaUflw/xd3jCd/aY+q3iCvUAtTjqDK8AFi2DKppqfDXWLZH1lxqecGxtBXasjaHlEVVl12ffDPKDWRZTnMyUvhk4G8Q08p2murQbPIIP6Vce8AV/qGqb0mg16daGtRKgYbdiRf+4+BK9ZJ9vZ2ALtMJlPwMRt0NjEPhGm222TqsjwWy3uV2Cl44p3T+wpZvuAXgBM9r51SIwE58Eo5xU2KIt92c3Clz35969TqFL+/7wsBwWRAoHJXdpU3VKhKIwF3mbTGH6MH+BUuNbH6xYp9jSYSE/DDMnc7auA547YV11M/J45SYZd4qhFWwIDAQAB'

export const EVIDENCE_EXTENSION_CONNECT_PATH = '/extension/connect'

export const CONNECTED_APPS_PATH = '/developers/connected-apps'

export const EVIDENCE_EXTENSION_TOKEN_NAME = 'Openlane Evidence Capture (Chrome extension)'

export const EVIDENCE_EXTENSION_TOKEN_TTL_DAYS = 30

export const EVIDENCE_EXTENSION_TOKEN_TTL_MS = EVIDENCE_EXTENSION_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000 // 30 days

export const EVIDENCE_EXTENSION_SCOPES = ['evidence:read', 'evidence:write', 'file:read', 'file:write', 'control:read', 'custom_type_enum:read'] as const

export const CONNECT_MESSAGE_TYPE = 'openlane-evidence-capture/connect/v2'

export const connectMessageSchema = z.object({
  type: z.literal(CONNECT_MESSAGE_TYPE),
  token: z.string().min(1),
  tokenId: z.string().min(1),
  expiresAt: z.iso.datetime({ offset: true }),
  organizationId: z.string().min(1),
  organizationName: z.string(),
  collector: z.object({
    id: z.string().min(1),
    email: z.string(),
    displayName: z.string(),
    avatarRemoteURL: z.string().optional(),
  }),
})

export type TConnectMessage = z.infer<typeof connectMessageSchema>

export const connectResponseSchema = z.discriminatedUnion('ok', [z.object({ ok: z.literal(true), warning: z.string().optional() }), z.object({ ok: z.literal(false), error: z.string() })])

export type TConnectResponse = z.infer<typeof connectResponseSchema>

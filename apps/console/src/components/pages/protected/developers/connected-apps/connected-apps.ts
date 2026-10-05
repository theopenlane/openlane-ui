import { Camera, type LucideIcon } from 'lucide-react'
import { EVIDENCE_EXTENSION_CONNECT_PATH, EVIDENCE_EXTENSION_SCOPES, EVIDENCE_EXTENSION_TOKEN_NAME, EVIDENCE_EXTENSION_TOKEN_TTL_DAYS } from '@repo/evidence-capture/connect'
import { CAPTURE_SOURCE_NAME } from '@repo/evidence-capture/provenance'

export type TConnectedApp = {
  name: string
  description: string
  icon: LucideIcon
  tokenName: string
  scopes: readonly string[]
  tokenTtlDays?: number
  connectHref: string
}

export const CONNECTED_APPS: TConnectedApp[] = [
  {
    name: CAPTURE_SOURCE_NAME,
    description: 'Chrome extension that captures the visible page and uploads it as evidence, with capture provenance.',
    icon: Camera,
    tokenName: EVIDENCE_EXTENSION_TOKEN_NAME,
    scopes: EVIDENCE_EXTENSION_SCOPES,
    tokenTtlDays: EVIDENCE_EXTENSION_TOKEN_TTL_DAYS,
    connectHref: EVIDENCE_EXTENSION_CONNECT_PATH,
  },
]

export const CONNECTED_APP_TOKEN_NAMES = CONNECTED_APPS.map((app) => app.tokenName)

export const connectedAppLifetime = (app: TConnectedApp) =>
  app.tokenTtlDays ? { label: 'Short-lived', detail: `Each connection expires after ${app.tokenTtlDays} days.` } : { label: 'Long-lived', detail: 'Connections stay active until they are revoked.' }

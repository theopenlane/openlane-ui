import { connectMessageSchema, EVIDENCE_EXTENSION_TOKEN_NAME } from '@repo/evidence-capture/connect'
import { z } from 'zod'
import { revokeLegacyPersonalAccessToken } from './revoke'

const CONNECTION_STORAGE_KEY = 'connection'
const DISCONNECT_REASON_STORAGE_KEY = 'disconnectReason'

const connectionSchema = connectMessageSchema.omit({ type: true })

export type TConnection = z.infer<typeof connectionSchema>

const legacyConnectionSchema = connectionSchema.pick({ token: true, tokenId: true, organizationId: true })

export type TLegacyConnection = z.infer<typeof legacyConnectionSchema>

const retireLegacyConnection = async (stored: unknown) => {
  const legacy = legacyConnectionSchema.safeParse(stored)
  const revoked =
    legacy.success &&
    (await revokeLegacyPersonalAccessToken(legacy.data).then(
      () => true,
      () => false,
    ))
  await clearConnection(
    revoked || !legacy.success
      ? 'The extension now connects with a scoped API token. Connect the extension again.'
      : `The extension now connects with a scoped API token. Connect it again, then delete the old "${EVIDENCE_EXTENSION_TOKEN_NAME}" personal access token.`,
  )
}

export const clearConnection = async (reason?: string) => {
  if (reason) {
    await chrome.storage.session.set({ [DISCONNECT_REASON_STORAGE_KEY]: reason })
  }
  await chrome.storage.local.remove(CONNECTION_STORAGE_KEY)
}

export const readConnection = async (): Promise<TConnection | null> => {
  const stored = (await chrome.storage.local.get(CONNECTION_STORAGE_KEY))[CONNECTION_STORAGE_KEY]
  if (stored === undefined) {
    return null
  }
  const parsed = connectionSchema.safeParse(stored)
  if (!parsed.success) {
    await retireLegacyConnection(stored)
    return null
  }
  if (Date.parse(parsed.data.expiresAt) <= Date.now()) {
    await clearConnection('Your Openlane access token expired. Connect the extension again.')
    return null
  }
  return parsed.data
}

export const readDisconnectReason = async () => {
  const stored = await chrome.storage.session.get(DISCONNECT_REASON_STORAGE_KEY)
  const reason = stored[DISCONNECT_REASON_STORAGE_KEY]
  return typeof reason === 'string' ? reason : undefined
}

export const saveConnection = async (connection: TConnection) => {
  await chrome.storage.session.remove(DISCONNECT_REASON_STORAGE_KEY)
  await chrome.storage.local.set({ [CONNECTION_STORAGE_KEY]: connection })
}

export const onConnectionChanged = (listener: () => void) => {
  const handler = (changes: Record<string, chrome.storage.StorageChange>) => {
    if (CONNECTION_STORAGE_KEY in changes) {
      listener()
    }
  }
  chrome.storage.local.onChanged.addListener(handler)
  return () => chrome.storage.local.onChanged.removeListener(handler)
}

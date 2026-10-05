import { connectMessageSchema, type TConnectResponse } from '@repo/evidence-capture/connect'
import { CONSOLE_ORIGIN } from './lib/config'
import { readConnection, saveConnection, type TConnection } from './lib/connection'
import { revokeConnectionToken } from './lib/revoke'

const revokeReplacedToken = (previous: TConnection): Promise<string | undefined> =>
  revokeConnectionToken(previous).then(
    () => undefined,
    () => `The extension's previous connection to ${previous.organizationName} could not be revoked. Revoke it from Connected Apps.`,
  )

const connect = async (connection: TConnection): Promise<TConnectResponse> => {
  if (Date.parse(connection.expiresAt) <= Date.now()) {
    return { ok: false, error: 'The access token for this connection has already expired.' }
  }
  const previous = await readConnection()
  await saveConnection(connection)
  const warning = previous && previous.tokenId !== connection.tokenId ? await revokeReplacedToken(previous) : undefined
  return { ok: true, warning }
}

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse: (response: TConnectResponse) => void) => {
  if (sender.origin !== CONSOLE_ORIGIN) {
    sendResponse({ ok: false, error: `Connections are only accepted from ${CONSOLE_ORIGIN}.` })
    return false
  }

  const parsed = connectMessageSchema.safeParse(message)
  if (!parsed.success) {
    sendResponse({ ok: false, error: 'The connection request was not understood by this version of the extension.' })
    return false
  }

  const { type: _type, ...connection } = parsed.data
  connect(connection).then(sendResponse, (error: Error) => sendResponse({ ok: false, error: error.message }))
  return true
})

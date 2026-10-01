import { DELETE_PERSONAL_ACCESS_TOKEN } from '@repo/codegen/query/tokens'
import type { DeletePersonalAccessTokenMutation, DeletePersonalAccessTokenMutationVariables } from '@repo/codegen/src/schema'
import { connectMessageSchema, EVIDENCE_EXTENSION_TOKEN_NAME, type TConnectResponse } from '@repo/evidence-capture/connect'
import { ApiUnauthorizedError, graphqlRequest } from './lib/api'
import { CONSOLE_ORIGIN } from './lib/config'
import { readConnection, saveConnection, type TConnection } from './lib/connection'

const revokeReplacedToken = async (previous: TConnection): Promise<string | undefined> => {
  try {
    await graphqlRequest<DeletePersonalAccessTokenMutation, DeletePersonalAccessTokenMutationVariables>(previous, DELETE_PERSONAL_ACCESS_TOKEN, {
      deletePersonalAccessTokenId: previous.tokenId,
    })
    return undefined
  } catch (error) {
    if (error instanceof ApiUnauthorizedError) {
      return undefined
    }
    return `The extension's previous access token could not be revoked. Delete the older "${EVIDENCE_EXTENSION_TOKEN_NAME}" token from Personal Access Tokens.`
  }
}

const connect = async (connection: TConnection): Promise<TConnectResponse> => {
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

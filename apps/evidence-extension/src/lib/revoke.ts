import { DELETE_API_TOKEN, DELETE_PERSONAL_ACCESS_TOKEN } from '@repo/codegen/query/tokens'
import type { DeleteApiTokenMutation, DeleteApiTokenMutationVariables, DeletePersonalAccessTokenMutation, DeletePersonalAccessTokenMutationVariables } from '@repo/codegen/src/schema'
import { ApiUnauthorizedError, graphqlRequest } from './api'
import type { TConnection, TLegacyConnection } from './connection'

const ignoreUnauthorized = (error: Error) => {
  if (!(error instanceof ApiUnauthorizedError)) {
    throw error
  }
}

export const revokeConnectionToken = (connection: TConnection) =>
  graphqlRequest<DeleteApiTokenMutation, DeleteApiTokenMutationVariables>(connection, DELETE_API_TOKEN, { deleteAPITokenId: connection.tokenId }).then(() => undefined, ignoreUnauthorized)

export const revokeLegacyPersonalAccessToken = (connection: TLegacyConnection) =>
  graphqlRequest<DeletePersonalAccessTokenMutation, DeletePersonalAccessTokenMutationVariables>(connection, DELETE_PERSONAL_ACCESS_TOKEN, {
    deletePersonalAccessTokenId: connection.tokenId,
  }).then(() => undefined, ignoreUnauthorized)

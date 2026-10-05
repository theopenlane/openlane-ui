import { buildGraphQLRequestBody } from '@repo/dally/graphql-body'
import { API_GRAPHQL_URL, API_ORIGIN } from './config'
import type { TConnection } from './connection'

type TGraphQLResponse<TData> = {
  data?: TData | null
  errors?: { message: string }[]
}

export class ApiUnauthorizedError extends Error {
  name = 'ApiUnauthorizedError'
}

export class ApiRequestError extends Error {
  name = 'ApiRequestError'
}

const SERVER_DATE_TIMEOUT_MS = 3000 // 3s

export const fetchServerDate = async () => {
  const response = await fetch(`${API_ORIGIN}/livez`, { cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(SERVER_DATE_TIMEOUT_MS) }).catch(() => null)
  const header = response?.headers.get('date')
  const date = header ? new Date(header) : null
  return date && !Number.isNaN(date.getTime()) ? date : null
}

export const graphqlRequest = async <TData, TVariables extends object>(connection: Pick<TConnection, 'token' | 'organizationId'>, query: string, variables?: TVariables): Promise<TData> => {
  const { body, isMultipart } = buildGraphQLRequestBody(query, variables)
  const response = await fetch(API_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${connection.token}`,
      'X-Organization-ID': connection.organizationId,
      ...(isMultipart ? {} : { 'Content-Type': 'application/json' }),
    },
    body,
  })

  if (response.status === 401) {
    throw new ApiUnauthorizedError('Your Openlane connection is no longer valid. Connect the extension again.')
  }

  const payload: TGraphQLResponse<TData> | null = await response.json().catch(() => null)
  if (payload?.errors?.length) {
    throw new ApiRequestError(payload.errors.map((error) => error.message).join('; '))
  }
  if (!response.ok || !payload?.data) {
    throw new ApiRequestError(`Openlane returned HTTP ${response.status}.`)
  }

  return payload.data
}

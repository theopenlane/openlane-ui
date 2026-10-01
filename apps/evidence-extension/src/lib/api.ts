import { buildGraphQLRequestBody } from '@repo/dally/graphql-body'
import { API_GRAPHQL_URL } from './config'
import type { TConnection } from './connection'

type TGraphQLResponse<TData> = {
  data?: TData | null
  errors?: { message: string }[]
}

export type TApiResult<TData> = {
  data: TData
  serverDate: Date | null
}

export class ApiUnauthorizedError extends Error {
  name = 'ApiUnauthorizedError'
}

export class ApiRequestError extends Error {
  name = 'ApiRequestError'
}

const parseServerDate = (header: string | null) => {
  if (!header) {
    return null
  }
  const date = new Date(header)
  return Number.isNaN(date.getTime()) ? null : date
}

export const graphqlRequest = async <TData, TVariables extends object>(connection: TConnection, query: string, variables?: TVariables): Promise<TApiResult<TData>> => {
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

  return { data: payload.data, serverDate: parseServerDate(response.headers.get('date')) }
}

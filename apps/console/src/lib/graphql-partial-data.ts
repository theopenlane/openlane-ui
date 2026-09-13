import { ClientError } from 'graphql-request'
import { isRecord } from '@/utils/type-guards'

type GraphQLResult = {
  data?: unknown
  errors?: unknown
  status?: number
}

const isContainedBelowRoot =
  (data: Record<string, unknown>) =>
  (error: unknown): boolean => {
    if (!isRecord(error) || !Array.isArray(error.path)) return false
    const [root] = error.path
    return typeof root === 'string' && data[root] !== null && data[root] !== undefined
  }

const isPartialResult = <T>(data: unknown, errors: unknown[]): data is T => isRecord(data) && errors.every(isContainedBelowRoot(data))

const describeError = (error: unknown): string => {
  if (!isRecord(error)) return String(error)
  const message = typeof error.message === 'string' ? error.message : 'Unknown error'
  return Array.isArray(error.path) ? `${message} (at ${error.path.join('.')})` : message
}

const salvagePartialGraphQLResult = <T>({ data, errors, status }: GraphQLResult): T | null => {
  if (status !== undefined && (status < 200 || status > 299)) return null
  if (!Array.isArray(errors) || errors.length === 0) return null
  if (!isPartialResult<T>(data, errors)) return null

  console.warn('⚠️ [GraphQL] Rendering partial data, some fields failed to resolve:', errors.map(describeError))

  return data
}

export const withPartialData = async <T>(request: Promise<T>): Promise<T> => {
  try {
    return await request
  } catch (error) {
    if (!(error instanceof ClientError)) throw error

    const salvaged = salvagePartialGraphQLResult<T>(error.response)
    if (salvaged === null) throw error

    return salvaged
  }
}

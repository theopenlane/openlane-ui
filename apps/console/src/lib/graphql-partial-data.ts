import { ClientError } from 'graphql-request'
import { isRecord } from '@/utils/type-guards'

type GraphQLResult = {
  data?: unknown
  errors?: unknown
  status?: number
}

type TSalvageableError = (data: Record<string, unknown>) => (error: unknown) => boolean

const errorRoot = (error: unknown): string | null => {
  if (!isRecord(error) || !Array.isArray(error.path)) return null
  const [root] = error.path
  return typeof root === 'string' ? root : null
}

const isContainedBelowRoot: TSalvageableError = (data) => (error) => {
  const root = errorRoot(error)
  return root !== null && data[root] !== null && data[root] !== undefined
}

const isContainedInRoot: TSalvageableError = () => (error) => errorRoot(error) !== null

const isPartialResult = <T>(data: unknown, errors: unknown[], isSalvageable: TSalvageableError): data is T => isRecord(data) && errors.every(isSalvageable(data))

const describeError = (error: unknown): string => {
  if (!isRecord(error)) return String(error)
  const message = typeof error.message === 'string' ? error.message : 'Unknown error'
  return Array.isArray(error.path) ? `${message} (at ${error.path.join('.')})` : message
}

const salvagePartialGraphQLResult = <T>({ data, errors, status }: GraphQLResult, isSalvageable: TSalvageableError): T | null => {
  if (status !== undefined && (status < 200 || status > 299)) return null
  if (!Array.isArray(errors) || errors.length === 0) return null
  if (!isPartialResult<T>(data, errors, isSalvageable)) return null

  console.warn('⚠️ [GraphQL] Rendering partial data, some fields failed to resolve:', errors.map(describeError))

  return data
}

const withSalvage = async <T>(request: Promise<T>, isSalvageable: TSalvageableError): Promise<T> => {
  try {
    return await request
  } catch (error) {
    if (!(error instanceof ClientError)) throw error

    const salvaged = salvagePartialGraphQLResult<T>(error.response, isSalvageable)
    if (salvaged === null) throw error

    return salvaged
  }
}

export const withPartialData = <T>(request: Promise<T>): Promise<T> => withSalvage(request, isContainedBelowRoot)

export const withPerRootPartialData = <T>(request: Promise<T>): Promise<T> => withSalvage(request, isContainedInRoot)

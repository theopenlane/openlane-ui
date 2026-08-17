import { errorCodeMessages, GraphQlResponseError, invalidQueryFilterMessage, invalidRequestMessage } from '@/constants/graphQlResponseError'
import { ClientError } from 'graphql-request'

export interface GraphQLErrorExtension {
  code: GraphQlResponseError
}

export interface GraphQLError {
  message: string
  extensions: GraphQLErrorExtension
}

export interface GraphQLResponse {
  errors?: GraphQLError[]
}

export const graphQlErrorMatcher = async (response: Response, graphQlErrors: GraphQlResponseError[]): Promise<boolean> => {
  const json: GraphQLResponse = await response.json()

  if (json.errors?.length) {
    return json.errors.some((err) => {
      return err.extensions?.code && graphQlErrors.includes(err.extensions.code)
    })
  }

  return false
}

export const extractGraphQlResponseError = async (response: Response): Promise<GraphQlResponseError | null> => {
  const json = await response.json()

  if (json.errors?.length) {
    const errorCode = json.errors?.[0].extensions?.code
    if (errorCode) {
      return errorCode as GraphQlResponseError
    }
  }

  return null
}

type TGraphQlErrorInfo = {
  code?: string
  detail?: string
  reason?: string
  path: string[]
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const STRUCTURAL_PATH_SEGMENTS = new Set(['variable', 'variables', 'and', 'or', 'not'])

const toGraphQlErrorInfo = (value: unknown): TGraphQlErrorInfo | null => {
  if (!isRecord(value)) {
    return null
  }

  const extensions = isRecord(value.extensions) ? value.extensions : undefined
  const rawPath = Array.isArray(value.path) ? value.path : []

  return {
    code: typeof extensions?.code === 'string' ? extensions.code : undefined,
    detail: typeof extensions?.message === 'string' ? extensions.message : undefined,
    reason: typeof value.message === 'string' ? value.message : undefined,
    path: rawPath.filter((segment): segment is string => typeof segment === 'string' && !STRUCTURAL_PATH_SEGMENTS.has(segment)),
  }
}

const toGraphQlErrorInfos = (error: unknown): TGraphQlErrorInfo[] => {
  const raw = error instanceof ClientError ? (error.response.errors ?? []) : Array.isArray(error) ? error : []

  return raw.map(toGraphQlErrorInfo).filter((info): info is TGraphQlErrorInfo => info !== null)
}

const RETRYABLE_CLIENT_STATUSES = new Set([408, 425, 429])

const PERMANENT_ERROR_CODES = new Set<string>([
  GraphQlResponseError.NotFoundErrorCode,
  GraphQlResponseError.ValidationErrorCode,
  GraphQlResponseError.ConflictErrorCode,
  GraphQlResponseError.UnauthorizedErrorCode,
  GraphQlResponseError.AlreadyExistsErrorCode,
  GraphQlResponseError.MaxAttemptsErrorCode,
  GraphQlResponseError.BadRequestErrorCode,
  GraphQlResponseError.NoAccessToModuleErrorCode,
  GraphQlResponseError.BulkActionIncompleteErrorCode,
  GraphQlResponseError.GraphQlValidationFailedCode,
  GraphQlResponseError.GraphQlParseFailedCode,
])

const INVALID_QUERY_CODES = new Set<string>([GraphQlResponseError.GraphQlValidationFailedCode, GraphQlResponseError.GraphQlParseFailedCode])

export const isNonRetryableGraphQlError = (error: unknown): boolean => {
  if (error instanceof ClientError) {
    const { status } = error.response

    if (status >= 400 && status < 500 && !RETRYABLE_CLIENT_STATUSES.has(status)) {
      return true
    }
  }

  const infos = toGraphQlErrorInfos(error)

  return infos.length > 0 && infos.every((info) => info.code !== undefined && PERMANENT_ERROR_CODES.has(info.code))
}

const findInvalidQueryInfo = (error: unknown): TGraphQlErrorInfo | undefined => toGraphQlErrorInfos(error).find((info) => info.code !== undefined && INVALID_QUERY_CODES.has(info.code))

const asAside = (text: string | undefined): string => {
  const trimmed = text?.trim().replace(/[.\s]+$/, '') ?? ''

  return trimmed ? ` (${trimmed})` : ''
}

const asSentence = (text: string): string => {
  const trimmed = text.trim()
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1)

  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`
}

const describeInvalidQuery = (info: TGraphQlErrorInfo): string => {
  const reason = asAside(info.reason)

  return info.path.length > 0
    ? `We couldn’t run this query because “${info.path.join('.')}” is not valid${reason}. Remove or change that filter and try again, and reach out to support if it keeps failing.`
    : `We couldn’t run this query${reason}. ${invalidQueryFilterMessage}`
}

const describeErrorCode = (info: TGraphQlErrorInfo): string | undefined => {
  if (!info.code) {
    return undefined
  }

  if (INVALID_QUERY_CODES.has(info.code)) {
    return describeInvalidQuery(info)
  }

  return info.detail ? asSentence(info.detail) : errorCodeMessages[info.code]
}

export const getQueryErrorDescription = (error: unknown, fallbackDescription: string): string => {
  for (const info of toGraphQlErrorInfos(error)) {
    const message = describeErrorCode(info)

    if (message) {
      return `${fallbackDescription}. ${message}`
    }
  }

  return fallbackDescription
}

type TParseError = {
  code: string
  message: string
}

const parseError = (error: unknown): TParseError | undefined => {
  if (Array.isArray(error) && error.length > 0) {
    return {
      code: error[0].extensions ? error[0].extensions.code : '',
      message: error[0].message as string,
    }
  }

  return undefined
}

export const parseErrorMessage = (error: unknown): string => {
  const unknownMessage = 'Something went wrong. Please try again.'
  if (findInvalidQueryInfo(error)) {
    return invalidRequestMessage
  }

  if (error instanceof ClientError) {
    const message = error.response.errors?.[0]?.message
    if (message) {
      if (message.includes('cannot be in both the sso exempt domains and allowed email domains')) {
        return "You can't add an SSO exclusion for a domain that's also in your allowed domains. Remove it from one list first."
      }

      return message
    }
  }

  const parsed = parseError(error)

  if (parsed) {
    const { code, message } = parsed
    if (message === 'organization already exists') {
      return errorCodeMessages['ORG_ALREADY_EXISTS']
    }

    if (message !== '' && code === 'VALIDATION_ERROR') {
      return message
    }

    return errorCodeMessages[code] ?? message ?? unknownMessage
  }

  return unknownMessage
}

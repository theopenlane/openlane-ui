import { GraphQlResponseError } from '@/constants/graphQlResponseError'
import { isModuleAccessError } from '@/utils/graphQlErrorMatcher'
import { isRecord } from '@/utils/type-guards'

const STALE_BODY_HEADERS = ['content-length', 'content-encoding']

const parseJson = (body: string): unknown => {
  try {
    return JSON.parse(body)
  } catch {
    return null
  }
}

const stripModuleAccessErrors = (body: string): string | null => {
  if (!body.includes(GraphQlResponseError.NoAccessToModuleErrorCode)) return null

  const result = parseJson(body)
  if (!isRecord(result) || !isRecord(result.data) || !Array.isArray(result.errors)) return null

  const errors = result.errors.filter((error) => !isModuleAccessError(error))
  if (errors.length === result.errors.length) return null

  return JSON.stringify({ ...result, errors: errors.length > 0 ? errors : undefined })
}

export const withoutModuleAccessErrors = async (response: Response): Promise<Response> => {
  if (!response.ok || !response.headers.get('content-type')?.includes('json')) return response

  const body = await response.text()
  const headers = new Headers(response.headers)
  STALE_BODY_HEADERS.forEach((name) => headers.delete(name))

  return new Response(stripModuleAccessErrors(body) ?? body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

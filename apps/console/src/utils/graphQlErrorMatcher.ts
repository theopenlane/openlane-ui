import { errorCodeMessages, GraphQlResponseError } from '@/constants/graphQlResponseError'
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

type TParseError = {
  code: string
  message: string
}

const parseError = (error: unknown): TParseError | undefined => {
  if (Array.isArray(error)) {
    return {
      code: error[0].extensions ? error[0].extensions.code : '',
      message: error[0].message as string,
    }
  }

  return undefined
}

export const parseErrorMessage = (error: unknown): string => {
  const unknownMessage = 'Something went wrong. Please try again.'
  if (error instanceof ClientError) {
    const message = error.response.errors?.[0]?.message
    if (message) return message
  }

  const parsed = parseError(error)

  if (parsed) {
    const { code, message } = parsed
    if (message === 'organization already exists') {
      return errorCodeMessages['ORG_ALREADY_EXISTS']
    }

    return errorCodeMessages[code] ?? message ?? unknownMessage
  }

  return unknownMessage
}

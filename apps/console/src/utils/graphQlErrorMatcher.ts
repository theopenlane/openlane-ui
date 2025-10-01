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

export const parseErrorMessage = (error: unknown): string => {
  if (Array.isArray(error) && error[0]?.extensions?.code) {
    const code = error[0].extensions.code as string
    const message = error[0].message as string
    if (message === 'organization already exists') return errorCodeMessages['ORG_ALREADY_EXISTS']
    return errorCodeMessages[code]
  }

  if (error instanceof ClientError) {
    const message = error.response.errors?.[0]?.message
    if (message) return message
  }

  return 'Something went wrong. Please try again.'
}

export interface GraphQLErrorExtensions {
  code?: string
  module?: string
  [key: string]: unknown
}

export interface GraphQLError {
  message: string
  extensions?: GraphQLErrorExtensions
  path?: (string | number)[]
  [key: string]: unknown
}

export interface GraphQLErrorResponse {
  errors?: GraphQLError[]
  response?: {
    errors?: GraphQLError[]
  }
  graphQLErrors?: GraphQLError[]
  extensions?: GraphQLErrorExtensions
  [key: string]: unknown
}

export const isGraphQLErrorResponse = (error: unknown): error is GraphQLErrorResponse => {
  // maybe this is too bad???
  return (
    error !== null &&
    typeof error === 'object' &&
    ('errors' in error || 'graphQLErrors' in error || 'extensions' in error || ('response' in error && typeof (error as Record<string, unknown>).response === 'object'))
  )
}

export const extractGraphQLErrors = (error: GraphQLErrorResponse): GraphQLError[] => {
  if (error.response?.errors) {
    return error.response.errors
  }
  if (error.errors) {
    return error.errors
  }
  if (error.graphQLErrors) {
    return error.graphQLErrors
  }
  return []
}

export const hasErrorCode = (error: GraphQLErrorResponse | null | undefined, code: string): boolean => {
  if (!error) {
    return false
  }

  const errors = extractGraphQLErrors(error)
  return errors.some((err) => err?.extensions?.code === code) || error.extensions?.code === code
}

export const hasModuleError = (error: GraphQLErrorResponse | null | undefined): boolean => {
  return hasErrorCode(error, 'MODULE_NO_ACCESS')
}

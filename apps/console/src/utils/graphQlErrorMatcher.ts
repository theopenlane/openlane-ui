import { GraphQlResponseError } from '@/constants/graphQlResponseError'

export const graphQlErrorMatcher = async (response: Response, graphQlErrors: GraphQlResponseError[]): Promise<boolean> => {
  const json = await response.json()

  if (json.errors?.length) {
    return json.errors.some((err: any) => {
      return err.extensions.code.length && graphQlErrors.includes(err.extensions.code)
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

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

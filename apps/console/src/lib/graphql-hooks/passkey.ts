import { useMutation, useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { type DeletePasskeyMutation, type DeletePasskeyMutationVariables, type GetPasskeysQuery } from '@repo/codegen/src/schema'
import { DELETE_PASSKEY, GET_PASSKEYS } from '@repo/codegen/query/passkey'

export const useGetPasskeys = (enabled = true) => {
  const { client } = useGraphQLClient()
  return useQuery<GetPasskeysQuery, unknown>({
    enabled,
    queryKey: ['passkeys'],
    queryFn: async () => client.request(GET_PASSKEYS),
  })
}

export const useDeletePasskey = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeletePasskeyMutation, unknown, DeletePasskeyMutationVariables>({
    mutationFn: (variables) => client.request(DELETE_PASSKEY, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passkeys'] })
    },
  })
}

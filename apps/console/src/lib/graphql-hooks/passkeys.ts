import { useMutation, useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { DeletePasskeyMutation, DeletePasskeyMutationVariables, GetPasskeysQuery } from '@repo/codegen/src/schema'
import { DELETE_PASSKEY, GET_PASSKEYS } from '@repo/codegen/query/passkey'

export const useGetPasskeys = () => {
  const { client } = useGraphQLClient()
  return useQuery<GetPasskeysQuery, unknown>({
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

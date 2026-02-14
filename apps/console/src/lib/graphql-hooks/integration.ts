import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { DeleteIntegrationMutation, DeleteIntegrationMutationVariables, GetIntegrationsQuery, IntegrationWhereInput } from '@repo/codegen/src/schema'
import { useMutation, useQuery } from '@tanstack/react-query'
import { DELETE_INTEGRATION, GET_INTEGRATIONS } from '@repo/codegen/query/integration'

type UseGetIntegrationsProps = {
  where?: IntegrationWhereInput
}

export const useGetIntegrations = ({ where }: UseGetIntegrationsProps) => {
  const { client } = useGraphQLClient()

  return useQuery({
    queryKey: ['integrations', where],
    queryFn: async () => client.request<GetIntegrationsQuery>(GET_INTEGRATIONS, { where }),
  })
}

export const useDisconnectIntegration = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      return client.request<DeleteIntegrationMutation, DeleteIntegrationMutationVariables>(DELETE_INTEGRATION, { deleteIntegrationId: id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
    },
  })
}

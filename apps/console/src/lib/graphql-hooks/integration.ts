import { useMemo } from 'react'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type DeleteIntegrationMutation,
  type DeleteIntegrationMutationVariables,
  type GetIntegrationInstallersQuery,
  type GetIntegrationInstallersQueryVariables,
  type GetIntegrationsQuery,
  type IntegrationWhereInput,
} from '@repo/codegen/src/schema'
import { useMutation, useQuery } from '@tanstack/react-query'
import { DELETE_INTEGRATION, GET_INTEGRATION_INSTALLERS, GET_INTEGRATIONS } from '@repo/codegen/query/integration'
import { getNodes } from '@/lib/graphql-hooks/connection'

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

export type TIntegrationInstaller = NonNullable<NonNullable<NonNullable<GetIntegrationInstallersQuery['integrations']['edges']>[number]>['node']>

export const useIntegrationInstallers = ({ installationIds, definitionIDs, enabled }: { installationIds: string[]; definitionIDs: string[]; enabled: boolean }) => {
  const { client } = useGraphQLClient()
  const isEnabled = enabled && (installationIds.length > 0 || definitionIDs.length > 0)

  const query = useQuery({
    queryKey: ['integrations', 'installers', installationIds, definitionIDs],
    queryFn: async () =>
      client.request<GetIntegrationInstallersQuery, GetIntegrationInstallersQueryVariables>(GET_INTEGRATION_INSTALLERS, {
        where: { or: [...(installationIds.length ? [{ idIn: installationIds }] : []), ...(definitionIDs.length ? [{ definitionIDIn: definitionIDs }] : [])] },
      }),
    enabled: isEnabled,
    retry: false,
  })

  const installations = useMemo(() => getNodes(query.data?.integrations), [query.data])

  return { installations, isPending: isEnabled && query.isPending }
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

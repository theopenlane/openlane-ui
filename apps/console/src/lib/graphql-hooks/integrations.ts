import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { GetIntegrationsQuery, IntegrationWhereInput } from '@repo/codegen/src/schema'
import { useQuery } from '@tanstack/react-query'
import { GET_INTEGRATIONS } from '@repo/codegen/query/integration'

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

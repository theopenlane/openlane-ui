import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { GET_DASHBOARD_DATA } from '@repo/codegen/query/dashboard'
import { GetDashboardDataQuery, GetDashboardDataQueryVariables } from '@repo/codegen/src/schema'

export const useGetDashboardData = (where?: GetDashboardDataQueryVariables['where']) => {
  const { client } = useGraphQLClient()

  return useQuery<GetDashboardDataQuery, unknown>({
    queryKey: ['dashboardData', where],
    queryFn: async () => client.request(GET_DASHBOARD_DATA, { where }),
    enabled: where !== undefined,
  })
}

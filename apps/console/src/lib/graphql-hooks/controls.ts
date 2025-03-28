import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { GET_ALL_CONTROLS } from '@repo/codegen/query/control'

import { GetAllControlsQuery, GetAllControlsQueryVariables } from '@repo/codegen/src/schema'

export const useGetAllControls = (where?: GetAllControlsQueryVariables['where'], orderBy?: GetAllControlsQueryVariables['orderBy']) => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllControlsQuery, unknown>({
    queryKey: ['allControls', { where, orderBy }],
    queryFn: async () => client.request(GET_ALL_CONTROLS, { where, orderBy }),
    enabled: where !== undefined,
  })
}

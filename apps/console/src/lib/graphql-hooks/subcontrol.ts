import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { GET_ALL_SUBCONTROLS } from '@repo/codegen/query/subcontrol'
import { GetAllSubcontrolsQuery, GetAllSubcontrolsQueryVariables } from '@repo/codegen/src/schema'

export function useGetAllSubcontrols(where?: GetAllSubcontrolsQueryVariables['where']) {
  const { client } = useGraphQLClient()

  return useQuery<GetAllSubcontrolsQuery, unknown>({
    queryKey: ['getAllSubcontrols', where],
    queryFn: async () =>
      client.request<GetAllSubcontrolsQuery, GetAllSubcontrolsQueryVariables>(GET_ALL_SUBCONTROLS, {
        where,
      }),
  })
}

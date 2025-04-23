import { useMutation, useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { GET_ALL_SUBCONTROLS, GET_SUBCONTROL_BY_ID, UPDATE_SUBCONTROL } from '@repo/codegen/query/subcontrol'
import {
  GetAllSubcontrolsQuery,
  GetAllSubcontrolsQueryVariables,
  GetProcedureDetailsByIdQuery,
  GetSubcontrolByIdQuery,
  UpdateSubcontrolMutation,
  UpdateSubcontrolMutationVariables,
} from '@repo/codegen/src/schema'

export function useGetAllSubcontrols(where?: GetAllSubcontrolsQueryVariables['where']) {
  const { client } = useGraphQLClient()

  return useQuery<GetAllSubcontrolsQuery, unknown>({
    queryKey: ['subcontrols', where],
    queryFn: async () =>
      client.request<GetAllSubcontrolsQuery, GetAllSubcontrolsQueryVariables>(GET_ALL_SUBCONTROLS, {
        where,
      }),
  })
}

export const useGetSubcontrolById = (subcontrolId?: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetSubcontrolByIdQuery, unknown>({
    queryKey: ['subcontrols', subcontrolId],
    queryFn: async () => client.request(GET_SUBCONTROL_BY_ID, { subcontrolId }),
    enabled: !!subcontrolId,
  })
}

export const useUpdateSubcontrol = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateSubcontrolMutation, unknown, UpdateSubcontrolMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_SUBCONTROL, variables),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['controls'] }),
  })
}

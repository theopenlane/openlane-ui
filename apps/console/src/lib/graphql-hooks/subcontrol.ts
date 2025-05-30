import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { CREATE_SUBCONTROL, DELETE_SUBCONTROL, GET_ALL_SUBCONTROLS, GET_SUBCONTROL_BY_ID, UPDATE_SUBCONTROL } from '@repo/codegen/query/subcontrol'
import {
  CreateSubcontrolMutation,
  CreateSubcontrolMutationVariables,
  DeleteSubcontrolMutation,
  DeleteSubcontrolMutationVariables,
  GetAllSubcontrolsQuery,
  GetAllSubcontrolsQueryVariables,
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subcontrols'] }),
  })
}

export const useDeleteSubcontrol = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteSubcontrolMutation, unknown, DeleteSubcontrolMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_SUBCONTROL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcontrols'] })
    },
  })
}

export const useCreateSubcontrol = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateSubcontrolMutation, unknown, CreateSubcontrolMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_SUBCONTROL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcontrols'] })
    },
  })
}

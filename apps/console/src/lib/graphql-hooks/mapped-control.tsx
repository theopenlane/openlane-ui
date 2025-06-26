import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  CreateMappedControlMutation,
  CreateMappedControlMutationVariables,
  DeleteMappedControlMutation,
  DeleteMappedControlMutationVariables,
  GetMappedControlByIdQuery,
  GetMappedControlsQuery,
  GetMappedControlsQueryVariables,
  UpdateMappedControlMutation,
  UpdateMappedControlMutationVariables,
} from '@repo/codegen/src/schema'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CREATE_MAPPED_CONTROL, DELETE_MAPPED_CONTROL, GET_MAPPED_CONTROL_BY_ID, GET_MAPPED_CONTROLS, UPDATE_MAPPED_CONTROL } from '@repo/codegen/query/mapped-control'

export const useCreateMappedControl = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<CreateMappedControlMutation, unknown, CreateMappedControlMutationVariables>({
    mutationFn: (variables) => client.request(CREATE_MAPPED_CONTROL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mappedControls'] })
    },
  })
}

export const useGetMappedControls = (where?: GetMappedControlsQueryVariables['where']) => {
  const { client } = useGraphQLClient()

  return useQuery<GetMappedControlsQuery>({
    queryKey: ['mappedControls', where],
    queryFn: () => client.request(GET_MAPPED_CONTROLS, { where }),
    enabled: !!where,
  })
}

export const useGetMappedControlById = ({ mappedControlId, enabled }: { mappedControlId?: string; enabled: boolean }) => {
  const { client } = useGraphQLClient()

  return useQuery<GetMappedControlByIdQuery, unknown>({
    queryKey: ['mappedControls', mappedControlId],
    queryFn: () => client.request(GET_MAPPED_CONTROL_BY_ID, { mappedControlId }),
    enabled,
  })
}

export const useUpdateMappedControl = () => {
  const { client } = useGraphQLClient()

  return useMutation<UpdateMappedControlMutation, unknown, UpdateMappedControlMutationVariables>({
    mutationFn: (variables) => client.request(UPDATE_MAPPED_CONTROL, variables),
  })
}

export const useDeleteMappedControl = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteMappedControlMutation, unknown, DeleteMappedControlMutationVariables>({
    mutationFn: (variables) => client.request(DELETE_MAPPED_CONTROL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mappedControls'] })
    },
  })
}

import { useMutation, useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { CREATE_CONTROL_OBJECTIVE, DELETE_CONTROL_OBJECTIVE, GET_ALL_CONTROL_OBJECTIVES, UPDATE_CONTROL_OBJECTIVE } from '@repo/codegen/query/control-objective'
import {
  type ControlObjectiveFieldsFragment,
  type CreateControlObjectiveInput,
  type CreateControlObjectiveMutation,
  type DeleteControlObjectiveMutation,
  type DeleteControlObjectiveMutationVariables,
  type GetAllControlObjectivesQuery,
  type GetAllControlObjectivesQueryVariables,
  type UpdateControlObjectiveMutation,
  type UpdateControlObjectiveMutationVariables,
} from '@repo/codegen/src/schema'

export const useGetAllControlObjectives = (where?: GetAllControlObjectivesQueryVariables['where']) => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllControlObjectivesQuery>({
    queryKey: ['controlObjectives', where],
    queryFn: () => client.request(GET_ALL_CONTROL_OBJECTIVES, { where }),
  })
}

export const useGetControlObjectiveById = (id?: string | null) => {
  const { client } = useGraphQLClient()
  const result = useQuery<GetAllControlObjectivesQuery>({
    queryKey: ['controlObjectives', { id }],
    queryFn: () => client.request(GET_ALL_CONTROL_OBJECTIVES, { where: { id } }),
    enabled: !!id,
  })
  const node = result.data?.controlObjectives?.edges?.[0]?.node as ControlObjectiveFieldsFragment | undefined
  return { ...result, data: node }
}

export const useCreateControlObjective = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<CreateControlObjectiveMutation, Error, CreateControlObjectiveInput>({
    mutationFn: (input) => client.request(CREATE_CONTROL_OBJECTIVE, { input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controlObjectives'] })
    },
  })
}

export const useUpdateControlObjective = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateControlObjectiveMutation, unknown, UpdateControlObjectiveMutationVariables>({
    mutationFn: (variables) => client.request(UPDATE_CONTROL_OBJECTIVE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controlObjectives'] })
    },
  })
}

export const useDeleteControlObjective = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteControlObjectiveMutation, unknown, DeleteControlObjectiveMutationVariables>({
    mutationFn: (variables) => client.request(DELETE_CONTROL_OBJECTIVE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controlObjectives'] })
    },
  })
}

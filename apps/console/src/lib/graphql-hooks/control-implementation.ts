import { useMutation, useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { CREATE_CONTROL_IMPLEMENTATION, DELETE_CONTROL_IMPLEMENTATION, GET_ALL_CONTROL_IMPLEMENTATIONS, UPDATE_CONTROL_IMPLEMENTATION } from '@repo/codegen/query/control-implementation'
import {
  type ControlImplementationFieldsFragment,
  type CreateControlImplementationInput,
  type CreateControlImplementationMutation,
  type DeleteControlImplementationMutation,
  type DeleteControlImplementationMutationVariables,
  type GetAllControlImplementationsQuery,
  type GetAllControlImplementationsQueryVariables,
  type UpdateControlImplementationMutation,
  type UpdateControlImplementationMutationVariables,
} from '@repo/codegen/src/schema'

export const useGetAllControlImplementations = (where?: GetAllControlImplementationsQueryVariables['where']) => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllControlImplementationsQuery>({
    queryKey: ['controlImplementations', where],
    queryFn: () => client.request(GET_ALL_CONTROL_IMPLEMENTATIONS, { where }),
  })
}

export const useGetControlImplementationById = (id?: string | null) => {
  const { client } = useGraphQLClient()
  const result = useQuery<GetAllControlImplementationsQuery>({
    queryKey: ['controlImplementations', { id }],
    queryFn: () => client.request(GET_ALL_CONTROL_IMPLEMENTATIONS, { where: { id } }),
    enabled: !!id,
  })
  const node = result.data?.controlImplementations?.edges?.[0]?.node as ControlImplementationFieldsFragment | undefined
  return { ...result, data: node }
}

export const useCreateControlImplementation = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<CreateControlImplementationMutation, Error, CreateControlImplementationInput>({
    mutationFn: (input) => client.request(CREATE_CONTROL_IMPLEMENTATION, { input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controlImplementations'] })
    },
  })
}

export const useUpdateControlImplementation = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateControlImplementationMutation, unknown, UpdateControlImplementationMutationVariables>({
    mutationFn: (variables) => client.request(UPDATE_CONTROL_IMPLEMENTATION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controlImplementations'] })
    },
  })
}

export const useDeleteControlImplementation = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteControlImplementationMutation, unknown, DeleteControlImplementationMutationVariables>({
    mutationFn: (variables) => client.request(DELETE_CONTROL_IMPLEMENTATION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controlImplementations'] })
    },
  })
}

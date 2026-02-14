import { useMutation, useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { CREATE_CONTROL_IMPLEMENTATION, DELETE_CONTROL_IMPLEMENTATION, GET_ALL_CONTROL_IMPLEMENTATIONS, UPDATE_CONTROL_IMPLEMENTATION } from '@repo/codegen/query/control-implementation'
import {
  CreateControlImplementationInput,
  CreateControlImplementationMutation,
  DeleteControlImplementationMutation,
  DeleteControlImplementationMutationVariables,
  GetAllControlImplementationsQuery,
  GetAllControlImplementationsQueryVariables,
  UpdateControlImplementationMutation,
  UpdateControlImplementationMutationVariables,
} from '@repo/codegen/src/schema'

export const useGetAllControlImplementations = (where?: GetAllControlImplementationsQueryVariables['where']) => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllControlImplementationsQuery>({
    queryKey: ['controlImplementations', where],
    queryFn: () => client.request(GET_ALL_CONTROL_IMPLEMENTATIONS, { where }),
  })
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

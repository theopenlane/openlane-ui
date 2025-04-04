import { useMutation, useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { GET_ALL_CONTROLS, GET_CONTROL_BY_ID, UPDATE_CONTROL } from '@repo/codegen/query/control'

import { GetAllControlsQuery, GetAllControlsQueryVariables, GetControlByIdQuery, UpdateControlMutation, UpdateControlMutationVariables } from '@repo/codegen/src/schema'

export const useGetAllControls = (where?: GetAllControlsQueryVariables['where']) => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllControlsQuery, unknown>({
    queryKey: ['controls', where],
    queryFn: async () => client.request(GET_ALL_CONTROLS, { where }),
    enabled: where !== undefined,
  })
}

export const useGetControlById = (controlId?: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetControlByIdQuery, unknown>({
    queryKey: ['control', controlId],
    queryFn: async () => client.request(GET_CONTROL_BY_ID, { controlId }),
    enabled: !!controlId,
  })
}

export const useUpdateControl = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateControlMutation, unknown, UpdateControlMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_CONTROL, variables),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['control'] }),
  })
}

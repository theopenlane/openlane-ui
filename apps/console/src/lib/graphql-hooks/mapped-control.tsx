import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { CreateMappedControlMutation, CreateMappedControlMutationVariables, GetMappedControlsQuery, GetMappedControlsQueryVariables } from '@repo/codegen/src/schema'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CREATE_MAPPED_CONTROL, GET_MAPPED_CONTROLS } from '@repo/codegen/query/mapped-control'

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
    enabled: true,
  })
}

import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { CreateMappedControlMutation, CreateMappedControlMutationVariables } from '@repo/codegen/src/schema'
import { useMutation } from '@tanstack/react-query'
import { CREATE_MAPPED_CONTROL } from '@repo/codegen/query/mapped-control'

export const useCreateMappedControl = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<CreateMappedControlMutation, unknown, CreateMappedControlMutationVariables>({
    mutationFn: (variables) => client.request(CREATE_MAPPED_CONTROL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mappedControls'] })
    },
  })
}

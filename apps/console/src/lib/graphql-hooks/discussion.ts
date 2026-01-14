import { useGraphQLClient } from '@/hooks/useGraphQLClient.ts'
import { useMutation } from '@tanstack/react-query'
import { CreateDiscussionMutation, CreateDiscussionMutationVariables } from '@repo/codegen/src/schema.ts'
import { CREATE_DISCUSSION } from '@repo/codegen/query/discussion.ts'

export const useCreateDiscussion = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<CreateDiscussionMutation, unknown, CreateDiscussionMutationVariables>({
    mutationFn: async (payload) => {
      return client.request(CREATE_DISCUSSION, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions'] })
    },
  })
}

import { useGraphQLClient } from '@/hooks/useGraphQLClient.ts'
import { useMutation } from '@tanstack/react-query'
import { type CreateDiscussionMutation, type CreateDiscussionMutationVariables, type UpdateDiscussionMutation, type UpdateDiscussionMutationVariables } from '@repo/codegen/src/schema.ts'
import { CREATE_DISCUSSION, UPDATE_DISCUSSION } from '@repo/codegen/query/discussion.ts'

const DISCUSSION_QUERY_KEYS: readonly string[] = ['policyDiscussion', 'procedureDiscussion', 'controlsDiscussion', 'subcontrolsDiscussion', 'risksDiscussion']

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

export const useUpdateDiscussion = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateDiscussionMutation, unknown, UpdateDiscussionMutationVariables>({
    mutationFn: async (payload) => {
      return client.request(UPDATE_DISCUSSION, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => typeof query.queryKey[0] === 'string' && DISCUSSION_QUERY_KEYS.includes(query.queryKey[0]),
      })
    },
  })
}

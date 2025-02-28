import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { GET_USER_PROFILE, UPDATE_USER, UPDATE_USER_SETTING } from '@repo/codegen/query/user'
import {
  GetUserProfileQuery,
  GetUserProfileQueryVariables,
  UpdateUserMutation,
  UpdateUserMutationVariables,
  UpdateUserSettingMutation,
  UpdateUserSettingMutationVariables,
} from '@repo/codegen/src/schema'

import { useMutation } from '@tanstack/react-query'
import {} from '@repo/codegen/query/user'
import { fetchGraphQL } from '../fetchGraphql'
export const useGetUserProfile = (userId: string) => {
  const { client } = useGraphQLClient()

  return useQuery<GetUserProfileQuery, GetUserProfileQueryVariables>({
    queryKey: ['user'],
    queryFn: async () => client.request(GET_USER_PROFILE, { userId }),
    enabled: !!userId,
  })
}

// export const useUpdateUser = () => {
//   const { client, queryClient } = useGraphQLClient()
//   return useMutation<UpdateUserMutation, unknown, UpdateUserMutationVariables>({
//     mutationFn: async (payload) => client.request(UPDATE_USER, payload),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['user'] })
//     },
//   })
// }

export const useUpdateUser = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation({
    mutationFn: (payload: UpdateUserMutationVariables) => fetchGraphQL({ query: UPDATE_USER, variables: payload }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] }) // Invalidate user cache after update
    },
  })
}

export const useUpdateUserSetting = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateUserSettingMutation, unknown, UpdateUserSettingMutationVariables>({
    mutationFn: async ({ updateUserSettingId, input }) => client.request(UPDATE_USER_SETTING, { updateUserSettingId, input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}

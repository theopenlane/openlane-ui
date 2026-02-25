import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { DELETE_USER, GET_USER_PROFILE, UPDATE_USER, UPDATE_USER_SETTING } from '@repo/codegen/query/user'
import {
  DeleteUserMutation,
  DeleteUserMutationVariables,
  GetUserProfileQuery,
  GetUserProfileQueryVariables,
  UpdateUserMutation,
  UpdateUserMutationVariables,
  UpdateUserSettingMutation,
  UpdateUserSettingMutationVariables,
} from '@repo/codegen/src/schema'

import { useMutation } from '@tanstack/react-query'
import { fetchGraphQLWithUpload } from '../fetchGraphql'

export const useGetCurrentUser = (userId?: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetUserProfileQuery, GetUserProfileQueryVariables>({
    queryKey: ['user', userId],
    queryFn: async () => client.request(GET_USER_PROFILE, { userId }),
    enabled: !!userId,
  })
}

export const useUpdateUser = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateUserMutation, unknown, UpdateUserMutationVariables>({
    mutationFn: async (payload) => client.request(UPDATE_USER, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}

export const useUpdateUserAvatar = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation({
    mutationFn: (payload: UpdateUserMutationVariables) => fetchGraphQLWithUpload({ query: UPDATE_USER, variables: payload }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
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

export const useDeleteUser = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteUserMutation, unknown, DeleteUserMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_USER, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}

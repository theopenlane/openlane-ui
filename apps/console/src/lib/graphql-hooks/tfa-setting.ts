import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { CREATE_TFA_SETTING, GET_TFA_SETTINGS, GET_USER_TFA_SETTINGS, UPDATE_TFA_SETTING } from '@repo/codegen/query/tfa-setting'
import { CreateTfaSettingInput, CreateTfaSettingMutation, GetTfaSettingsQuery, GetUserTfaSettingsQuery, UpdateTfaSettingInput, UpdateTfaSettingMutation } from '@repo/codegen/src/schema'

export const useGetTFASettings = () => {
  const { client } = useGraphQLClient()
  return useQuery<GetTfaSettingsQuery, unknown>({
    queryKey: ['tfaSettings'],
    queryFn: async () => client.request(GET_TFA_SETTINGS),
  })
}

export const useGetUserTFASettings = (userId?: string) => {
  const { client } = useGraphQLClient()
  return useQuery<GetUserTfaSettingsQuery, unknown>({
    queryKey: ['userTFASettings'],
    queryFn: async () => client.request(GET_USER_TFA_SETTINGS, { userId }),
    enabled: !!userId,
  })
}

export const useUpdateTfaSetting = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<UpdateTfaSettingMutation, unknown, { input: UpdateTfaSettingInput }>({
    mutationFn: async (input) => client.request(UPDATE_TFA_SETTING, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tfaSettings'] })
      queryClient.invalidateQueries({ queryKey: ['userTFASettings'] })
    },
  })
}

export const useCreateTfaSetting = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreateTfaSettingMutation, unknown, { input: CreateTfaSettingInput }>({
    mutationFn: async (input) => client.request(CREATE_TFA_SETTING, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tfaSettings'] })
      queryClient.invalidateQueries({ queryKey: ['userTFASettings'] })
    },
  })
}

import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { CREATE_TFA_SETTING, GET_TFA_SETTINGS, GET_USER_TFA_SETTINGS, UPDATE_TFA_SETTING } from '@repo/codegen/query/tfa-setting'
import {
  type CreateTfaSettingInput,
  type CreateTfaSettingMutation,
  type GetTfaSettingsQuery,
  type GetUserTfaSettingsQuery,
  type UpdateTfaSettingInput,
  type UpdateTfaSettingMutation,
} from '@repo/codegen/src/schema'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

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
    queryKey: ['userTFASettings', userId],
    queryFn: async () => client.request(GET_USER_TFA_SETTINGS, { userId }),
    enabled: !!userId,
  })
}

export const useUpdateTfaSetting = (cookieAuth = false) => {
  const { client } = useGraphQLClient(cookieAuth)
  const queryClient = useQueryClient()
  return useMutation<UpdateTfaSettingMutation, unknown, { input: UpdateTfaSettingInput }>({
    mutationFn: async (input) => client.request(UPDATE_TFA_SETTING, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tfaSettings'] })
      queryClient.invalidateQueries({ queryKey: ['userTFASettings'] })
    },
  })
}

export const useCreateTfaSetting = (cookieAuth = false) => {
  const { client } = useGraphQLClient(cookieAuth)
  const queryClient = useQueryClient()
  return useMutation<CreateTfaSettingMutation, unknown, { input: CreateTfaSettingInput }>({
    mutationFn: async (input) => client.request(CREATE_TFA_SETTING, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tfaSettings'] })
      queryClient.invalidateQueries({ queryKey: ['userTFASettings'] })
    },
  })
}

export const useStartTfaEnrollment = () => {
  const { client } = useGraphQLClient(true)
  const queryClient = useQueryClient()

  return useMutation<{ qrCode: string; secret: string }, unknown, void>({
    mutationFn: async () => {
      const tfaSettings = await client.request<GetTfaSettingsQuery>(GET_TFA_SETTINGS)
      const input = {
        input: {
          totpAllowed: true,
        },
      }

      const existingConfig = tfaSettings.tfaSettings?.edges?.some((edge) => edge?.node)
        ? (await client.request<UpdateTfaSettingMutation>(UPDATE_TFA_SETTING, input)).updateTFASetting
        : (await client.request<CreateTfaSettingMutation>(CREATE_TFA_SETTING, input)).createTFASetting

      if (!existingConfig.qrCode || !existingConfig.tfaSecret) {
        throw new Error('Unable to create authenticator setup')
      }

      return {
        qrCode: existingConfig.qrCode,
        secret: existingConfig.tfaSecret,
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tfaSettings'] })
      queryClient.invalidateQueries({ queryKey: ['userTFASettings'] })
    },
  })
}

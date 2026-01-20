import { useUpdateTrustCenterSetting } from '@/lib/graphql-hooks/trust-center'
import { useNotification } from '@/hooks/useNotification'
import { UpdateTrustCenterSettingInput } from '@repo/codegen/src/schema'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

type UpdateTrustCenterSettingsArgs = {
  id?: string
  input: UpdateTrustCenterSettingInput
  logoFile?: File
  faviconFile?: File
}

export function useHandleUpdateSetting() {
  const { mutateAsync, isPending } = useUpdateTrustCenterSetting()
  const { successNotification, errorNotification } = useNotification()

  const updateTrustCenterSetting = async ({ id, input, logoFile, faviconFile }: UpdateTrustCenterSettingsArgs) => {
    if (!id) {
      // this case should never happen
      errorNotification({
        title: 'Missing ID',
        description: 'Something went wrong, please try again.',
      })
      return
    }

    try {
      await mutateAsync({
        updateTrustCenterSettingId: id,
        input,
        logoFile,
        faviconFile,
      })

      successNotification({
        title: 'Settings updated',
        description: 'Your Trust Center settings were saved successfully.',
      })
    } catch (err) {
      errorNotification({
        title: 'Failed to update settings',
        description: parseErrorMessage(err),
      })
    }
  }

  return {
    updateTrustCenterSetting,
    isPending,
  }
}

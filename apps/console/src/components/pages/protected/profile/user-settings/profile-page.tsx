'use client'
import React, { Suspense, useMemo, useState } from 'react'
import { ProfileNameForm } from './profile-name-form'
import { AvatarUpload } from '@/components/shared/avatar-upload/avatar-upload'
import { useSession } from 'next-auth/react'
import {
  File,
  GetUserProfileQueryVariables,
  useCreateTfaSettingMutation,
  useGetUserProfileQuery,
  useGetUserTfaSettingsQuery,
  useUpdateTfaSettingMutation,
  useUpdateUserMutation,
  useUpdateUserSettingMutation,
} from '@repo/codegen/src/schema'
import { useNotification } from '@/hooks/useNotification'
import DefaultOrgForm from './default-org-form'
import { Loader } from 'lucide-react'

import QRCodeDialog from './qrcode-dialog'
import { Button } from '@repo/ui/button'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { Badge } from '@repo/ui/badge'

const ProfilePage = () => {
  const { data: sessionData } = useSession()
  const { successNotification, errorNotification } = useNotification()
  const userId = sessionData?.user.userId

  const [qrcode, setQrcode] = useState<null | string>(null)
  const [secret, setSecret] = useState<null | string>(null)
  const [regeneratedCodes, setRegeneratedCodes] = useState<null | string[]>(null)
  const variables: GetUserProfileQueryVariables = {
    userId: userId ?? '',
  }

  const [{ data: userData }, refetchUser] = useGetUserProfileQuery({
    variables,
    requestPolicy: 'network-only',
  })

  const [{ fetching: isSubmitting }, updateUser] = useUpdateUserMutation()

  const [{ data: tfaData }, refetch] = useGetUserTfaSettingsQuery({ variables, requestPolicy: 'network-only' })
  const tfaSettings = tfaData?.user?.tfaSettings?.[0]

  const [{ fetching: isTfaSubmitting }, updateTfaSetting] = useUpdateTfaSettingMutation()
  const [{ fetching: isTfaCreating }, createTfaSetting] = useCreateTfaSettingMutation()
  const [{ fetching: updatingUser }, updateUserSetting] = useUpdateUserSettingMutation()

  const isVerified = !!tfaSettings?.verified

  const handleUploadAvatar = async (file: File) => {
    if (!userId) return

    try {
      await updateUser({
        updateUserId: userId,
        input: {},
        avatarFile: file,
      })

      successNotification({
        title: 'Avatar updated successfully',
      })
    } catch (error) {
      console.error('file upload error')
      errorNotification({
        title: 'Failed to update avatar',
      })
    }
  }

  const handleConfigure = async () => {
    let qrcode
    let secret
    if (!tfaSettings) {
      const { data } = await createTfaSetting({
        input: {
          totpAllowed: true,
        },
      })
      qrcode = data?.createTFASetting.qrCode
      secret = data?.createTFASetting.tfaSecret
    } else if (!isVerified) {
      const { data } = await updateTfaSetting({
        input: {
          totpAllowed: true,
        },
      })
      qrcode = data?.updateTFASetting.qrCode
      secret = data?.updateTFASetting.tfaSecret
    }

    setQrcode(qrcode || null)
    setSecret(secret || null)
  }

  const handleTfaChange = async (checked: boolean) => {
    try {
      await updateUserSetting({
        updateUserSettingId: userData?.user?.setting?.id ?? '',
        input: {
          isTfaEnabled: checked,
        },
      })

      successNotification({
        title: `Two-factor authentication ${checked ? 'enabled' : 'disabled'} successfully`,
      })
    } catch (error) {
      console.error('Error updating TFA setting:', error)
      errorNotification({
        title: 'Failed to update TFA setting',
      })
    }
  }

  const removeTfa = async () => {
    try {
      await updateTfaSetting({
        input: {
          totpAllowed: false,
        },
      })
      successNotification({
        title: `Two-factor authentication removed successfully`,
      })
    } catch (error) {
      errorNotification({
        title: 'Failed to remove Two-factor authentication ',
      })
    }
    refetchUser()
  }

  const regenerateCodes = async () => {
    const resp = await updateTfaSetting({
      input: {
        regenBackupCodes: true,
      },
    })
    setRegeneratedCodes(resp?.data?.updateTFASetting?.recoveryCodes || null)
  }

  const config = useMemo(() => {
    if (!tfaSettings || !isVerified) {
      return {
        badge: <Badge variant="secondary">Recommend</Badge>,
        text: <p className="text-sm">A TOTP method has not been setup for your account.</p>,
        buttons: [
          <Button key={0} className="mx-10 w-24" onClick={handleConfigure}>
            Configure
          </Button>,
        ],
      }
    }

    if (userData?.user.setting.isTfaEnabled) {
      return {
        badge: <Badge variant="default">Enabled</Badge>,
        text: (
          <p className="text-sm">
            A TOTP method has been added for your account. Ensure you have your recovery codes stored, or{' '}
            <span className="text-blue-400 cursor-pointer" onClick={regenerateCodes}>
              regenerate&nbsp;
            </span>
            them now.
          </p>
        ),
        buttons: [
          <Button key={0} className="mx-10 w-24" onClick={() => handleTfaChange(false)}>
            Disable
          </Button>,
          <Button key={1} variant="redOutline" className="mx-10 w-24" onClick={removeTfa}>
            Remove
          </Button>,
        ],
      }
    }

    return {
      badge: <Badge variant="destructive">Disabled</Badge>,
      text: (
        <p className="text-sm">
          A TOTP method has been added for your account. Ensure you have your recovery codes stored, or{' '}
          <span className="text-blue-400 cursor-pointer" onClick={regenerateCodes}>
            regenerate&nbsp;
          </span>
          them now.
        </p>
      ),
      buttons: [
        <Button key={0} className="mx-10 w-24" onClick={() => handleTfaChange(true)}>
          Enable
        </Button>,
        <Button key={1} variant="redOutline" className="mx-10 w-24" onClick={removeTfa}>
          Remove
        </Button>,
      ],
    }
  }, [tfaSettings, isVerified, userData?.user.setting.isTfaEnabled])

  return (
    <>
      <ProfileNameForm />
      <AvatarUpload
        fallbackString={userData?.user?.firstName?.substring(0, 2)}
        uploadCallback={handleUploadAvatar || 'N/A'}
        placeholderImage={userData?.user.avatarFile?.presignedURL || sessionData?.user?.image}
      />
      <Panel>
        <PanelHeader heading="Two Factor Authentication" noBorder />
        <div className="flex w-full justify-between">
          <div className="rounded-l-lg bg-card border flex-1">
            <div className="flex p-3 justify-between items-center">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <h2 className="text-lg">Mobile App Authentication</h2>
                  {config?.badge}
                </div>
                {config?.text}
              </div>
            </div>
          </div>
          <div className="rounded-r-lg bg-card border flex items-center justify-center flex-col p-3 gap-2">{config?.buttons}</div>
        </div>
      </Panel>

      {(!!regeneratedCodes || (qrcode && secret)) && (
        <QRCodeDialog
          qrcode={qrcode}
          secret={secret}
          refetch={() => {
            refetch()
            refetchUser()
          }}
          onClose={() => {
            setQrcode('')
            setSecret('')
            setRegeneratedCodes(null)
          }}
          regeneratedCodes={regeneratedCodes}
        />
      )}
      <Suspense fallback={<Loader />}>
        <DefaultOrgForm />
      </Suspense>
    </>
  )
}

export default ProfilePage

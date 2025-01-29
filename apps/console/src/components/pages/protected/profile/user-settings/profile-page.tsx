'use client'
import React, { Suspense, useMemo, useState } from 'react'
import { ProfileNameForm } from './profile-name-form'
import { AvatarUpload } from '@/components/shared/avatar-upload/avatar-upload'
import { useSession } from 'next-auth/react'
import {
  GetUserProfileQueryVariables,
  useCreateTfaSettingMutation,
  useGetUserProfileQuery,
  useGetUserTfaSettingsQuery,
  useUpdateTfaSettingMutation,
  useUpdateUserMutation,
  useUpdateUserSettingMutation,
} from '@repo/codegen/src/schema'
import { toast } from '@repo/ui/use-toast'
import DefaultOrgForm from './default-org-form'
import { Loader } from 'lucide-react'

import QRCodeDialog from './qrcode-dialog'
import { Button } from '@repo/ui/button'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { Badge } from '@repo/ui/badge'

const ProfilePage = () => {
  const { data: sessionData } = useSession()
  const userId = sessionData?.user.userId

  const [qrcode, setQrcode] = useState<null | string>(null)
  const [secret, setSecret] = useState<null | string>(null)

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

      toast({
        title: 'Avatar updated successfully',
        variant: 'success',
      })
    } catch (error) {
      console.error('file upload error')
      toast({
        title: 'Failed to update avatar',
        variant: 'destructive',
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

      toast({
        title: `Two-factor authentication ${checked ? 'enabled' : 'disabled'} successfully`,
        variant: 'success',
      })
    } catch (error) {
      console.error('Error updating TFA setting:', error)
      toast({
        title: 'Failed to update TFA setting',
        variant: 'destructive',
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
      toast({
        title: `Two-factor authentication removed successfully`,
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Failed to remove Two-factor authentication ',
        variant: 'destructive',
      })
    }
    refetchUser()
  }

  const config = useMemo(() => {
    if (!tfaSettings || !isVerified) {
      return {
        badge: <Badge variant="secondary">Recommend</Badge>,
        text: 'A TOTP method has not been setup for your account.',
        buttons: [
          <Button className="mx-10 w-24" onClick={handleConfigure}>
            Configure
          </Button>,
        ],
      }
    }

    if (userData?.user.setting.isTfaEnabled) {
      return {
        badge: <Badge variant="default">Enabled</Badge>,
        text: 'A TOTP method has been added for your account.',
        buttons: [
          <Button className="mx-10 w-24" onClick={() => handleTfaChange(false)}>
            Disable
          </Button>,
          <Button variant="redOutline" className="mx-10 w-24" onClick={removeTfa}>
            Remove
          </Button>,
        ],
      }
    }

    return {
      badge: <Badge variant="destructive">Disabled</Badge>,
      text: 'A TOTP method has been added for your account.',
      buttons: [
        <Button className="mx-10 w-24" onClick={() => handleTfaChange(true)}>
          Enable
        </Button>,
        <Button variant="redOutline" className="mx-10 w-24" onClick={removeTfa}>
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
                <p className="text-sm">{config?.text}</p>
              </div>
            </div>
          </div>
          <div className="rounded-r-lg bg-card border flex items-center justify-center flex-col p-3 gap-2">{config?.buttons}</div>
        </div>
      </Panel>

      {qrcode && secret && (
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
          }}
        />
      )}
      <Suspense fallback={<Loader />}>
        <DefaultOrgForm />
      </Suspense>
    </>
  )
}

export default ProfilePage

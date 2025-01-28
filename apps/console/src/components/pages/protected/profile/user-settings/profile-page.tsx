'use client'
import React, { Suspense, useState } from 'react'
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
import { Checkbox } from '@repo/ui/checkbox'
import { Label } from '@repo/ui/label'
import QRCodeDialog from './qrcode-dialog'
import { Button } from '@repo/ui/button'

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

  const handleTfaChange = async (checked: boolean) => {
    try {
      let qrcode
      let secret

      const isVerified = !!tfaSettings?.verified

      if (isVerified) {
        await updateUserSetting({
          updateUserSettingId: userData?.user?.setting?.id ?? '',
          input: {
            isTfaEnabled: checked,
          },
        })
      } else if (!isVerified) {
        const { data } = await updateTfaSetting({
          input: {
            totpAllowed: true,
          },
        })
        qrcode = data?.updateTFASetting.qrCode
        secret = data?.updateTFASetting.tfaSecret
      } else if (!tfaSettings) {
        const { data } = await createTfaSetting({
          input: {
            totpAllowed: true,
          },
        })
        qrcode = data?.createTFASetting.qrCode
        secret = data?.createTFASetting.tfaSecret
      }

      setQrcode(qrcode || null)
      setSecret(secret || null)

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
    await updateTfaSetting({
      input: {
        totpAllowed: false,
      },
    })
    refetchUser()
  }

  return (
    <>
      <button onClick={removeTfa}>remove tfa</button>
      <ProfileNameForm />
      <AvatarUpload
        fallbackString={userData?.user?.firstName?.substring(0, 2)}
        uploadCallback={handleUploadAvatar || 'N/A'}
        placeholderImage={userData?.user.avatarFile?.presignedURL || sessionData?.user?.image}
      />
      <div className="flex items-center ">
        <Checkbox checked={!!userData?.user.setting.isTfaEnabled} disabled={isTfaSubmitting} onCheckedChange={handleTfaChange}></Checkbox>
        <Label className="mx-4">Enable Two-Factor Authentication</Label>
        {tfaSettings && tfaSettings.verified && <Button onClick={removeTfa}>Remove Two-Factor Authentication</Button>}
      </div>
      {qrcode && secret && (
        <QRCodeDialog
          qrcode={qrcode}
          secret={secret}
          refetch={() => {
            refetch()
            refetchUser()
          }}
          onClose={() => {
            console.log('clear codes')
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

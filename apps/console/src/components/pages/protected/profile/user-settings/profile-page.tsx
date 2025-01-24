'use client'
import React, { Suspense } from 'react'
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
} from '@repo/codegen/src/schema'
import { toast } from '@repo/ui/use-toast'
import DefaultOrgForm from './default-org-form'
import { Loader } from 'lucide-react'
import { Checkbox } from '@repo/ui/checkbox'
import { Label } from '@repo/ui/label'
import QRCodeDialog from './qrcode-dialog'

const ProfilePage = () => {
  const { data: sessionData } = useSession()
  const userId = sessionData?.user.userId

  const variables: GetUserProfileQueryVariables = {
    userId: userId ?? '',
  }

  const [{ data: userData }] = useGetUserProfileQuery({
    variables,
  })

  const [{ fetching: isSubmitting }, updateUser] = useUpdateUserMutation()

  const [{ data: tfaData }] = useGetUserTfaSettingsQuery({ variables })

  const [{ fetching: isTfaSubmitting }, updateTfaSetting] = useUpdateTfaSettingMutation()
  const [{ fetching: isTfaCreating }, createTfaSetting] = useCreateTfaSettingMutation()

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
      await createTfaSetting({
        input: {
          totpAllowed: checked,
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

  return (
    <>
      <ProfileNameForm />
      <AvatarUpload
        fallbackString={userData?.user?.firstName?.substring(0, 2)}
        uploadCallback={handleUploadAvatar || 'N/A'}
        placeholderImage={userData?.user.avatarFile?.presignedURL || sessionData?.user?.image}
      />
      <div className="tfa-settings">
        <Checkbox checked={tfaData?.user?.tfaSettings?.totpAllowed ?? false} disabled={isTfaSubmitting} onCheckedChange={handleTfaChange}></Checkbox>
        <Label>Enable Two-Factor Authentication</Label>
      </div>
      <QRCodeDialog />

      <Suspense fallback={<Loader />}>
        <DefaultOrgForm />
      </Suspense>
    </>
  )
}

export default ProfilePage

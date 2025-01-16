'use client'
import React, { Suspense } from 'react'
import { ProfileNameForm } from './profile-name-form'
import { AvatarUpload } from '@/components/shared/avatar-upload/avatar-upload'
import { useSession } from 'next-auth/react'
import { GetUserProfileQueryVariables, useGetUserProfileQuery, useUpdateUserMutation } from '@repo/codegen/src/schema'
import { toast } from '@repo/ui/use-toast'
import DefaultOrgForm from './default-org-form'
import { Loader } from 'lucide-react'

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
  return (
    <>
      <ProfileNameForm />
      <AvatarUpload
        fallbackString={userData?.user?.firstName?.substring(0, 2)}
        uploadCallback={handleUploadAvatar || 'N/A'}
        placeholderImage={userData?.user.avatarFile?.presignedURL || sessionData?.user?.image}
      />
      <Suspense fallback={<Loader />}>
        <DefaultOrgForm />
      </Suspense>
    </>
  )
}

export default ProfilePage

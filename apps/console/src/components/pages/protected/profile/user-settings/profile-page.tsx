'use client'

import React, { Suspense, useMemo, useState, useEffect, useContext, useCallback } from 'react'
import { ProfileNameForm } from './profile-name-form'
import { AvatarUpload } from '@/components/shared/avatar-upload/avatar-upload'
import { useSession } from 'next-auth/react'
import { useNotification } from '@/hooks/useNotification'
import DefaultOrgForm from './default-org-form'
import { Loader } from 'lucide-react'
import QRCodeDialog from './qrcode-dialog'
import { Button } from '@repo/ui/button'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { Badge } from '@repo/ui/badge'
import { useGetCurrentUser, useUpdateUserAvatar, useUpdateUserSetting } from '@/lib/graphql-hooks/user'
import { useCreateTfaSetting, useGetUserTFASettings, useUpdateTfaSetting } from '@/lib/graphql-hooks/tfa'
import PasskeySection from './passkeys-section'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import DeleteUserSection from '../delete-user-section'

const ProfilePage = () => {
  const { data: sessionData } = useSession()
  const { setCrumbs } = useContext(BreadcrumbContext)
  const { successNotification, errorNotification } = useNotification()
  const userId = sessionData?.user.userId

  const [qrcode, setQrcode] = useState<null | string>(null)
  const [secret, setSecret] = useState<null | string>(null)
  const [regeneratedCodes, setRegeneratedCodes] = useState<null | string[]>(null)

  const { data: userData } = useGetCurrentUser(userId)

  const { mutateAsync: updateUserAvatar } = useUpdateUserAvatar()

  const { data: tfaData } = useGetUserTFASettings(userId)
  const tfaSettings = tfaData?.user?.tfaSettings?.edges?.[0]?.node

  const { mutateAsync: updateTfaSetting } = useUpdateTfaSetting()
  const { mutateAsync: createTfaSetting } = useCreateTfaSetting()
  const { mutateAsync: updateUserSetting } = useUpdateUserSetting()

  const isVerified = !!tfaSettings?.verified

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'User Settings', href: '/user-settings/profile' },
      { label: 'Profile', href: '/user-settings/profile' },
    ])
  }, [setCrumbs])

  const handleUploadAvatar = async (file: File) => {
    if (!userId) return

    try {
      await updateUserAvatar({
        updateUserId: userId,
        input: {},
        avatarFile: file,
      })

      successNotification({
        title: 'Avatar updated successfully',
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleConfigure = useCallback(async () => {
    let qrcode
    let secret
    if (!tfaSettings) {
      const data = await createTfaSetting({
        input: {
          totpAllowed: true,
        },
      })
      qrcode = data?.createTFASetting.qrCode
      secret = data?.createTFASetting.tfaSecret
    } else if (!isVerified) {
      const data = await updateTfaSetting({
        input: {
          totpAllowed: true,
        },
      })
      qrcode = data?.updateTFASetting.qrCode
      secret = data?.updateTFASetting.tfaSecret
    }

    setQrcode(qrcode || null)
    setSecret(secret || null)
  }, [createTfaSetting, isVerified, tfaSettings, updateTfaSetting])

  const handleTfaChange = useCallback(
    async (checked: boolean) => {
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
        const errorMessage = parseErrorMessage(error)
        errorNotification({
          title: 'Error',
          description: errorMessage,
        })
      }
    },
    [errorNotification, successNotification, updateUserSetting, userData?.user?.setting?.id],
  )

  const removeTfa = useCallback(async () => {
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
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }, [errorNotification, successNotification, updateTfaSetting])

  const regenerateCodes = useCallback(async () => {
    const resp = await updateTfaSetting({
      input: {
        regenBackupCodes: true,
      },
    })
    setRegeneratedCodes(resp?.updateTFASetting?.recoveryCodes || null)
  }, [updateTfaSetting])

  const twoFAConfig = useMemo(() => {
    if (!tfaSettings || !isVerified) {
      return {
        badge: <Badge variant="secondary">Recommended</Badge>,
        text: <p className="text-sm">A second factor method has not been setup for your account.</p>,
        buttons: [
          <Button variant="primary" key={0} className="mx-10 w-24" onClick={handleConfigure}>
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
            A second factor method has been added for your account. Ensure you have your recovery codes stored, or{' '}
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
          A second factor method has been added for your account. Ensure you have your recovery codes stored, or{' '}
          <span className="text-blue-400 cursor-pointer" onClick={regenerateCodes}>
            regenerate&nbsp;
          </span>
          them now.
        </p>
      ),
      buttons: [
        <Button variant="secondary" key={0} className="mx-10 w-24" onClick={() => handleTfaChange(true)}>
          Enable
        </Button>,
        <Button key={1} variant="redOutline" className="mx-10 w-24" onClick={removeTfa}>
          Remove
        </Button>,
      ],
    }
  }, [tfaSettings, isVerified, userData?.user.setting.isTfaEnabled, handleConfigure, handleTfaChange, regenerateCodes, removeTfa])

  return (
    <>
      <ProfileNameForm />
      <AvatarUpload
        fallbackString={userData?.user?.displayName?.substring(0, 2)}
        uploadCallback={handleUploadAvatar || 'N/A'}
        placeholderImage={userData?.user.avatarFile?.presignedURL || sessionData?.user?.image}
      />
      <Suspense fallback={<Loader />}>
        <DefaultOrgForm />
      </Suspense>
      <Panel>
        <PanelHeader heading="Two Factor Authentication" noBorder />
        <div className="flex w-full justify-between">
          <div className="rounded-l-lg bg-card border flex-1">
            <div className="flex p-3 justify-between items-center">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <h2 className="text-lg">Mobile App Authentication</h2>
                  {twoFAConfig?.badge}
                </div>
                {twoFAConfig?.text}
              </div>
            </div>
          </div>
          <div className="rounded-r-lg bg-card border flex items-center justify-center flex-col p-3 gap-2">{twoFAConfig?.buttons}</div>
        </div>
      </Panel>

      {(!!regeneratedCodes || (qrcode && secret)) && (
        <QRCodeDialog
          qrcode={qrcode}
          secret={secret}
          onClose={() => {
            setQrcode('')
            setSecret('')
            setRegeneratedCodes(null)
          }}
          regeneratedCodes={regeneratedCodes}
        />
      )}

      <PasskeySection userData={userData} />
      <DeleteUserSection userId={userId} />
    </>
  )
}

export default ProfilePage

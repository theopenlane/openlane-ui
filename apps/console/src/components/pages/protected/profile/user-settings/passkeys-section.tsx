'use client'

import { useNotification } from '@/hooks/useNotification'
import { setSessionCookie } from '@/lib/auth/utils/set-session-cookie'
import { useUpdateUserSetting } from '@/lib/graphql-hooks/user'
import { getPasskeyRegOptions, verifyRegistration } from '@/lib/user'
import { GetUserProfileQuery } from '@repo/codegen/src/schema'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { startRegistration } from '@simplewebauthn/browser'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'

const PasskeySection = ({ userData }: { userData: GetUserProfileQuery | undefined }) => {
  const { successNotification, errorNotification } = useNotification()

  const [loading, setLoading] = useState<boolean>(false)

  const { isPending: updatingUser, mutateAsync: updateUserSetting } = useUpdateUserSetting()

  const queryClient = useQueryClient()

  const handleConfigure = async () => {
    try {
      setLoading(true)

      const options = await getPasskeyRegOptions({
        email: userData?.user.email as string,
      })

      setSessionCookie(options.session)

      const attestationResponse = await startRegistration({
        useAutoRegister: true,
        optionsJSON: options.publicKey,
      })

      const verificationResult = await verifyRegistration({
        attestationResponse,
      })

      if (!verificationResult.success) {
        errorNotification({
          title: `Error: ${verificationResult.error}`,
        })
        return
      }

      queryClient.invalidateQueries({ queryKey: ['user'] })

      successNotification({
        title: 'Passkeys successfully setup',
        description: 'You can now sign in with your passkey',
      })

      setLoading(false)
    } catch (err: any) {
      setLoading(false)
      console.error('Error during passkey creation:', err)

      if (err.name === 'AbortError' || err.name === 'NotAllowedError') {
        errorNotification({ title: 'User canceled setting up Passkeys set up' })
        return
      }

      errorNotification({ title: 'An error occurred while setting up your passkey' })
    }
  }

  const removePasskeys = async () => {
    try {
      await updateUserSetting({
        updateUserSettingId: userData?.user?.setting?.id ?? '',
        input: {
          isWebauthnAllowed: false,
        },
      })

      successNotification({
        title: `Your passkeys have been removed. You will only be able to sign in with your passwords now`,
      })
    } catch (error) {
      console.error('Error updating user settings:', error)
      errorNotification({
        title: 'Failed to disable passkeys authentication',
      })
    }
  }

  const passKeyConfig = useMemo(() => {
    if (!userData?.user.setting.isWebauthnAllowed) {
      return {
        badge: <Badge variant="secondary">Recommended</Badge>,
        text: <p className="text-sm">With Passkeys, you can securely sign into your account using just your fingerprint, face, screen lock, or security key</p>,
        buttons: [],
      }
    }

    return {
      badge: <Badge variant="default">Enabled</Badge>,
      text: <p className="text-sm">Be sure to keep your screen locks private and security keys safe, so only you can use them.</p>,
      buttons: [],
    }
  }, [userData?.user.setting.isWebauthnAllowed, loading])

  return (
    <Panel>
      <PanelHeader heading="Passkeys and security keys" noBorder />
      <div className="flex w-full justify-between">
        <div className="rounded-l-lg bg-card border flex-1">
          <div className="flex p-3 justify-between items-center">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <h2 className="text-lg">Passkeys</h2>
                {passKeyConfig?.badge}
              </div>
              {passKeyConfig?.text}
            </div>
          </div>
        </div>

        <div className="rounded-r-lg bg-card border flex items-center justify-center flex-col p-3 gap-2">
          {userData?.user.setting.isWebauthnAllowed ? (
            <Dialog>
              <DialogTrigger>
                <Button variant="redOutline" className="mx-10 w-24">
                  Remove
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[455px]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-semibold">Remove your Passkeys</DialogTitle>
                  <DialogDescription className="pt-2">
                    Are you sure you want to remove your passkeys? You'll need to use your password to sign in, and you'll need to set up your passkeys again if you want to use them later.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end space-x-4 pt-4">
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button variant="destructive" onClick={removePasskeys} loading={updatingUser} disabled={updatingUser}>
                    Remove Passkeys
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Button key={0} className="mx-10 w-24" onClick={handleConfigure} loading={loading} disabled={loading}>
              Configure
            </Button>
          )}
        </div>
      </div>
    </Panel>
  )
}

export default PasskeySection

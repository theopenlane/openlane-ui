'use client'

import { useNotification } from '@/hooks/useNotification'
import { setSessionCookie } from '@/lib/auth/utils/set-session-cookie'
import { getPasskeyRegOptions, verifyRegistration } from '@/lib/user'
import { GetUserProfileQuery, Webauthn } from '@repo/codegen/src/schema'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { startRegistration } from '@simplewebauthn/browser'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { useDeletePasskey, useGetPasskeys } from '@/lib/graphql-hooks/passkeys'
import rawData from '@/lib/passkeys.json' assert { type: 'json' }

type PasskeyEntry = {
  name?: string
  icon_dark?: string
  icon_light?: string
}

type PasskeysData = Record<string, PasskeyEntry>

const passkeysData = rawData as PasskeysData

const getPasskeyData = (id: string): PasskeyEntry => {
  const passkey = passkeysData[id]

  return {
    name: passkey?.name || '',
    icon_dark: passkey?.icon_dark || '',
    icon_light: passkey?.icon_light || '',
  }
}

const PasskeySection = ({ userData }: { userData: GetUserProfileQuery | undefined }) => {
  const { successNotification, errorNotification } = useNotification()

  const [loading, setLoading] = useState<boolean>(false)

  const { data: passkeys } = useGetPasskeys(userData?.user?.id)

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

      queryClient.invalidateQueries({ queryKey: ['passkeys'] })

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
        <div className="flex w-full justify-between">
          <div className="rounded-lg bg-card border flex-1">
            <div className="flex flex-col">
              <div className="p-3 border-b">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg">Passkeys {passKeyConfig?.badge}</h2>
                </div>
                <div className="flex items-center justify-between">
                  <span>{passKeyConfig?.text}</span>
                  <Button onClick={handleConfigure} loading={loading} disabled={loading}>
                    Add another Passkey
                  </Button>
                </div>
              </div>
              {userData?.user.setting.isWebauthnAllowed && (
                <div className="divide-y">
                  {passkeys?.user?.webauthns?.edges?.map((passkey) => {
                    const key = passkey?.node as Webauthn
                    return <PasskeyItem passkey={key} key={key.id} />
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Panel>
  )
}

const PasskeyItem = ({ passkey }: { passkey: Webauthn }) => {
  const { successNotification, errorNotification } = useNotification()
  const passkeyData = getPasskeyData(passkey.aaguid)

  const { mutateAsync: deletePasskey } = useDeletePasskey()

  const removePasskeys = async () => {
    try {
      await deletePasskey({ deleteWebauthnId: passkey.id })
      successNotification({
        title: `Your passkeys have been removed`,
      })
    } catch (error) {
      errorNotification({
        title: 'Failed to delete your passkey device',
      })
    }
  }
  return (
    <div className="flex items-center justify-between p-3 border-b last:border-b-0">
      <div className="flex items-center gap-2">
        {passkeyData.icon_dark && <img src={passkeyData.icon_dark} alt="Passkey icon" className="w-5 h-5" />}
        <div>
          <p className="font-medium">{passkeyData.name || 'Unrecognized Passkey device'}</p>
          <p className="text-sm text-muted-foreground">Added on {new Date(passkey.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
      <Dialog>
        <DialogTrigger>
          <Button variant="redOutline">Remove</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[455px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Remove your Passkey</DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to remove this passkey? You will no longer be able to use this passkey to authenticate anymore as this operation cannot be reversed
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-4 pt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={removePasskeys}>
              Remove Passkey
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PasskeySection

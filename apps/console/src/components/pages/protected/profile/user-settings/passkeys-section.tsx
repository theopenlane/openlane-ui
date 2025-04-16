'use client'

import { useNotification } from '@/hooks/useNotification'
import { setSessionCookie } from '@/lib/auth/utils/set-session-cookie'
import { getPasskeyRegOptions, verifyRegistration } from '@/lib/user'
import { GetUserProfileQuery } from '@repo/codegen/src/schema'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { startRegistration } from '@simplewebauthn/browser'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

const PasskeySection = ({ userData }: { userData: GetUserProfileQuery | undefined }) => {
  const { successNotification, errorNotification } = useNotification()

  const [loading, setLoading] = useState<boolean>(false)

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

  const handleTfaChange = async (checked: boolean) => {}

  const removeTfa = async () => {}

  const regenerateCodes = async () => {}

  const passKeyConfig = useMemo(() => {
    if (!userData?.user.setting.isWebauthnAllowed) {
      return {
        badge: <Badge variant="secondary">Recommended</Badge>,
        text: <p className="text-sm">With Passkeys, you can securely sign into your account using just your fingerprint, face, screen lock, or security key</p>,
        buttons: [
          <Button key={0} className="mx-10 w-24" onClick={handleConfigure} loading={loading} disabled={loading}>
            Configure
          </Button>,
        ],
      }
    }

    return {
      badge: <Badge variant="default">Enabled</Badge>,
      text: <p className="text-sm">Be sure to keep your screen locks private and security keys safe, so only you can use them.</p>,
      buttons: [
        <Button key={0} className="mx-10 w-24" onClick={() => handleTfaChange(false)} loading={loading}>
          Disable
        </Button>,
        <Button key={1} variant="redOutline" className="mx-10 w-24" onClick={removeTfa}>
          Remove
        </Button>,
      ],
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
        <div className="rounded-r-lg bg-card border flex items-center justify-center flex-col p-3 gap-2">{passKeyConfig?.buttons}</div>
      </div>
    </Panel>
  )
}

export default PasskeySection

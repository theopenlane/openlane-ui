'use client'

import { useNotification } from '@/hooks/useNotification'
import { setSessionCookie } from '@/lib/auth/utils/set-session-cookie'
import { getPasskeyRegOptions, verifyRegistration } from '@/lib/user'
import { startRegistration } from '@simplewebauthn/browser'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

export const useCreatePasskey = (email: string | null | undefined) => {
  const { successNotification, errorNotification } = useNotification()

  const [loading, setLoading] = useState<boolean>(false)

  const queryClient = useQueryClient()

  const handleConfigure = async () => {
    try {
      setLoading(true)

      const options = await getPasskeyRegOptions({
        email: email as string,
      })

      setSessionCookie(options.session)

      const attestationResponse = await startRegistration({
        // useAutoRegister enables Chrome's conditional passkey creation.
        // This requires stricter user-activation + privacy guarantees and
        // frequently fails with NotAllowedError in settings / multi-step flows.
        // This will cause failures if you change which passkey you want to use
        // from the initial prompt to the system prompt.
        useAutoRegister: false,
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
    } catch (err: unknown) {
      setLoading(false)
      console.error('Error during passkey creation:', err)

      if (err instanceof DOMException) {
        if (err.name === 'AbortError' || err.name === 'NotAllowedError') {
          errorNotification({ title: 'User canceled setting up Passkeys set up' })
          return
        }

        if (err.name === 'InvalidStateError') {
          errorNotification({ title: 'You have previously added a passkey using this device' })
          return
        }
      }

      errorNotification({ title: 'An error occurred while setting up your passkey' })
    }
  }

  return { handleConfigure, loading }
}

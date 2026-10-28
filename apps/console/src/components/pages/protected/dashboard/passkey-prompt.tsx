'use client'

import { getCookie } from '@/lib/auth/utils/getCookie'
import { useCreatePasskey } from '@/hooks/usePasskey'
import { useGetPasskeys } from '@/lib/graphql-hooks/passkey'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useSession } from 'next-auth/react'
import { useState } from 'react'

const PasskeyPromptDialog = () => {
  const { data: session } = useSession()
  const email = session?.user?.email
  const { handleConfigure, loading } = useCreatePasskey(email)
  const { data: passkeys, isLoading } = useGetPasskeys()
  const [isDimissed, setIsDimissed] = useState(() => getCookie('passkey-prompt') !== 'true')

  const dismiss = () => {
    document.cookie = 'passkey-prompt=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    setIsDimissed(true)
  }

  const hasPasskeys = (passkeys?.webauthns?.edges?.length ?? 0) > 0

  return (
    <ConfirmationDialog
      open={!isLoading && !hasPasskeys && !isDimissed}
      onOpenChange={(open) => !open && dismiss()}
      onConfirm={handleConfigure}
      loading={loading}
      title="Sign in faster with a passkey"
      description="Add a Passkey or security key to improve the security of your account"
      confirmationText="Create passkey"
      confirmationTextVariant="primary"
      cancellationText="Not now"
    />
  )
}

export default PasskeyPromptDialog

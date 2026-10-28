'use client'

import { getCookie } from '@/lib/auth/utils/getCookie'
import { useGetPasskeys } from '@/lib/graphql-hooks/passkey'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const PasskeyPromptDialog = () => {
  const router = useRouter()
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
      onConfirm={() => router.push('/user-settings/profile#passkeys')}
      title="Sign in faster with a passkey"
      description="Add a Passkey or security key to improve the security of your account"
      confirmationText="Create passkey"
      confirmationTextVariant="primary"
      cancellationText="Not now"
    />
  )
}

export default PasskeyPromptDialog

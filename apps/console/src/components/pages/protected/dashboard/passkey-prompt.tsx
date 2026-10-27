'use client'

import { useGetPasskeys } from '@/lib/graphql-hooks/passkey'
import { dismissPrompt, getPasskeyPromptDismissalState } from '@/lib/storage/passkey-prompt'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const PasskeyPromptDialog = ({ userId }: { userId: string }) => {
  const router = useRouter()
  const { data: passkeys, isLoading } = useGetPasskeys()
  const [isDimissed, setIsDimissed] = useState(() => getPasskeyPromptDismissalState(userId))

  const dismiss = () => {
    dismissPrompt(userId)
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

'use client'

import { PASSKEY_PROMPT_COOKIE } from '@/lib/auth/constants'
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
  const [isDismissed, setIsDismissed] = useState(false)
  const shouldPrompt = !isDismissed && !!session?.user?.userId && getCookie(PASSKEY_PROMPT_COOKIE) === session.user.userId
  const { data: passkeys, isSuccess } = useGetPasskeys(shouldPrompt)

  const dismiss = () => {
    document.cookie = `${PASSKEY_PROMPT_COOKIE}=; path=/; max-age=0;`
    setIsDismissed(true)
  }

  const hasPasskeys = (passkeys?.webauthns?.edges?.length ?? 0) > 0

  return (
    <ConfirmationDialog
      open={shouldPrompt && isSuccess && !hasPasskeys}
      onOpenChange={(open) => !open && !loading && dismiss()}
      onConfirm={async () => {
        if (await handleConfigure()) {
          dismiss()
        }
      }}
      closeOnConfirm={false}
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

'use client'

import React, { useId, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@theopenlane/ui/dialog'
import { Input } from '@theopenlane/ui/input'
import { Button } from '@theopenlane/ui/button'
import { SendHorizontal } from 'lucide-react'
import { useSendCampaignTestEmail } from '@/lib/graphql-hooks/campaign'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { isValidEmail } from '@/lib/validators'
import { Callout } from '@/components/shared/callout/callout'

const MAX_TEST_RECIPIENTS = 5

interface SendTestEmailDialogProps {
  campaignId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const SendTestEmailDialog: React.FC<SendTestEmailDialogProps> = ({ campaignId, open, onOpenChange }) => {
  const { data: session } = useSession()
  const [value, setValue] = useState<string>(session?.user?.email ?? '')
  const recipientsId = useId()

  useEffect(() => {
    if (open && session?.user?.email) setValue(session.user.email)
  }, [open, session?.user?.email])

  const { mutateAsync: sendTest, isPending } = useSendCampaignTestEmail()
  const { successNotification, errorNotification } = useNotification()

  const emails = [
    ...new Map(
      value
        .split(/[\s,;]+/)
        .filter(Boolean)
        .map((email) => [email.toLowerCase(), email]),
    ).values(),
  ]
  const exceedsLimit = emails.length > MAX_TEST_RECIPIENTS
  const hasInvalidEmail = emails.some((email) => !isValidEmail(email))
  const allValid = emails.length > 0 && !hasInvalidEmail && !exceedsLimit

  const handleSend = async () => {
    if (!allValid) return
    try {
      const result = await sendTest({ input: { campaignID: campaignId, emails } })
      const { queuedCount, skippedCount } = result.sendCampaignTestEmail
      successNotification({ title: 'Test email sent', description: `Queued ${queuedCount}${skippedCount ? `, skipped ${skippedCount}` : ''}.` })
      onOpenChange(false)
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-w-md flex-col">
        <DialogHeader>
          <DialogTitle>Send Test Email</DialogTitle>
          <p className="text-sm text-muted-foreground">Send a test email to preview how this campaign will look and make sure everything is ready.</p>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor={recipientsId}>
            Send to
          </label>
          <span className="text-xs text-muted-foreground">Enter email address(es) separated by commas</span>
          <Input id={recipientsId} value={value} onChange={(e) => setValue(e.currentTarget.value)} placeholder="you@example.com" />
          {value.trim() !== '' && hasInvalidEmail && <p className="text-xs text-red-500">Enter one or more valid email addresses.</p>}
          {exceedsLimit && <p className="text-xs text-red-500">You can send a test email to a maximum of {MAX_TEST_RECIPIENTS} recipients.</p>}
          {!hasInvalidEmail && !exceedsLimit && <p className="text-xs text-muted-foreground">Your email address is prefilled. Add other email addresses if needed.</p>}
        </div>

        <Callout variant="info" title="About test emails" compact>
          You can send a test to a maximum of {MAX_TEST_RECIPIENTS} recipients. Test emails include a special banner so recipients know this is a test, and responses from test emails are not included
          in campaign results.
        </Callout>

        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" type="button" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="primary" type="button" icon={<SendHorizontal size={16} />} iconPosition="left" onClick={handleSend} disabled={!allValid || isPending}>
            {isPending ? 'Sending...' : 'Send Test Email'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

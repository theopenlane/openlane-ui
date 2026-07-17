'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { Info, SendHorizontal } from 'lucide-react'
import { useSendCampaignTestEmail } from '@/lib/graphql-hooks/campaign'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { isValidEmail } from '@/lib/validators'

interface SendTestEmailDialogProps {
  campaignId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const SendTestEmailDialog: React.FC<SendTestEmailDialogProps> = ({ campaignId, open, onOpenChange }) => {
  const { data: session } = useSession()
  const [value, setValue] = useState<string>(session?.user?.email ?? '')

  useEffect(() => {
    if (open && session?.user?.email) setValue(session.user.email)
  }, [open, session?.user?.email])

  const { mutateAsync: sendTest, isPending } = useSendCampaignTestEmail()
  const { successNotification, errorNotification } = useNotification()

  const emails = value
    .split(/[\s,;]+/)
    .map((email) => email.trim())
    .filter(Boolean)
  const allValid = emails.length > 0 && emails.every(isValidEmail)

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
          <label className="text-sm font-medium">Send to</label>
          <span className="text-xs text-muted-foreground">Enter email address(es) separated by commas</span>
          <Input value={value} onChange={(e) => setValue(e.currentTarget.value)} placeholder="you@example.com" />
          {value.trim() !== '' && !allValid ? (
            <p className="text-xs text-red-500">Enter one or more valid email addresses.</p>
          ) : (
            <p className="text-xs text-muted-foreground">Your email address is prefilled. Add other email addresses if needed.</p>
          )}
        </div>

        <div className="flex gap-3 rounded-md border border-border bg-muted/40 p-3">
          <Info size={16} className="mt-0.5 shrink-0 text-brand" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">About test emails</span>
            <span className="text-xs text-muted-foreground">
              Test emails include a special banner so recipients know this is a test. Responses from test emails are not included in campaign results.
            </span>
          </div>
        </div>

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

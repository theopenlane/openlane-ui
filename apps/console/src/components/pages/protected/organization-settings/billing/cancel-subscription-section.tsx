'use client'
import React, { useMemo, useState } from 'react'
import { fromUnixTime } from 'date-fns'
import { ExternalLink, XIcon } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { cn } from '@repo/ui/lib/utils'
import { SUPPORT_URL } from '@/constants'
import { useNotification } from '@/hooks/useNotification'
import { useOpenBillingPortal } from '@/hooks/useBillingPortal'
import { findManageableSchedule, useCancelSubscriptionMutation, useRenewSubscriptionMutation, useSchedulesQuery } from '@/lib/query-hooks/stripe'
import { formatDate } from '@/utils/date'
import { billingSettingsStyles } from './billing-settings.styles'

type CancelSubscriptionSectionProps = {
  stripeCustomerId: string | null | undefined
  hasSubscription: boolean
}

const SupportPrompt = ({ message }: { message: string }) => (
  <>
    <p className="mt-8"> {message}</p>
    <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="mt-2 mx-auto mb-5 block">
      <Button>Contact Support</Button>
    </a>
  </>
)

const CancelSubscriptionSection = ({ stripeCustomerId, hasSubscription }: CancelSubscriptionSectionProps) => {
  const { text } = billingSettingsStyles()
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: cancelSubscription, isPending: canceling } = useCancelSubscriptionMutation()
  const { mutateAsync: renewSubscription, isPending: renewing } = useRenewSubscriptionMutation()
  const { openBillingPortal, redirecting } = useOpenBillingPortal()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const { data: schedules } = useSchedulesQuery(stripeCustomerId)
  const manageableSchedule = findManageableSchedule(schedules)
  const schedule = manageableSchedule ?? schedules?.[0]
  const scheduleStateUnknown = !!stripeCustomerId && !schedules

  const isCanceled = schedule?.end_behavior === 'cancel'
  const isTrialing = !!schedule?.phases?.[0]?.trial
  const hasEnded = schedule?.status === 'canceled' || schedule?.status === 'completed'
  const endDate = useMemo(() => (schedule?.current_phase?.end_date ? fromUnixTime(schedule.current_phase.end_date) : null), [schedule])
  const updating = canceling || renewing

  const handleConfirm = async () => {
    setConfirmOpen(false)
    if (!manageableSchedule) return

    try {
      if (isCanceled) {
        await renewSubscription({ scheduleId: manageableSchedule.id })
        successNotification({ title: 'Subscription renewed', description: 'Your subscription will continue on your current plan.' })
      } else {
        await cancelSubscription({ scheduleId: manageableSchedule.id })
        successNotification({ title: 'Subscription cancelled', description: 'You keep full access until the end of your current billing period.' })
      }
    } catch (err) {
      errorNotification({
        title: isCanceled ? 'Renewal failed' : 'Cancellation failed',
        description: err instanceof Error ? err.message : 'Please try again or reach out to support.',
      })
    }
  }

  if (isTrialing && isCanceled) {
    return <SupportPrompt message="Your trial subscription was cancelled and cannot be renewed." />
  }

  if (hasEnded) {
    return <SupportPrompt message="Your subscription has expired." />
  }

  return (
    <>
      <h2 className="text-2xl mt-8 mb-4">Cancel Subscription</h2>
      {hasSubscription && (
        <div id="cancel-subscription">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 w-full">
            <p className={cn(text())}>You can cancel your subscription anytime. Your access will remain active until the end of your billing period.</p>
          </div>
          {scheduleStateUnknown ? null : manageableSchedule ? (
            <Button
              className="self-end h-8 p-2"
              variant={isCanceled ? 'secondary' : 'destructive'}
              icon={isCanceled ? undefined : <XIcon size={16} />}
              loading={updating}
              disabled={updating}
              onClick={() => setConfirmOpen(true)}
            >
              {isCanceled ? 'Renew subscription' : 'Cancel subscription'}
            </Button>
          ) : stripeCustomerId ? (
            <Button className="self-end h-8 p-2" icon={<ExternalLink size={16} />} loading={redirecting} disabled={redirecting} onClick={() => openBillingPortal(stripeCustomerId, true)}>
              Manage subscription in Stripe
            </Button>
          ) : (
            <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500">
              Reach out to support
            </a>
          )}
        </div>
      )}

      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleConfirm}
        title={isCanceled ? 'Renew subscription?' : 'Cancel subscription?'}
        description={
          !isCanceled ? (
            <>
              <span className="block">
                Your subscription will be cancelled at the end of your current billing cycle on <b>{endDate ? formatDate(endDate.toISOString()) : 'the end date'}</b>.
              </span>
              <span className="block">Until then, you&apos;ll continue to have full access.</span>
            </>
          ) : (
            <span className="block">Your subscription will be renewed starting today.</span>
          )
        }
        confirmationText={isCanceled ? 'Renew' : 'Confirm'}
        confirmationTextVariant={isCanceled ? 'success' : 'destructive'}
      />
    </>
  )
}

export default CancelSubscriptionSection

'use client'
import React, { useMemo, useState } from 'react'
import BillingEmailDialog from './billing-email-dialog'
import BillingContactDialog from './billing-contract-dialog'
import { useOrganization } from '@/hooks/useOrganization'
import { billingSettingsStyles } from './billing-settings.styles'
import { cn } from '@repo/ui/lib/utils'
import { useGetOrganizationBilling, useGetOrganizationSetting } from '@/lib/graphql-hooks/organization'
import { useCancelSubscriptionMutation, usePaymentMethodsQuery, useRenewSubscriptionMutation, useSchedulesQuery } from '@/lib/query-hooks/stripe'
import { Button } from '@repo/ui/button'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { formatDate } from '@/utils/date'
import { SUPPORT_URL } from '@/constants'
import Invoices from './invoices'
import { Card } from '@repo/ui/cardpanel'
import { CreditCard, ExternalLink } from 'lucide-react'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

const BillingSettings: React.FC = () => {
  const { panel, section, sectionContent, emailText, paragraph, text } = billingSettingsStyles()
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const { data } = useGetOrganizationBilling(currentOrgId)
  const { data: settingData } = useGetOrganizationSetting(currentOrgId)
  const billingAddress = settingData?.organization.setting?.billingAddress
  const formattedAddress = [billingAddress?.line1, billingAddress?.city, billingAddress?.postalCode].filter(Boolean).join(', ')
  const email = settingData?.organization.setting?.billingEmail || ''
  const { mutateAsync: cancelSubscription, isPending: canceling } = useCancelSubscriptionMutation()
  const { mutateAsync: renewSubscription } = useRenewSubscriptionMutation()

  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false)

  const currentOrganization = getOrganizationByID(currentOrgId!)
  const stripeCustomerId = currentOrganization?.node?.stripeCustomerID
  const { data: schedules = [], isLoading: schedulesLoading } = useSchedulesQuery(stripeCustomerId)
  const schedule = schedules?.[0]
  const isCanceledBySchedule = schedule?.end_behavior === 'cancel'
  const { data: paymentData } = usePaymentMethodsQuery(stripeCustomerId)
  const isTrialing = !!schedule?.phases?.[0]?.trial
  const endDate = schedule?.current_phase?.end_date ? new Date(schedule.current_phase.end_date * 1000) : null
  const endDatePassed = endDate ? endDate < new Date() : false

  const defaultCard = useMemo(() => {
    return paymentData?.defaultPaymentMethod?.card ? paymentData.defaultPaymentMethod.card : paymentData?.paymentMethods?.[0]?.card
  }, [paymentData])

  const handleConfirm = async () => {
    setConfirmCancelOpen(false)
    if (!schedule) return
    if (isCanceledBySchedule) {
      await renewSubscription({ scheduleId: schedule.id })
    } else {
      await cancelSubscription({ scheduleId: schedule.id })
    }
  }

  const handleManagePayment = async () => {
    const res = await fetch('/api/stripe/create-portal-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: stripeCustomerId }),
    })

    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      console.error('❌ Portal error:', data.error)
    }
  }

  return (
    <div id="billing-settings" className={cn(panel())}>
      <div className="mt-8 mb-4 flex justify-between items-center">
        <h2 className="text-2xl">Billing Settings</h2>
      </div>

      {/* Billing Address Section */}
      <div className={cn(section(), 'border-y')}>
        <div className="flex justify-between w-full">
          <div className="flex justify-between">
            <h3>Address</h3>
          </div>
          <div className={cn(sectionContent())}>
            <div>
              <p className={cn(text())}>The address associated with the payment information on file which will be used to process your subscription fees and displayed on your invoices.</p>
              {formattedAddress ? (
                <p className={cn(paragraph())}>
                  {formattedAddress}
                  <br />
                  {`${settingData?.organization.setting?.billingAddress?.country || ''}`}
                </p>
              ) : (
                <p className="italic">No billing address provided, please update to continue your subscription</p>
              )}
            </div>
          </div>
          <BillingContactDialog />
        </div>
      </div>

      {/* Billing Email Section */}
      <div className={cn(section(), 'border-none')}>
        <div className="flex justify-between gap-4 w-full">
          <div className="flex justify-between">
            <h3>Email</h3>
          </div>
          <div className={cn(sectionContent())}>
            <div>
              <p className={cn(text())}>The email we will use to send billing account updates and subscription information.</p>
              {email ? <p className={cn(emailText())}>{email}</p> : <p className="italic">No billing email provided, please update to continue your subscription</p>}
            </div>
          </div>
          <BillingEmailDialog />
        </div>
      </div>

      {/* Payment Method Section */}
      <h2 id="payment-method" className="text-2xl mt-8 mb-4">
        Payment Method
      </h2>
      <Card className="bg-transparent p-4 flex size-fit gap-4">
        <div className="flex gap-5 items-center">
          <CreditCard size={16} />
          {paymentData?.hasPaymentMethod && defaultCard ? (
            <div className="flex-col gap-1">
              <div className="flex gap-1">
                <span>{defaultCard.brand.charAt(0).toUpperCase() + defaultCard.brand.slice(1)} </span>
                <span className="block mt-0.5">••••</span>
                <span className="block mt-0.5">••••</span>
                <span className="block mt-0.5">••••</span>
                <span className="mr-16">{defaultCard.last4}</span>
              </div>
              <span className="text-text-informational text-sm">
                Expires {String(defaultCard.exp_month).padStart(2, '0')}/{String(defaultCard.exp_year).slice(-2)}
              </span>
            </div>
          ) : (
            <p className="text-sm text-text-informational">No payment method on file</p>
          )}
        </div>
        <Button icon={<ExternalLink />} className="h-8 p-2 gap-1" onClick={handleManagePayment}>
          Manage
        </Button>
      </Card>

      {/* Invoices Section */}
      <Invoices stripeCustomerId={stripeCustomerId} />

      {/* Cancel Section */}
      {isTrialing && isCanceledBySchedule ? (
        <>
          <p className="mt-8"> Your trial subscription was cancelled and cannot be renewed.</p>
          <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="mt-2 mx-auto mb-5 block">
            <Button>Contact Support</Button>
          </a>
        </>
      ) : (
        <>
          {endDatePassed ? (
            <>
              <p className="mt-8"> Your subscription has expired.</p>
              <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="mt-2 mx-auto mb-5 block">
                <Button>Contact Support</Button>
              </a>
            </>
          ) : (
            <>
              {' '}
              <h2 className="text-2xl mt-8 mb-4">Cancel Subscription</h2>
              {data?.organization?.orgSubscriptions && data?.organization?.orgSubscriptions.length > 0 && (
                <div id="cancel-subscription">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 w-full">
                    <p className={cn(text())}>You can cancel your subscription anytime. Your access will remain active until the end of your billing period.</p>
                  </div>
                  {!schedule ? (
                    <>
                      <CancelButton
                        className="self-end h-8 p-2"
                        title={canceling ? 'Processing…' : isCanceledBySchedule ? 'Renew subscription' : 'Cancel subscription'}
                        disabled={canceling || schedulesLoading}
                        variant={isCanceledBySchedule ? 'secondary' : 'destructive'}
                        onClick={() => setConfirmCancelOpen(true)}
                      ></CancelButton>
                    </>
                  ) : (
                    <a href={`${SUPPORT_URL}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500">
                      Reach out to support
                    </a>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Cancel subscription confirmation */}
      <ConfirmationDialog
        open={confirmCancelOpen}
        onOpenChange={setConfirmCancelOpen}
        onConfirm={handleConfirm}
        title={isCanceledBySchedule ? 'Renew subscription?' : 'Cancel subscription?'}
        description={
          !isCanceledBySchedule ? (
            <>
              <p>
                Your subscription will be cancelled at the end of your current billing cycle on{' '}
                <b>{schedule?.current_phase?.end_date ? formatDate(new Date(schedule.current_phase.end_date * 1000).toISOString()) : 'the end date'}</b>.
              </p>
              <p>Until then, you&apos;ll continue to have full access.</p>
            </>
          ) : (
            <p>Your subscription will be renewed starting today.</p>
          )
        }
        confirmationText={isCanceledBySchedule ? 'Renew' : 'Confirm'}
        confirmationTextVariant={isCanceledBySchedule ? 'success' : 'destructive'}
      />
    </div>
  )
}

export default BillingSettings

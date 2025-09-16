'use client'
import React, { useState } from 'react'
import BillingEmailDialog from './billing-email-dialog'
import BillingContactDialog from './billing-contract-dialog'
import { useOrganization } from '@/hooks/useOrganization'
import { billingSettingsStyles } from './billing-settings.styles'
import { cn } from '@repo/ui/lib/utils'
import { useGetOrganizationBilling, useGetOrganizationSetting } from '@/lib/graphql-hooks/organization'
import { useCancelSubscriptionMutation, useSchedulesQuery } from '@/lib/query-hooks/stripe'
import { Button } from '@repo/ui/button'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { formatDate } from '@/utils/date'

const BillingSettings: React.FC = () => {
  const { panel, section, sectionContent, sectionTitle, emailText, paragraph, text } = billingSettingsStyles()
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const { data } = useGetOrganizationBilling(currentOrgId)
  const { data: settingData } = useGetOrganizationSetting(currentOrgId)
  const billingAddress = settingData?.organization.setting?.billingAddress
  const formattedAddress = [billingAddress?.line1, billingAddress?.city, billingAddress?.postalCode].filter(Boolean).join(', ')
  const email = settingData?.organization.setting?.billingEmail || ''
  const { mutateAsync: cancelSubscription, isPending: canceling } = useCancelSubscriptionMutation()
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false)

  const currentOrganization = getOrganizationByID(currentOrgId!)
  const stripeCustomerId = currentOrganization?.node?.stripeCustomerID
  const { data: schedules = [], isLoading: schedulesLoading } = useSchedulesQuery(stripeCustomerId)
  const schedule = schedules?.[0]
  const isCanceledBySchedule = schedule?.end_behavior === 'cancel'

  const handleCancelSub = async () => {
    if (!schedule) return
    await cancelSubscription({ scheduleId: schedule.id })
  }

  return (
    <div className={cn(panel())}>
      <div className="flex justify-between">
        <h2 className="text-2xl font-semibold text-text-header">Billing Settings</h2>
        <Button
          className="h-8 p-2"
          variant="outline"
          onClick={async () => {
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
          }}
        >
          Manage Payment Details
        </Button>
      </div>

      {/* Billing Address Section */}
      <div className={cn(section())}>
        <div className="flex gap-10 w-full">
          <h3 className={cn(sectionTitle())}>Billing Address</h3>
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
            <BillingContactDialog />
          </div>
        </div>
      </div>

      {/* Billing Email Section */}
      <div className={cn(section())}>
        <div className="flex gap-10 w-full">
          <h3 className={cn(sectionTitle())}>Billing Email</h3>
          <div className={cn(sectionContent())}>
            <div>
              <p className={cn(text())}>The email we will use to send billing account updates and subscription information.</p>
              {email ? <p className={cn(emailText())}>{email}</p> : <p className="italic">No billing email provided, please update to continue your subscription</p>}
            </div>
            <BillingEmailDialog />
          </div>
        </div>
      </div>

      {/* Cancel Section */}
      {data?.organization?.orgSubscriptions && data?.organization?.orgSubscriptions.length > 0 && (
        <div className={cn(section())}>
          <div className="flex gap-10 w-full items-start">
            <h3 className={cn(sectionTitle())}>Cancel Subscription</h3>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 w-full">
              <p className={cn(text())}>You can cancel your subscription anytime. Your access will remain active until the end of your billing period.</p>

              <Button variant="destructive" disabled={canceling || schedulesLoading || !schedule || isCanceledBySchedule} onClick={() => setConfirmCancelOpen(true)}>
                {canceling ? 'Cancelling…' : isCanceledBySchedule ? 'Cancellation scheduled' : 'Cancel Subscription'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Cancel subscription confirmation */}
      <ConfirmationDialog
        open={confirmCancelOpen}
        onOpenChange={setConfirmCancelOpen}
        onConfirm={async () => {
          setConfirmCancelOpen(false)
          await handleCancelSub()
        }}
        title="Cancel subscription?"
        description={
          <>
            <p>
              Your subscription will be cancelled at the end of your current billing cycle on{' '}
              <b>{schedule?.current_phase?.end_date ? formatDate(new Date(schedule.current_phase.end_date * 1000).toISOString()) : 'the end date'}</b>.
            </p>
            <p>Until then, you’ll continue to have full access.</p>
          </>
        }
        confirmationText="Confirm"
        confirmationTextVariant="destructive"
      />
    </div>
  )
}

export default BillingSettings

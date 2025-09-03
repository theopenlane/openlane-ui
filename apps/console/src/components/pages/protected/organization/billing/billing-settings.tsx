'use client'
import React from 'react'
import BillingEmailDialog from './billing-email-dialog'
import BillingContactDialog from './billing-contract-dialog'
import { useOrganization } from '@/hooks/useOrganization'
import { billingSettingsStyles } from './billing-settings.styles'
import { cn } from '@repo/ui/lib/utils'
import { useGetOrganizationBilling, useGetOrganizationSetting } from '@/lib/graphql-hooks/organization'
import { ExternalLink } from 'lucide-react'

const BillingSettings: React.FC = () => {
  const { panel, section, sectionContent, sectionTitle, emailText, paragraph, text } = billingSettingsStyles()
  const { currentOrgId } = useOrganization()
  const { data } = useGetOrganizationBilling(currentOrgId)
  const { data: settingData } = useGetOrganizationSetting(currentOrgId)
  const billingAddress = settingData?.organization.setting?.billingAddress
  const formattedAddress = [billingAddress?.line1, billingAddress?.city, billingAddress?.postalCode].filter(Boolean).join(', ')
  const email = settingData?.organization.setting?.billingEmail || ''

  return (
    <div className={cn(panel())}>
      <h2 className="text-2xl font-semibold text-text-header">Billing Settings</h2>

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
              <a href={data?.organization?.orgSubscriptions?.[0].cancellation ?? '#'} target="_blank" rel="noopener noreferrer" className="text-brand inline-flex items-center">
                {' '}
                Cancel <ExternalLink size={16} className="ml-1" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BillingSettings

'use client'
import React from 'react'
import { Panel } from '@repo/ui/panel'
import { Switch } from '@repo/ui/switch'
import BillingEmailDialog from './billing-email-dialog'
import BillingContactDialog from './billing-contract-dialog'
import { useOrganization } from '@/hooks/useOrganization'
import { billingSettingsStyles } from './billing-settings.styles'
import { cn } from '@repo/ui/lib/utils'

const BillingSettings: React.FC = () => {
  const { panel, section, sectionContent, sectionTitle, emailText, paragraph, switchContainer, text } = billingSettingsStyles()
  const { currentOrg } = useOrganization()
  const billingAddress = currentOrg?.setting?.billingAddress || {}
  const formattedAddress = [billingAddress.line1, billingAddress.city, billingAddress.postalCode].filter(Boolean).join(', ')
  const email = currentOrg?.setting?.billingEmail || ''
  return (
    <Panel className={cn(panel())}>
      <h2 className="text-2xl font-semibold text-text-header">Billing Settings</h2>

      <div className={cn(section())}>
        <div className="flex gap-10 w-full">
          <h3 className={cn(sectionTitle())}>Billing Address</h3>
          <div className={cn(sectionContent())}>
            <div>
              <p className={cn(text())}>The address associated with the payment information on file which will be used to process your subscription fees and displayed on your invoices.</p>
              <p className={cn(paragraph())}>
                {formattedAddress}
                <br />
                {`${currentOrg?.setting?.billingAddress.country || ''}`}
              </p>
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
              <p className={cn(text())}>The email we will use to send billing account updates and subscription information</p>
              <p className={cn(emailText())}>{email}</p>
            </div>
            <BillingEmailDialog />
          </div>
        </div>
      </div>

      {/* Billing Alert Section */}
      <div className={cn(section())}>
        <div className="flex gap-10 w-full">
          <h3 className={cn(sectionTitle())}>Billing Alert</h3>
          <div className={cn(switchContainer())}>
            <p className={cn(text())}>Set up automated billing alerts to receive emails when a specified usage amount is reached for spend across your entire team.</p>
            <Switch />
          </div>
        </div>
      </div>
    </Panel>
  )
}

export default BillingSettings

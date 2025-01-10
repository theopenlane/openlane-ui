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

      {/* Billing Contact Section */}
      <div className={cn(section())}>
        <div className="flex gap-10 w-full">
          <h3 className={cn(sectionTitle())}>Billing Contact</h3>
          <div className={cn(sectionContent())}>
            <div>
              <p className={cn(text())}>This address appears on your monthly invoice and should be the legal address of your home or business.</p>
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
              <p className={cn(text())}>Lorem ipsum is the text</p>
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

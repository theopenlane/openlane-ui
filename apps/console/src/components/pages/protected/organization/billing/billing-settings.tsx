'use client'
import React, { useState } from 'react'
import { Panel } from '@repo/ui/panel'
import { Switch } from '@repo/ui/switch'
import BillingEmailDialog from './billing-email-dialog'
import BillingContactDialog from './billing-contract-dialog'
import { useOrganization } from '@/hooks/useOrganization'
import { billingSettingsStyles } from './billing-settings.styles'
import { cn } from '@repo/ui/lib/utils'
import { useGetOrganizationSettingQuery, useUpdateOrganizationMutation } from '@repo/codegen/src/schema'
import { toast } from '@repo/ui/use-toast'

const BillingSettings: React.FC = () => {
  const { panel, section, sectionContent, sectionTitle, emailText, paragraph, switchContainer, text } = billingSettingsStyles()
  const { currentOrgId } = useOrganization()
  const [settingData] = useGetOrganizationSettingQuery({ pause: !currentOrgId, variables: { organizationId: currentOrgId } })
  const [{ fetching: isSubmitting }, updateOrg] = useUpdateOrganizationMutation()
  const billingAddress = settingData.data?.organization.setting?.billingAddress
  const formattedAddress = [billingAddress?.line1, billingAddress?.city, billingAddress?.postalCode].filter(Boolean).join(', ')
  const email = settingData.data?.organization.setting?.billingEmail || ''

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(settingData.data?.organization.setting?.billingNotificationsEnabled || false)

  const onToggleNotifications = async (checked: boolean) => {
    setNotificationsEnabled(checked)

    try {
      await updateOrg({
        updateOrganizationId: currentOrgId,
        input: {
          updateOrgSettings: { billingNotificationsEnabled: checked },
        },
      })
      toast({
        title: `Billing alerts successfully turned ${checked ? 'on' : 'off'}`,
        variant: 'success',
      })
    } catch (error) {
      console.error('Error updating billing notifications:', error)
      setNotificationsEnabled(!checked)
      toast({
        title: `Something went wrong with turning ${checked ? 'on' : 'off'} the billing alerts!`,
        variant: 'destructive',
      })
    }
  }

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
                  {`${settingData.data?.organization.setting?.billingAddress?.country || ''}`}
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

      {/* Billing Alert Section */}
      <div className={cn(section())}>
        <div className="flex gap-10 w-full">
          <h3 className={cn(sectionTitle())}>Billing Alert</h3>
          <div className={cn(switchContainer())}>
            <p className={cn(text())}>Set up automated billing alerts to receive emails when a specified usage amount is reached for spend across your entire team.</p>
            <Switch checked={notificationsEnabled} onCheckedChange={onToggleNotifications} disabled={isSubmitting} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default BillingSettings

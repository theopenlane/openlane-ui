'use client'
import React from 'react'
import { Panel } from '@repo/ui/panel'
import { Switch } from '@repo/ui/switch'
import BillingEmailDialog from './billing-email-dialog'
import BillingContactDialog from './billing-contract-dialog'
import { useOrganization } from '@/hooks/useOrganization'

const BillingSettings: React.FC = () => {
  const { currentOrg } = useOrganization()
  const billingAddress = currentOrg?.setting?.billingAddress || {}
  const formattedAddress = [billingAddress.line1, billingAddress.city, billingAddress.postalCode].filter(Boolean).join(', ')
  return (
    <Panel className="p-6">
      <h2 className="text-2xl font-semibold text-text-header">Billing Settings</h2>

      {/* Billing Contact Section */}
      <div className="flex justify-between items-start py-6 border-b border-gray-300">
        <div className="flex gap-10 w-full">
          <h3 className="text-xl font-medium text-text-header w-1/5">Billing Contact</h3>
          <div className="flex justify-between w-full gap-4">
            <div>
              <p className="text-sm mt-1">This address appears on your monthly invoice and should be the legal address of your home or business.</p>
              <p className="text-text-paragraph text-sm">
                {formattedAddress}
                <br />
                {`${currentOrg?.setting?.billingAddress.country}`}
              </p>
            </div>
            <BillingContactDialog />
          </div>
        </div>
      </div>

      {/* Billing Email Section */}
      <div className="flex justify-between items-start py-6 border-b border-gray-300">
        <div className="flex gap-10 w-full">
          <h3 className="text-xl font-medium text-text-header w-1/5">Billing Email</h3>
          <div className="flex justify-between w-full gap-4">
            <div>
              <p className="text-sm mt-1">Lorem ipsum is the text</p>
              <p className="mt-2 text-text-paragraph font-medium">sfunk@theopenlane.io</p>
            </div>
            <BillingEmailDialog />
          </div>
        </div>
      </div>

      {/* Billing Alert Section */}
      <div className="flex justify-between items-start py-6">
        <div className="flex gap-10 w-full">
          <h3 className="text-xl font-medium text-text-header w-1/5">Billing Alert</h3>
          <div className="flex justify-between w-full gap-4">
            <p className="text-sm mt-1">Set up automated billing alerts to receive emails when a specified usage amount is reached for spend across your entire team.</p>
            <Switch />
          </div>
        </div>
      </div>
    </Panel>
  )
}

export default BillingSettings

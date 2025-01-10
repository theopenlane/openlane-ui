import React from 'react'
import { formatRelative } from 'date-fns'
import { InfoPanel, InfoPanelSection } from '@/components/shared/info-panel/info-panel'
type PolicyInfoBarProps = {
  status?: string | null | undefined
  version?: string | null | undefined
  policyType?: string | null | undefined
  updatedAt?: string | null | undefined
}

export const PolicyInfoBar: React.FC<PolicyInfoBarProps> = React.memo(({ status, version, policyType, updatedAt }) => {
  console.log('PolicyInfoBar', { status, version, policyType, updatedAt })
  return (
    <InfoPanel className="border-0 my-5">
      <InfoPanelSection heading="Status">{status}</InfoPanelSection>
      <InfoPanelSection heading="Version">{version}</InfoPanelSection>
      <InfoPanelSection heading="Policy Type">{policyType}</InfoPanelSection>
      {updatedAt && (
        <InfoPanelSection heading="Last Updated">
          {!!updatedAt && formatRelative(updatedAt, new Date())}
        </InfoPanelSection>
      )}
    </InfoPanel>
  )
})

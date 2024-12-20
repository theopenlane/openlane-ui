import { formatRelative } from 'date-fns'
import { InfoPanel, InfoPanelSection } from '@/components/shared/info-panel/info-panel'

type PolicyInfoBarProps = {
  policy: {
    status?: string | null | undefined
    version?: string | null | undefined
    policyType?: string | null | undefined
    updatedAt?: string | null | undefined
    updatedBy?: string | null | undefined
  }
}

export const PolicyInfoBar: React.FC<PolicyInfoBarProps> = ({ policy }) => {
  return (
    <InfoPanel className="border-0 my-5">
      <InfoPanelSection heading="Status">{policy.status || 'Review'}</InfoPanelSection>
      <InfoPanelSection heading="Version">{policy.version || '1.0.0'}</InfoPanelSection>
      <InfoPanelSection heading="Policy Type">{policy.policyType}</InfoPanelSection>
      <InfoPanelSection heading="Last Updated">{policy.updatedAt && formatRelative(policy.updatedAt, new Date())} by John Adams</InfoPanelSection>
    </InfoPanel>
  )
}

import { formatRelative } from 'date-fns'
import { InfoPanel, InfoPanelSection } from '@/components/shared/info-panel/info-panel'
import { usePolicyPageStore } from '@/hooks/usePolicyPage'
import { useShallow } from 'zustand/react/shallow'

type PolicyInfoBarProps = {
  policy: {
    status?: string | null | undefined
    version?: string | null | undefined
    policyType?: string | null | undefined
    updatedAt?: string | null | undefined
    updatedBy?: string | null | undefined
  }
}

export const PolicyInfoBar: React.FC<PolicyInfoBarProps> = () => {
  const { status, version, policyType, updatedAt } = usePolicyPageStore(
    useShallow((state) => {
      const { status, version, policyType, updatedAt } = state.policy
      return { status, version, policyType, updatedAt }
    }),
  )

  return (
    <InfoPanel className="border-0 my-5">
      <InfoPanelSection heading="Status">{status || 'Review'}</InfoPanelSection>
      <InfoPanelSection heading="Version">{version || '1.0.0'}</InfoPanelSection>
      <InfoPanelSection heading="Policy Type">{policyType}</InfoPanelSection>
      <InfoPanelSection heading="Last Updated">
        {updatedAt && formatRelative(updatedAt, new Date())} by John Adams
      </InfoPanelSection>
    </InfoPanel>
  )
}

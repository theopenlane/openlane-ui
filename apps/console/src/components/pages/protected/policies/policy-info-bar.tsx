import React from 'react'
import { formatRelative } from 'date-fns'
import { InfoPanel, InfoPanelSection } from '@/components/shared/info-panel/info-panel'
import { Button } from '@repo/ui/button'
import { UpdateInternalPolicyValidator } from '@/components/pages/protected/policies/policy-page'
import { InternalPolicyByIdFragment } from '@repo/codegen/src/schema'

type PolicyInfoBarProps = {
  policy: InternalPolicyByIdFragment
  handleSave: () => void
}

export const PolicyInfoBar: React.FC<PolicyInfoBarProps> = React.memo(({ policy, handleSave }) => {
  console.log('PolicyInfoBar', { policy })

  const { success: isValid, error: validationMessage } = UpdateInternalPolicyValidator.safeParse(policy)

  return (
    <InfoPanel className="border-0 my-5 ">
      <InfoPanelSection heading="Status">{policy.status}</InfoPanelSection>
      <InfoPanelSection heading="Version">{policy.version}</InfoPanelSection>
      <InfoPanelSection heading="Policy Type">{policy.policyType}</InfoPanelSection>
      {policy.updatedAt && (
        <InfoPanelSection heading="Last Updated">
          {!!policy.updatedAt && formatRelative(policy.updatedAt, new Date())}
        </InfoPanelSection>
      )}

      <Button disabled={!isValid} onClick={handleSave}>
        Save
      </Button>
    </InfoPanel>
  )
})

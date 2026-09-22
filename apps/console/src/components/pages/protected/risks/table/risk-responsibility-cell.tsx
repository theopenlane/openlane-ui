import React, { useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { type RiskTableFieldsFragment, type UpdateRiskInput } from '@repo/codegen/src/schema'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useUpdateRisk } from '@/lib/graphql-hooks/risk'
import { useNotification } from '@/hooks/useNotification'
import { ResponsibilityField } from '@/components/shared/crud-base/form-fields/responsibility-field'
import { normalizeResponsibilityField } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { RISK_STAKEHOLDER, RISK_DELEGATE } from '../risk-responsibility'

const RISK_RESPONSIBILITY_TARGETS = {
  stakeholder: RISK_STAKEHOLDER,
  delegate: RISK_DELEGATE,
}

export type RiskResponsibilityFieldName = keyof typeof RISK_RESPONSIBILITY_TARGETS

type TRiskResponsibilityCellProps = {
  risk: RiskTableFieldsFragment
  field: RiskResponsibilityFieldName
  isEditAllowed?: boolean
}

const RiskResponsibilityCell: React.FC<TRiskResponsibilityCellProps> = ({ risk, field, isEditAllowed = true }) => {
  const target = RISK_RESPONSIBILITY_TARGETS[field]
  const { mutateAsync: updateRisk } = useUpdateRisk()
  const { successNotification, errorNotification } = useNotification()
  const [internalEditing, setInternalEditing] = useState<string | null>(null)

  const values = useMemo(() => {
    const source =
      field === 'stakeholder'
        ? { user: risk.stakeholderUser, group: risk.stakeholderGroup, personnel: risk.stakeholderIdentityHolder, stringValue: risk.stakeholderName }
        : { user: risk.delegateUser, group: risk.delegateGroup, personnel: risk.delegateIdentityHolder, stringValue: risk.delegateName }
    return { [field]: normalizeResponsibilityField(source) }
  }, [field, risk.stakeholderUser, risk.stakeholderGroup, risk.stakeholderIdentityHolder, risk.stakeholderName, risk.delegateUser, risk.delegateGroup, risk.delegateIdentityHolder, risk.delegateName])

  const form = useForm({ values })

  const handleUpdate = async (input: UpdateRiskInput) => {
    try {
      await updateRisk({ updateRiskId: risk.id, input })
      successNotification({ title: 'Risk updated', description: 'Risk has been successfully updated.' })
    } catch (err) {
      form.reset()
      errorNotification({ title: 'Error', description: parseErrorMessage(err) })
    }
  }

  return (
    <FormProvider {...form}>
      <div role="presentation" onClick={(e) => e.stopPropagation()}>
        <ResponsibilityField
          name={field}
          fieldBaseName={target.fieldBaseName}
          stringFieldName={target.stringFieldName}
          label=""
          isEditing={false}
          isEditAllowed={isEditAllowed}
          internalEditing={internalEditing}
          setInternalEditing={setInternalEditing}
          handleUpdate={handleUpdate}
        />
      </div>
    </FormProvider>
  )
}

export default RiskResponsibilityCell

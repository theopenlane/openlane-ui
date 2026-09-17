import React, { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { type RiskTableFieldsFragment, type UpdateRiskInput } from '@repo/codegen/src/schema'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useUpdateRisk } from '@/lib/graphql-hooks/risk'
import { useNotification } from '@/hooks/useNotification'
import { ResponsibilityField } from '@/components/shared/crud-base/form-fields/responsibility-field'
import { normalizeResponsibilityField } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'

const DelegateCell: React.FC<{ risk: RiskTableFieldsFragment }> = ({ risk }) => {
  const { mutateAsync: updateRisk } = useUpdateRisk()
  const { successNotification, errorNotification } = useNotification()
  const [internalEditing, setInternalEditing] = useState<string | null>(null)
  const form = useForm({
    values: { delegate: normalizeResponsibilityField({ user: risk.delegateUser, group: risk.delegateGroup, personnel: risk.delegateIdentityHolder, stringValue: risk.delegateName }) },
  })

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
          name="delegate"
          fieldBaseName="delegate"
          label=""
          isEditing={false}
          isEditAllowed
          internalEditing={internalEditing}
          setInternalEditing={setInternalEditing}
          handleUpdate={handleUpdate}
        />
      </div>
    </FormProvider>
  )
}

export default DelegateCell

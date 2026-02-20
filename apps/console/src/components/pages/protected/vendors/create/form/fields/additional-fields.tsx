'use client'

import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { CheckboxField } from '@/components/shared/crud-base/form-fields/checkbox-field'
import { NumberField } from '@/components/shared/crud-base/form-fields/number-field'
import { EntityQuery, UpdateEntityInput } from '@repo/codegen/src/schema'
import { InternalEditingType } from '@/components/shared/crud-base/generic-sheet'
import { EnumOptions } from '../../../table/types'

interface AdditionalFieldsProps {
  isEditing: boolean
  isEditAllowed: boolean
  isCreate?: boolean
  data?: EntityQuery['entity'] | undefined
  internalEditing: string | null
  setInternalEditing: InternalEditingType
  handleUpdateField?: (input: UpdateEntityInput) => Promise<void>
  enumOptions: EnumOptions
}

export const AdditionalFields: React.FC<AdditionalFieldsProps> = ({ isEditing, isEditAllowed, isCreate = false, data, internalEditing, setInternalEditing, handleUpdateField, enumOptions }) => {
  const sharedFieldProps = {
    isEditing,
    isEditAllowed,
    isCreate,
    data,
    internalEditing,
    setInternalEditing,
    handleUpdate: handleUpdateField,
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <TextField name="displayName" label="Display Name" {...sharedFieldProps} />

      <TextField name="description" label="Description" {...sharedFieldProps} />

      <SelectField name="status" label="Status" {...sharedFieldProps} options={enumOptions.entityStatusOptions} />

      <SelectField name="entityRelationshipStateName" label="Relationship State" {...sharedFieldProps} options={enumOptions.entityRelationshipStateOptions} />

      <SelectField name="entitySecurityQuestionnaireStatusName" label="Security Questionnaire Status" {...sharedFieldProps} options={enumOptions.securityQuestionnaireStatusOptions} />

      <SelectField name="entitySourceTypeName" label="Source Type" {...sharedFieldProps} options={enumOptions.sourceTypeOptions} />

      <SelectField name="environmentName" label="Environment" {...sharedFieldProps} options={enumOptions.environmentOptions} />

      <SelectField name="scopeName" label="Scope" {...sharedFieldProps} options={enumOptions.scopeOptions} />

      <TextField name="internalOwner" label="Internal Owner" {...sharedFieldProps} />

      <TextField name="reviewedBy" label="Reviewed By" {...sharedFieldProps} />

      <SelectField name="reviewFrequency" label="Review Frequency" {...sharedFieldProps} options={enumOptions.reviewFrequencyOptions} />

      <TextField name="lastReviewedAt" label="Last Reviewed At" type="date" {...sharedFieldProps} />

      <TextField name="nextReviewAt" label="Next Review At" type="date" {...sharedFieldProps} />

      <TextField name="billingModel" label="Billing Model" {...sharedFieldProps} />

      <NumberField name="annualSpend" label="Annual Spend" {...sharedFieldProps} />

      <TextField name="spendCurrency" label="Spend Currency" {...sharedFieldProps} />

      <TextField name="contractStartDate" label="Contract Start Date" type="date" {...sharedFieldProps} />

      <TextField name="contractEndDate" label="Contract End Date" type="date" {...sharedFieldProps} />

      <TextField name="contractRenewalAt" label="Contract Renewal At" type="date" {...sharedFieldProps} />

      <CheckboxField name="autoRenews" label="Auto Renews" {...sharedFieldProps} />

      <NumberField name="terminationNoticeDays" label="Termination Notice Days" {...sharedFieldProps} />

      <TextField name="tier" label="Tier" {...sharedFieldProps} />

      <TextField name="riskRating" label="Risk Rating" {...sharedFieldProps} />

      <NumberField name="riskScore" label="Risk Score" {...sharedFieldProps} />

      <TextField name="renewalRisk" label="Renewal Risk" {...sharedFieldProps} />

      <CheckboxField name="approvedForUse" label="Approved For Use" {...sharedFieldProps} />

      <CheckboxField name="mfaSupported" label="MFA Supported" {...sharedFieldProps} />

      <CheckboxField name="mfaEnforced" label="MFA Enforced" {...sharedFieldProps} />

      <CheckboxField name="ssoEnforced" label="SSO Enforced" {...sharedFieldProps} />

      <CheckboxField name="hasSoc2" label="Has SOC 2" {...sharedFieldProps} />

      <TextField name="soc2PeriodEnd" label="SOC 2 Period End" type="date" {...sharedFieldProps} />

      <TextField name="statusPageURL" label="Status Page URL" {...sharedFieldProps} />
    </div>
  )
}

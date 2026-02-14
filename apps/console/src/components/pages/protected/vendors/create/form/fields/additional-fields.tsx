'use client'

import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { DateTimeField } from '@/components/shared/crud-base/form-fields/datetime-field'
import { CheckboxField } from '@/components/shared/crud-base/form-fields/checkbox-field'
import { NumberField } from '@/components/shared/crud-base/form-fields/number-field'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { EntityFrequency, EntityQuery } from '@repo/codegen/src/schema'
import { InternalEditingType } from '@/components/shared/crud-base/generic-sheet'

interface AdditionalFieldsProps {
  isEditing: boolean
  isEditAllowed: boolean
  isCreate?: boolean
  data?: EntityQuery['entity'] | undefined
  internalEditing: string | null
  setInternalEditing: InternalEditingType
}

export const AdditionalFields: React.FC<AdditionalFieldsProps> = ({ isEditing, isEditAllowed, isCreate = false, data, internalEditing, setInternalEditing }) => {
  const { enumOptions: entityRelationshipStateOptions } = useGetCustomTypeEnums({
    where: { objectType: 'entity', field: 'entityRelationshipState' },
  })

  const { enumOptions: securityQuestionnaireStatusOptions } = useGetCustomTypeEnums({
    where: { objectType: 'entity', field: 'entitySecurityQuestionnaireStatus' },
  })

  const { enumOptions: sourceTypeOptions } = useGetCustomTypeEnums({
    where: { objectType: 'entity', field: 'entitySourceType' },
  })

  const { enumOptions: environmentOptions } = useGetCustomTypeEnums({
    where: { objectType: 'entity', field: 'environment' },
  })

  const { enumOptions: scopeOptions } = useGetCustomTypeEnums({
    where: { objectType: 'entity', field: 'scope' },
  })

  const reviewFrequencyOptions = Object.values(EntityFrequency).map((value) => ({
    value,
    label: getEnumLabel(value as string),
  }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <TextField
        name="displayName"
        label="Display Name"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        placeholder="Enter display name"
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <TextField
        name="description"
        label="Description"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        placeholder="Enter description"
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <TextField
        name="status"
        label="Status"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        placeholder="Enter status"
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <SelectField
        name="entityRelationshipStateName"
        label="Relationship State"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        options={entityRelationshipStateOptions}
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <SelectField
        name="entitySecurityQuestionnaireStatusName"
        label="Security Questionnaire Status"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        options={securityQuestionnaireStatusOptions}
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <SelectField
        name="entitySourceTypeName"
        label="Source Type"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        options={sourceTypeOptions}
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <SelectField
        name="environmentName"
        label="Environment"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        options={environmentOptions}
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <SelectField
        name="scopeName"
        label="Scope"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        options={scopeOptions}
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <TextField
        name="internalOwner"
        label="Internal Owner"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        placeholder="Enter internal owner"
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <TextField
        name="reviewedBy"
        label="Reviewed By"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        placeholder="Enter reviewer"
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <SelectField
        name="reviewFrequency"
        label="Review Frequency"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        options={reviewFrequencyOptions}
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <DateTimeField
        name="lastReviewedAt"
        label="Last Reviewed At"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <DateTimeField
        name="nextReviewAt"
        label="Next Review At"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <TextField
        name="billingModel"
        label="Billing Model"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        placeholder="Enter billing model"
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <NumberField
        name="annualSpend"
        label="Annual Spend"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        placeholder="Enter annual spend"
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <TextField
        name="spendCurrency"
        label="Spend Currency"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        placeholder="Enter currency (e.g., USD)"
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <DateTimeField
        name="contractStartDate"
        label="Contract Start Date"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <DateTimeField
        name="contractEndDate"
        label="Contract End Date"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <DateTimeField
        name="contractRenewalAt"
        label="Contract Renewal At"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <CheckboxField
        name="autoRenews"
        label="Auto Renews"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <NumberField
        name="terminationNoticeDays"
        label="Termination Notice Days"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        placeholder="Enter number of days"
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <TextField
        name="tier"
        label="Tier"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        placeholder="Enter tier"
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <TextField
        name="riskRating"
        label="Risk Rating"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        placeholder="Enter risk rating"
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <NumberField
        name="riskScore"
        label="Risk Score"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        placeholder="Enter risk score"
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <TextField
        name="renewalRisk"
        label="Renewal Risk"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        placeholder="Enter renewal risk"
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <CheckboxField
        name="approvedForUse"
        label="Approved For Use"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <CheckboxField
        name="mfaSupported"
        label="MFA Supported"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <CheckboxField
        name="mfaEnforced"
        label="MFA Enforced"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <CheckboxField
        name="ssoEnforced"
        label="SSO Enforced"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <CheckboxField
        name="hasSoc2"
        label="Has SOC 2"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <DateTimeField
        name="soc2PeriodEnd"
        label="SOC 2 Period End"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <TextField
        name="statusPageURL"
        label="Status Page URL"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        placeholder="Enter status page URL"
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />
    </div>
  )
}

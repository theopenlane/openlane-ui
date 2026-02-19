'use client'

import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { UpdateAssetInput } from '@repo/codegen/src/schema'
import { FieldValues } from 'react-hook-form'
import { InternalEditingType } from '@/components/shared/crud-base/generic-sheet'
import { EnumOptions } from '../../../table/types'

interface AdditionalFieldsProps {
  isEditing: boolean
  isEditAllowed: boolean
  isCreate?: boolean
  data?: FieldValues | undefined
  internalEditing: string | null
  setInternalEditing: InternalEditingType
  handleUpdateField?: (input: UpdateAssetInput) => Promise<void>
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
      <SelectField name="assetType" label="Type" options={enumOptions.assetTypeOptions} {...sharedFieldProps} />

      <SelectField name="assetSubtypeName" label="Subtype" options={enumOptions.assetSubtypeOptions} {...sharedFieldProps} />

      <SelectField name="environmentName" label="Environment" options={enumOptions.environmentOptions} {...sharedFieldProps} />

      <SelectField name="criticalityName" label="Criticality" options={enumOptions.criticalityOptions} {...sharedFieldProps} />

      <SelectField name="sourceType" label="Source Type" options={enumOptions.assetSourceTypeOptions} {...sharedFieldProps} />

      <TextField name="sourceIdentifier" label="Source Identifier" {...sharedFieldProps} />

      <SelectField name="scopeName" label="Scope" options={enumOptions.scopeOptions} {...sharedFieldProps} />

      <TextField name="identifier" label="Identifier" {...sharedFieldProps} />

      <TextField name="physicalLocation" label="Physical Location" {...sharedFieldProps} />

      <TextField name="region" label="Region" {...sharedFieldProps} />

      <SelectField name="assetDataClassificationName" label="Data Classification" options={enumOptions.assetDataClassificationOptions} {...sharedFieldProps} />

      <SelectField name="securityTierName" label="Security Tier" options={enumOptions.securityTierOptions} {...sharedFieldProps} />

      <SelectField name="encryptionStatusName" label="Encryption Status" options={enumOptions.encryptionStatusOptions} {...sharedFieldProps} />

      <SelectField name="accessModelName" label="Access Model" options={enumOptions.accessModelOptions} {...sharedFieldProps} />

      <TextField name="costCenter" label="Cost Center" {...sharedFieldProps} />

      <TextField name="cpe" label="CPE (Common Platform Enumeration)" {...sharedFieldProps} />

      <TextField name="estimatedMonthlyCost" label="Estimated Monthly Cost" type="number" {...sharedFieldProps} />

      <TextField name="purchaseDate" label="Purchase Date" type="date" {...sharedFieldProps} />

      <TextField name="website" label="Website" type="text" {...sharedFieldProps} />
    </div>
  )
}

'use client'

import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { AssetAssetType, AssetSourceType } from '@repo/codegen/src/schema'
import { FieldValues } from 'react-hook-form'
import { InternalEditingType } from '@/components/shared/crud-base/generic-sheet'

interface AdditionalFieldsProps {
  isEditing: boolean
  isEditAllowed: boolean
  isCreate?: boolean
  data?: FieldValues | undefined
  internalEditing: string | null
  setInternalEditing: InternalEditingType
}

export const AdditionalFields: React.FC<AdditionalFieldsProps> = ({ isEditing, isEditAllowed, isCreate = false, data, internalEditing, setInternalEditing }) => {
  // Fetch enum options for dropdowns
  const { enumOptions: accessModelOptions } = useGetCustomTypeEnums({
    where: { objectType: 'asset', field: 'accessModel' },
  })

  const { enumOptions: assetDataClassificationOptions } = useGetCustomTypeEnums({
    where: { objectType: 'asset', field: 'assetDataClassification' },
  })

  const { enumOptions: assetSubtypeOptions } = useGetCustomTypeEnums({
    where: { objectType: 'asset', field: 'assetSubtype' },
  })

  const { enumOptions: criticalityOptions } = useGetCustomTypeEnums({
    where: { objectType: 'asset', field: 'criticality' },
  })

  const { enumOptions: encryptionStatusOptions } = useGetCustomTypeEnums({
    where: { objectType: 'asset', field: 'encryptionStatus' },
  })

  const { enumOptions: environmentOptions } = useGetCustomTypeEnums({
    where: { objectType: 'asset', field: 'environment' },
  })

  const { enumOptions: scopeOptions } = useGetCustomTypeEnums({
    where: { objectType: 'asset', field: 'scope' },
  })

  const { enumOptions: securityTierOptions } = useGetCustomTypeEnums({
    where: { objectType: 'asset', field: 'securityTier' },
  })

  const assetTypeOptions = Object.values(AssetAssetType).map((value) => ({
    value,
    label: getEnumLabel(value as string),
  }))

  const assetSourceTypeOptions = Object.values(AssetSourceType).map((value) => ({
    value,
    label: getEnumLabel(value as string),
  }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SelectField
        name="accessModelName"
        label="Access Model"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        options={accessModelOptions}
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <SelectField
        name="assetDataClassificationName"
        label="Data Classification"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        options={assetDataClassificationOptions}
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <SelectField
        name="assetSubtypeName"
        label="Subtype"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        options={assetSubtypeOptions}
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <SelectField
        name="assetType"
        label="Type"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        options={assetTypeOptions}
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <TextField
        name="costCenter"
        label="Cost Center"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        placeholder="Enter cost center"
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <TextField
        name="cpe"
        label="CPE"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        placeholder="Enter CPE"
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <SelectField
        name="criticalityName"
        label="Criticality"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        options={criticalityOptions}
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <SelectField
        name="encryptionStatusName"
        label="Encryption Status"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        options={encryptionStatusOptions}
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

      <TextField
        name="estimatedMonthlyCost"
        label="Estimated Monthly Cost"
        type="number"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        placeholder="Enter estimated monthly cost"
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <TextField
        name="identifier"
        label="Identifier"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        placeholder="Enter identifier"
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <TextField
        name="physicalLocation"
        label="Physical Location"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        placeholder="Enter physical location"
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <TextField
        name="purchaseDate"
        label="Purchase Date"
        type="date"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <TextField
        name="region"
        label="Region"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        placeholder="Enter region"
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

      <SelectField
        name="securityTierName"
        label="Security Tier"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        options={securityTierOptions}
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <TextField
        name="sourceIdentifier"
        label="Source Identifier"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        placeholder="Enter source identifier"
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />

      <SelectField
        name="sourceType"
        label="Source Type"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        options={assetSourceTypeOptions}
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
        useCustomDisplay={false}
      />

      <TextField
        name="website"
        label="Website"
        type="url"
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        isCreate={isCreate}
        data={data}
        placeholder="Enter website URL"
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
      />
    </div>
  )
}

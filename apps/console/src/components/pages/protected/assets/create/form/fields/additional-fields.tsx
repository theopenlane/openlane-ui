'use client'

import { CheckboxField } from '@/components/shared/crud-base/form-fields/checkbox-field'
import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { ResponsibilityField } from '@/components/shared/crud-base/form-fields/responsibility-field'
import { type UpdateAssetInput } from '@repo/codegen/src/schema'
import { type FieldValues } from 'react-hook-form'
import { type InternalEditingType } from '@/components/shared/crud-base/generic-sheet'
import { type EnumOptions } from '../../../table/types'

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@repo/ui/cardpanel'

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
    <div className="space-y-6">
      {/* General Information */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">General Information</CardTitle>
          <CardDescription className="p-0">Display name, identifier, and website for the asset</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="displayName" label="Display Name" {...sharedFieldProps} />
            <TextField name="identifier" label="Identifier" {...sharedFieldProps} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="website" label="Website" type="text" {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>

      {/* Type & Subtype */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">Type</CardTitle>
          <CardDescription className="p-0">Asset type and subtype information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <SelectField name="assetType" label="Type" options={enumOptions.assetTypeOptions} {...sharedFieldProps} />
            <SelectField name="assetSubtypeName" label="Subtype" options={enumOptions.assetSubtypeOptions} {...sharedFieldProps} />
            <SelectField name="criticalityName" label="Criticality" options={enumOptions.criticalityOptions} {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>

      {/* Classification & Security */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">Security</CardTitle>
          <CardDescription className="p-0">How the asset is classified and secured</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <SelectField name="assetDataClassificationName" label="Data Classification" options={enumOptions.assetDataClassificationOptions} {...sharedFieldProps} />
            <SelectField name="securityTierName" label="Security Tier" options={enumOptions.securityTierOptions} {...sharedFieldProps} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <SelectField name="encryptionStatusName" label="Encryption Status" options={enumOptions.encryptionStatusOptions} {...sharedFieldProps} />
            <SelectField name="accessModelName" label="Access Model" options={enumOptions.accessModelOptions} {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>

      {/* Source */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">Source</CardTitle>
          <CardDescription className="p-0">Origin details for the asset</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <SelectField name="sourceType" label="Source Type" options={enumOptions.assetSourceTypeOptions} {...sharedFieldProps} />
            <TextField name="sourceIdentifier" label="Source Identifier" {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>

      {/* Audit Scope */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">Audit Scope</CardTitle>
          <CardDescription className="p-0">Where and how the asset is used for audit purposes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <SelectField name="environmentName" label="Environment" options={enumOptions.environmentOptions} {...sharedFieldProps} />
            <SelectField name="scopeName" label="Scope" options={enumOptions.scopeOptions} {...sharedFieldProps} />
          </div>
          <CheckboxField name="containsPii" label="Contains PII" {...sharedFieldProps} />
        </CardContent>
      </Card>

      {/* Ownership */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">Ownership</CardTitle>
          <CardDescription className="p-0">Who is responsible for this asset</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <ResponsibilityField
              name="internalOwner"
              fieldBaseName="internalOwner"
              label="Internal Owner"
              tooltipContent="The internal owner responsible for managing this asset"
              isEditing={isEditing}
              isEditAllowed={isEditAllowed}
              isCreate={isCreate}
              internalEditing={internalEditing}
              setInternalEditing={setInternalEditing}
              handleUpdate={handleUpdateField ? (input) => handleUpdateField(input as UpdateAssetInput) : undefined}
            />
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">Location</CardTitle>
          <CardDescription className="p-0">Where the asset is physically or regionally located</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="physicalLocation" label="Physical Location" {...sharedFieldProps} />
            <TextField name="region" label="Region" {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>

      {/* Access & Cost */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">Cost</CardTitle>
          <CardDescription className="p-0">Financial details of the asset</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="estimatedMonthlyCost" label="Estimated Monthly Cost" type="currency" {...sharedFieldProps} />
            <TextField name="cpe" label="CPE (Common Platform Enumeration)" {...sharedFieldProps} />
            <TextField name="purchaseDate" label="Purchase Date" type="date" {...sharedFieldProps} />
            <TextField name="costCenter" label="Cost Center" {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

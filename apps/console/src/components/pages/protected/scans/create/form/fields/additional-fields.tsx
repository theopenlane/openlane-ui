'use client'

import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { ResponsibilityField } from '@/components/shared/crud-base/form-fields/responsibility-field'
import { type UpdateScanInput } from '@repo/codegen/src/schema'
import { type FieldValues } from 'react-hook-form'
import { type InternalEditingType } from '@/components/shared/crud-base/generic-sheet'
import { type EnumOptions, type EnumCreateHandlers } from '../../../table/types'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@repo/ui/cardpanel'

const SCAN_TYPE_OPTIONS = [
  { value: 'DOMAIN', label: 'Domain' },
  { value: 'PROVIDER', label: 'Provider' },
  { value: 'VENDOR', label: 'Vendor' },
  { value: 'VULNERABILITY', label: 'Vulnerability' },
]

const SCAN_STATUS_OPTIONS = [
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PROCESSING', label: 'Processing' },
]

interface AdditionalFieldsProps {
  isEditing: boolean
  isEditAllowed: boolean
  isCreate?: boolean
  data?: FieldValues | undefined
  internalEditing: string | null
  setInternalEditing: InternalEditingType
  handleUpdateField?: (input: UpdateScanInput) => Promise<void>
  enumOptions: EnumOptions
  enumCreateHandlers?: EnumCreateHandlers
}

export const AdditionalFields: React.FC<AdditionalFieldsProps> = ({
  isEditing,
  isEditAllowed,
  isCreate = false,
  data,
  internalEditing,
  setInternalEditing,
  handleUpdateField,
  enumOptions,
  enumCreateHandlers,
}) => {
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
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">Details</CardTitle>
          <CardDescription className="p-0">Type, status, and schedule for the scan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <SelectField name="scanType" label="Scan Type" options={SCAN_TYPE_OPTIONS} {...sharedFieldProps} />
            <SelectField name="status" label="Status" options={SCAN_STATUS_OPTIONS} {...sharedFieldProps} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="scanSchedule" label="Schedule (cron)" {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">Scope</CardTitle>
          <CardDescription className="p-0">Environment and audit scope for this scan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <SelectField name="environmentName" label="Environment" options={enumOptions.environmentOptions} onCreateOption={enumCreateHandlers?.environmentName} {...sharedFieldProps} />
            <SelectField name="scopeName" label="Scope" options={enumOptions.scopeOptions} onCreateOption={enumCreateHandlers?.scopeName} {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">Assignment</CardTitle>
          <CardDescription className="p-0">People responsible for this scan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <ResponsibilityField
              name="assignedTo"
              fieldBaseName="assignedTo"
              label="Assigned To"
              isEditing={isEditing}
              isEditAllowed={isEditAllowed}
              isCreate={isCreate}
              internalEditing={internalEditing}
              setInternalEditing={setInternalEditing}
              handleUpdate={handleUpdateField ? (input) => handleUpdateField(input as UpdateScanInput) : undefined}
            />
            <ResponsibilityField
              name="performedBy"
              fieldBaseName="performedBy"
              label="Performed By"
              isEditing={isEditing}
              isEditAllowed={isEditAllowed}
              isCreate={isCreate}
              internalEditing={internalEditing}
              setInternalEditing={setInternalEditing}
              handleUpdate={handleUpdateField ? (input) => handleUpdateField(input as UpdateScanInput) : undefined}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <ResponsibilityField
              name="reviewedBy"
              fieldBaseName="reviewedBy"
              label="Reviewed By"
              isEditing={isEditing}
              isEditAllowed={isEditAllowed}
              isCreate={isCreate}
              internalEditing={internalEditing}
              setInternalEditing={setInternalEditing}
              handleUpdate={handleUpdateField ? (input) => handleUpdateField(input as UpdateScanInput) : undefined}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

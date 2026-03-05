'use client'

import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { type UpdateScanInput } from '@repo/codegen/src/schema'
import { type FieldValues } from 'react-hook-form'
import { type InternalEditingType } from '@/components/shared/crud-base/generic-sheet'
import { type EnumOptions } from '../../../table/types'
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
            <SelectField name="environmentName" label="Environment" options={enumOptions.environmentOptions} {...sharedFieldProps} />
            <SelectField name="scopeName" label="Scope" options={enumOptions.scopeOptions} {...sharedFieldProps} />
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
            <TextField name="assignedTo" label="Assigned To" {...sharedFieldProps} />
            <TextField name="performedBy" label="Performed By" {...sharedFieldProps} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="reviewedBy" label="Reviewed By" {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

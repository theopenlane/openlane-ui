'use client'

import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { type UpdateRemediationInput } from '@repo/codegen/src/schema'
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
  handleUpdateField?: (input: UpdateRemediationInput) => Promise<void>
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
          <CardDescription className="p-0">Identifiers and status for the remediation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="externalID" label="External ID" {...sharedFieldProps} />
            <TextField name="source" label="Source" {...sharedFieldProps} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="state" label="State" {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">Content</CardTitle>
          <CardDescription className="p-0">Summary, explanation, and instructions for the remediation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 gap-2">
            <TextField name="summary" label="Summary" {...sharedFieldProps} />
          </div>
          <div className="mb-4 grid grid-cols-1 gap-2">
            <TextField name="explanation" label="Explanation" {...sharedFieldProps} />
          </div>
          <div className="mb-4 grid grid-cols-1 gap-2">
            <TextField name="instructions" label="Instructions" {...sharedFieldProps} />
          </div>
          <div className="grid grid-cols-1 gap-2">
            <TextField name="intent" label="Intent" {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">Scope</CardTitle>
          <CardDescription className="p-0">Environment and audit scope for this remediation</CardDescription>
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
          <CardTitle className="text-md p-0">References</CardTitle>
          <CardDescription className="p-0">External links and ownership information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="externalOwnerID" label="External Owner ID" {...sharedFieldProps} />
            <TextField name="externalURI" label="External URI" type="text" {...sharedFieldProps} />
          </div>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="ownerReference" label="Owner Reference" {...sharedFieldProps} />
            <TextField name="ticketReference" label="Ticket Reference" {...sharedFieldProps} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="pullRequestURI" label="Pull Request URI" type="text" {...sharedFieldProps} />
            <TextField name="repositoryURI" label="Repository URI" type="text" {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { CheckboxField } from '@/components/shared/crud-base/form-fields/checkbox-field'
import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { UpdateFindingInput } from '@repo/codegen/src/schema'
import { FieldValues } from 'react-hook-form'
import { InternalEditingType } from '@/components/shared/crud-base/generic-sheet'
import { EnumOptions } from '../../../table/types'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@repo/ui/cardpanel'

interface AdditionalFieldsProps {
  isEditing: boolean
  isEditAllowed: boolean
  isCreate?: boolean
  data?: FieldValues | undefined
  internalEditing: string | null
  setInternalEditing: InternalEditingType
  handleUpdateField?: (input: UpdateFindingInput) => Promise<void>
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
          <CardDescription className="p-0">Identifiers and classification for the finding</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="externalID" label="External ID" {...sharedFieldProps} />
            <TextField name="category" label="Category" {...sharedFieldProps} />
          </div>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="source" label="Source" {...sharedFieldProps} />
            <TextField name="findingClass" label="Finding Class" {...sharedFieldProps} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="priority" label="Priority" {...sharedFieldProps} />
            <TextField name="status" label="Status" {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">Risk Scores</CardTitle>
          <CardDescription className="p-0">Severity, scoring, and remediation timeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="severity" label="Severity" {...sharedFieldProps} />
            <TextField name="numericSeverity" label="Numeric Severity" type="text" {...sharedFieldProps} />
          </div>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="score" label="Score (CVSS)" type="text" {...sharedFieldProps} />
            <TextField name="exploitability" label="Exploitability" type="text" {...sharedFieldProps} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="impact" label="Impact" type="text" {...sharedFieldProps} />
            <TextField name="vector" label="Attack Vector" {...sharedFieldProps} />
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="remediationSLA" label="Remediation SLA (days)" type="text" {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">Scope</CardTitle>
          <CardDescription className="p-0">Environment and audit scope for this finding</CardDescription>
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
          <CardTitle className="text-md p-0">External Reference</CardTitle>
          <CardDescription className="p-0">Links and ownership from the source system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="externalOwnerID" label="External Owner ID" {...sharedFieldProps} />
            <TextField name="externalURI" label="External URI" type="text" {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">Flags</CardTitle>
          <CardDescription className="p-0">Lifecycle and disclosure state</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <CheckboxField name="open" label="Open" {...sharedFieldProps} />
            <CheckboxField name="production" label="Affects Production" {...sharedFieldProps} />
            <CheckboxField name="validated" label="Validated" {...sharedFieldProps} />
            <CheckboxField name="public" label="Publicly Disclosed" {...sharedFieldProps} />
            <CheckboxField name="blocksProduction" label="Blocks Production" {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

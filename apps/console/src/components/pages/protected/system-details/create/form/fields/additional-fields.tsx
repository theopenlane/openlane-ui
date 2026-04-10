'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/cardpanel'
import { DateField } from '@/components/shared/crud-base/form-fields/date-field'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { type InternalEditingType } from '@/components/shared/crud-base/generic-sheet'
import { type SystemDetailQuery, type UpdateSystemDetailInput } from '@repo/codegen/src/schema'
import { type EnumOptions } from '../../../table/types'

const formatJsonValue = (value?: string | Record<string, unknown> | Array<unknown> | null) => {
  if (!value) {
    return ''
  }

  if (typeof value === 'string') {
    return value
  }

  return JSON.stringify(value, null, 2)
}

interface AdditionalFieldsProps {
  isEditing: boolean
  isEditAllowed: boolean
  isCreate?: boolean
  data?: SystemDetailQuery['systemDetail'] | undefined
  internalEditing: string | null
  setInternalEditing: InternalEditingType
  handleUpdateField?: (input: UpdateSystemDetailInput) => Promise<void>
  enumOptions: EnumOptions
}

export const AdditionalFields: React.FC<AdditionalFieldsProps> = ({ isEditing, isEditAllowed, isCreate = false, data, internalEditing, setInternalEditing, handleUpdateField, enumOptions }) => {
  const formattedData = data
    ? {
        ...data,
        oscalMetadataJSON: formatJsonValue(data.oscalMetadataJSON as string | Record<string, unknown> | Array<unknown> | null | undefined),
        revisionHistory: formatJsonValue(data.revisionHistory as string | Record<string, unknown> | Array<unknown> | null | undefined),
      }
    : data

  const sharedFieldProps = {
    isEditing,
    isEditAllowed,
    isCreate,
    data: formattedData,
    internalEditing,
    setInternalEditing,
    handleUpdate: handleUpdateField,
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">Basic Information</CardTitle>
          <CardDescription className="p-0">Describe the system and track the version currently in scope</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="description" label="Description" multiline tooltipContent="Overview of the system detail record" {...sharedFieldProps} />
            <TextField name="version" label="Version" tooltipContent="Version or release identifier for this system" {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">Classification</CardTitle>
          <CardDescription className="p-0">Sensitivity and review lifecycle for this system detail</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <SelectField name="sensitivityLevel" label="Sensitivity Level" options={enumOptions.sensitivityLevelOptions} useCustomDisplay={false} {...sharedFieldProps} />
            <DateField name="lastReviewed" label="Last Reviewed" disableFuture {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">Associations</CardTitle>
          <CardDescription className="p-0">Optional platform and program anchors for this system detail</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <SelectField name="platformID" label="Platform" options={enumOptions.platformOptions} useCustomDisplay={false} {...sharedFieldProps} />
            <SelectField name="programID" label="Program" options={enumOptions.programOptions} useCustomDisplay={false} {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">OSCAL Data</CardTitle>
          <CardDescription className="p-0">Store the system boundary and structured OSCAL metadata</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <TextField name="authorizationBoundary" label="Authorization Boundary" multiline tooltipContent="Boundary definition for the system" {...sharedFieldProps} />
            <TextField
              name="oscalMetadataJSON"
              label="OSCAL Metadata JSON"
              multiline
              tooltipContent="Valid JSON describing OSCAL metadata for this system"
              {...sharedFieldProps}
              isEditAllowed={isEditing ? isEditAllowed : false}
            />
            <TextField
              name="revisionHistory"
              label="Revision History"
              multiline
              tooltipContent="Valid JSON describing revision history for this system"
              {...sharedFieldProps}
              isEditAllowed={isEditing ? isEditAllowed : false}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

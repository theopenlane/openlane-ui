'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/cardpanel'
import { DateField } from '@/components/shared/crud-base/form-fields/date-field'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { type InternalEditingType } from '@/components/shared/crud-base/generic-sheet'
import { type SystemDetailQuery, type UpdateSystemDetailInput } from '@repo/codegen/src/schema'
import { type EnumOptions } from '../../../table/types'
import RichTextField from './rich-text-field'

interface AdditionalFieldsProps {
  isEditing: boolean
  isEditAllowed: boolean
  isCreate?: boolean
  data?: SystemDetailQuery['systemDetail'] | undefined
  internalEditing: string | null
  setInternalEditing: InternalEditingType
  handleUpdateField?: (input: UpdateSystemDetailInput) => Promise<void>
  enumOptions: EnumOptions
  isFormInitialized?: boolean
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
  isFormInitialized,
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

  const revisionHistoryInitialValue = Array.isArray(data?.revisionHistory) ? (data?.revisionHistory?.[0] as string | undefined) : undefined

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">Description</CardTitle>
          <CardDescription className="p-0">Overview of the system detail record</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextField
            name="description"
            label="Description"
            tooltip="Overview of the system detail record"
            placeholder="Write a description for this system"
            isEditing={isEditing}
            isCreate={isCreate}
            initialValue={data?.description}
            isFormInitialized={isFormInitialized}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">Authorization Boundary</CardTitle>
          <CardDescription className="p-0">Boundary definition for the system</CardDescription>
        </CardHeader>
        <CardContent>
          <TextField name="authorizationBoundary" label="Authorization Boundary" multiline tooltipContent="Boundary definition for the system" {...sharedFieldProps} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">Revision History</CardTitle>
          <CardDescription className="p-0">Revision history for this system</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextField
            name="revisionHistory"
            label="Revision History"
            tooltip="Revision history for this system"
            placeholder="Document the revision history for this system"
            isEditing={isEditing}
            isCreate={isCreate}
            initialValue={revisionHistoryInitialValue}
            isFormInitialized={isFormInitialized}
          />
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
    </div>
  )
}

'use client'

import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { CheckboxField } from '@/components/shared/crud-base/form-fields/checkbox-field'
import { ResponsibilityField } from '@/components/shared/crud-base/form-fields/responsibility-field'
import { type IdentityHolderQuery, type UpdateIdentityHolderInput, type IdentityHolderUserStatus } from '@repo/codegen/src/schema'
import { type InternalEditingType } from '@/components/shared/crud-base/generic-sheet'
import { PersonnelStatusIconMapper } from '@/components/shared/enum-mapper/personnel-enum'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { type EnumOptions, type EnumCreateHandlers } from '../../../table/types'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@repo/ui/cardpanel'

interface AdditionalFieldsProps {
  isEditing: boolean
  isEditAllowed: boolean
  isCreate?: boolean
  data?: IdentityHolderQuery['identityHolder'] | undefined
  internalEditing: string | null
  setInternalEditing: InternalEditingType
  handleUpdateField?: (input: UpdateIdentityHolderInput) => Promise<void>
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
      {/* Contact Information */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">Contact Information</CardTitle>
          <CardDescription className="p-0">Email addresses and phone number for this personnel record</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-2 grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="email" label="Email" type="email" tooltipContent="The primary email address for this person" {...sharedFieldProps} />
            <TextField name="alternateEmail" label="Alternate Email" type="email" tooltipContent="An alternate email address for this person" {...sharedFieldProps} />
            <TextField name="phoneNumber" label="Phone Number" tooltipContent="The phone number for this person" {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>

      {/* Employment */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">Employment</CardTitle>
          <CardDescription className="p-0">Job title, department, team, and location details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-2 grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="title" label="Title" tooltipContent="The job title of this person" {...sharedFieldProps} />
            <TextField name="department" label="Department" tooltipContent="The department this person belongs to" {...sharedFieldProps} />
            <TextField name="team" label="Team" tooltipContent="The team this person is part of" {...sharedFieldProps} />
            <TextField name="location" label="Location" tooltipContent="The physical location or office of this person" {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>

      {/* Classification */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-md p-0">Classification</CardTitle>
          <CardDescription className="p-0">Personnel type, status, and system access details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-2 grid grid-cols-1 md:grid-cols-2 gap-2">
            <SelectField
              name="identityHolderType"
              label="Type"
              options={enumOptions.identityHolderTypeOptions}
              tooltipContent="The type of personnel, e.g. Employee or Contractor"
              {...sharedFieldProps}
            />
            <SelectField
              name="status"
              label="Status"
              options={enumOptions.statusOptions}
              useCustomDisplay={false}
              tooltipContent="The current status of this person"
              renderValue={(value) => (
                <div className="flex items-center space-x-2 text-sm">
                  {PersonnelStatusIconMapper[value as IdentityHolderUserStatus]}
                  <span>{getEnumLabel(value)}</span>
                </div>
              )}
              {...sharedFieldProps}
            />
            <CheckboxField name="isActive" label="Active" tooltipContent="Whether this person is currently active" {...sharedFieldProps} />
            <CheckboxField name="isOpenlaneUser" label="Openlane User" tooltipContent="Whether this person has an Openlane user account" {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>

      {/* Dates */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-md p-0">Dates</CardTitle>
          <CardDescription className="p-0">Employment start and end dates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-2 grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="startDate" label="Start Date" type="date" tooltipContent="The date this person started" {...sharedFieldProps} />
            <TextField name="endDate" label="End Date" type="date" tooltipContent="The date this person ended or is expected to end" {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>

      {/* Audit Scope */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-md p-0">Audit Scope</CardTitle>
          <CardDescription className="p-0">Environment and scope classification for audit purposes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-2 grid grid-cols-1 md:grid-cols-2 gap-2">
            <SelectField
              name="environmentName"
              label="Environment"
              options={enumOptions.environmentOptions}
              onCreateOption={enumCreateHandlers?.environmentName}
              tooltipContent="The environment in which this person operates, e.g. production, development"
              {...sharedFieldProps}
            />
            <SelectField
              name="scopeName"
              label="Scope"
              options={enumOptions.scopeOptions}
              onCreateOption={enumCreateHandlers?.scopeName}
              tooltipContent="The audit scope for this person, indicating covered areas and processes"
              {...sharedFieldProps}
            />
          </div>
        </CardContent>
      </Card>

      {/* Ownership */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-md p-0">Ownership</CardTitle>
          <CardDescription className="p-0">Internal ownership details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-2 grid grid-cols-1 md:grid-cols-2 gap-2">
            <ResponsibilityField
              name="internalOwner"
              fieldBaseName="internalOwner"
              label="Internal Owner"
              tooltipContent="The internal owner responsible for this personnel record"
              isEditing={isEditing}
              isEditAllowed={isEditAllowed}
              isCreate={isCreate}
              internalEditing={internalEditing}
              setInternalEditing={setInternalEditing}
              handleUpdate={handleUpdateField ? (input) => handleUpdateField(input as UpdateIdentityHolderInput) : undefined}
            />
          </div>
        </CardContent>
      </Card>

      {/* External References */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-md p-0">External References</CardTitle>
          <CardDescription className="p-0">External system identifiers for this person</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-2 grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="externalUserID" label="External User ID" tooltipContent="The user ID in an external system" {...sharedFieldProps} />
            <TextField name="externalReferenceID" label="External Reference ID" tooltipContent="A reference ID from an external system" {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

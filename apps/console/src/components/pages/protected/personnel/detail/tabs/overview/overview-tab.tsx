'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/cardpanel'
import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { CheckboxField } from '@/components/shared/crud-base/form-fields/checkbox-field'
import { Copy } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { enumToOptions, getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { PersonnelStatusIconMapper } from '@/components/shared/enum-mapper/personnel-enum'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { IdentityHolderUserStatus, IdentityHolderIdentityHolderType, type IdentityHolderQuery, type UpdateIdentityHolderInput } from '@repo/codegen/src/schema'

const identityHolderTypeOptions = enumToOptions(IdentityHolderIdentityHolderType)
const statusOptions = enumToOptions(IdentityHolderUserStatus)

interface OverviewTabProps {
  personnel: IdentityHolderQuery['identityHolder']
  isEditing: boolean
  canEdit: boolean
  handleUpdateField: (input: UpdateIdentityHolderInput) => Promise<void>
}

const CopyButton: React.FC<{ value: string }> = ({ value }) => {
  const { successNotification } = useNotification()

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(value)
    successNotification({ title: 'Copied', description: `"${value}" copied to clipboard.` })
  }

  return (
    <button type="button" onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors">
      <Copy size={13} />
    </button>
  )
}

const CopyableValue: React.FC<{ value?: string | null; placeholder?: string }> = ({ value, placeholder = 'Not set' }) => {
  if (!value) return <span className="text-muted-foreground text-sm italic">{placeholder}</span>
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{value}</span>
      <CopyButton value={value} />
    </div>
  )
}

const OverviewTab: React.FC<OverviewTabProps> = ({ personnel, isEditing, canEdit: canEditPersonnel, handleUpdateField }) => {
  const [internalEditing, setInternalEditing] = useState<string | null>(null)
  const { enumOptions: environmentOptions, onCreateOption: createEnvironment } = useCreatableEnumOptions({ field: 'environment' })
  const { enumOptions: scopeOptions, onCreateOption: createScope } = useCreatableEnumOptions({ field: 'scope' })

  const sharedFieldProps = {
    isEditing,
    isEditAllowed: canEditPersonnel,
    isCreate: false,
    data: personnel,
    internalEditing,
    setInternalEditing,
    handleUpdate: handleUpdateField,
    layout: 'horizontal' as const,
    labelClassName: 'text-muted-foreground',
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Email</span>
              {isEditing || internalEditing === 'email' ? <TextField name="email" label="" {...sharedFieldProps} layout="vertical" /> : <CopyableValue value={personnel.email} />}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Alternate Email</span>
              {isEditing || internalEditing === 'alternateEmail' ? (
                <TextField name="alternateEmail" label="" {...sharedFieldProps} layout="vertical" />
              ) : (
                <CopyableValue value={personnel.alternateEmail} />
              )}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Phone Number</span>
              {isEditing || internalEditing === 'phoneNumber' ? <TextField name="phoneNumber" label="" {...sharedFieldProps} layout="vertical" /> : <CopyableValue value={personnel.phoneNumber} />}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <TextField name="title" label="Title" {...sharedFieldProps} />
            <TextField name="department" label="Department" {...sharedFieldProps} />
            <TextField name="team" label="Team" {...sharedFieldProps} />
            <TextField name="location" label="Location" {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Classification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <SelectField name="identityHolderType" label="Type" options={identityHolderTypeOptions} {...sharedFieldProps} />
            <SelectField
              name="status"
              label="Status"
              options={statusOptions}
              useCustomDisplay={false}
              renderValue={(value) => (
                <div className="flex items-center space-x-2 text-sm">
                  {PersonnelStatusIconMapper[value as IdentityHolderUserStatus]}
                  <span>{getEnumLabel(value)}</span>
                </div>
              )}
              {...sharedFieldProps}
            />
            <CheckboxField name="isActive" label="Active" {...sharedFieldProps} />
            <CheckboxField name="isOpenlaneUser" label="Openlane User" {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <TextField name="startDate" label="Start Date" type="date" {...sharedFieldProps} />
            <TextField name="endDate" label="End Date" type="date" {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Scope</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <SelectField name="environmentName" label="Environment" options={environmentOptions} onCreateOption={createEnvironment} {...sharedFieldProps} />
            <SelectField name="scopeName" label="Scope" options={scopeOptions} onCreateOption={createScope} {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default OverviewTab

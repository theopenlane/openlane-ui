'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/cardpanel'
import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { CheckboxField } from '@/components/shared/crud-base/form-fields/checkbox-field'
import { Copy } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { enumToOptions, getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { PersonnelStatusIconMapper } from '@/components/shared/enum-mapper/personnel-enum'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { formatPhoneNumber } from '@/utils/strings'
import { IdentityHolderUserStatus, IdentityHolderIdentityHolderType, type IdentityHolderQuery, type UpdateIdentityHolderInput } from '@repo/codegen/src/schema'
import { EmailAliasesField } from '../../../email-aliases-field'

const cardHeaderClassName = 'pb-0'
const cardTitleClassName = 'text-lg p-0'

const identityHolderTypeOptions = enumToOptions(IdentityHolderIdentityHolderType)
const statusOptions = enumToOptions(IdentityHolderUserStatus)

interface OverviewTabProps {
  personnel: IdentityHolderQuery['identityHolder']
  isEditing: boolean
  canEdit: boolean
  handleUpdateField: (input: UpdateIdentityHolderInput) => Promise<void>
}

const CopyButton: React.FC<{ value: string }> = ({ value }) => {
  const { successNotification, errorNotification } = useNotification()

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(value)
      successNotification({ title: 'Copied', description: `"${value}" copied to clipboard.` })
    } catch {
      errorNotification({ title: 'Copy failed', description: 'Clipboard access is not available in this context.' })
    }
  }

  return (
    <button type="button" onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors">
      <Copy size={13} />
    </button>
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
        <CardHeader className={cardHeaderClassName}>
          <CardTitle className={cardTitleClassName}>Contact Information</CardTitle>
          <CardDescription className="p-0">Email addresses and phone number for this personnel record</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <TextField
              name="email"
              label="Email"
              type="email"
              tooltipContent="The primary email address for this person"
              displaySuffix={personnel.email ? <CopyButton value={personnel.email} /> : undefined}
              {...sharedFieldProps}
              layout="vertical"
            />
            <EmailAliasesField
              isEditing={isEditing}
              isEditAllowed={canEditPersonnel}
              internalEditing={internalEditing}
              setInternalEditing={setInternalEditing}
              handleUpdate={handleUpdateField}
              labelClassName="text-muted-foreground"
            />
            <TextField
              name="phoneNumber"
              label="Phone Number"
              type="tel"
              tooltipContent="The phone number for this person"
              displaySuffix={personnel.phoneNumber ? <CopyButton value={personnel.phoneNumber} /> : undefined}
              formatDisplayValue={formatPhoneNumber}
              {...sharedFieldProps}
              layout="vertical"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className={cardHeaderClassName}>
          <CardTitle className={cardTitleClassName}>Employment</CardTitle>
          <CardDescription className="p-0">Job title, department, team, location, and employment date details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <TextField name="title" label="Title" tooltipContent="The job title of this person" {...sharedFieldProps} />
            <TextField name="department" label="Department" tooltipContent="The department this person belongs to" {...sharedFieldProps} />
            <TextField name="team" label="Team" tooltipContent="The team this person is part of" {...sharedFieldProps} />
            <TextField name="location" label="Location" tooltipContent="The physical location or office of this person" {...sharedFieldProps} />
            <TextField name="startDate" label="Start Date" type="date" tooltipContent="The date this person started" {...sharedFieldProps} />
            <TextField name="endDate" label="End Date" type="date" tooltipContent="The date this person ended or is expected to end" {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className={cardHeaderClassName}>
          <CardTitle className={cardTitleClassName}>Classification</CardTitle>
          <CardDescription className="p-0">Personnel type, status, and system access details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <SelectField name="identityHolderType" label="Type" options={identityHolderTypeOptions} tooltipContent="The type of personnel, e.g. Employee or Contractor" {...sharedFieldProps} />
            <SelectField
              name="status"
              label="Status"
              options={statusOptions}
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

      <Card>
        <CardHeader className={cardHeaderClassName}>
          <CardTitle className={cardTitleClassName}>Audit Scope</CardTitle>
          <CardDescription className="p-0">Environment and scope classification for audit purposes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <SelectField
              name="environmentName"
              label="Environment"
              options={environmentOptions}
              onCreateOption={createEnvironment}
              tooltipContent="The environment in which this person operates, e.g. production, development"
              {...sharedFieldProps}
            />
            <SelectField
              name="scopeName"
              label="Scope"
              options={scopeOptions}
              onCreateOption={createScope}
              tooltipContent="The audit scope for this person, indicating covered areas and processes"
              {...sharedFieldProps}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default OverviewTab

'use client'

import { CheckboxField } from '@/components/shared/crud-base/form-fields/checkbox-field'
import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { type UpdateVulnerabilityInput } from '@repo/codegen/src/schema'
import { type FieldValues, useFormContext } from 'react-hook-form'
import { type InternalEditingType } from '@/components/shared/crud-base/generic-sheet'
import { type EnumOptions, type EnumCreateHandlers } from '../../../table/types'
import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { getSeverityStyle } from '@/utils/severity'

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@repo/ui/cardpanel'
import { TruncatedCell } from '@repo/ui/data-table'

interface AdditionalFieldsProps {
  isEditing: boolean
  isEditAllowed: boolean
  isCreate?: boolean
  data?: FieldValues | undefined
  internalEditing: string | null
  setInternalEditing: InternalEditingType
  handleUpdateField?: (input: UpdateVulnerabilityInput) => Promise<void>
  enumOptions: EnumOptions
  enumCreateHandlers?: EnumCreateHandlers
  riskScoresAction?: React.ReactNode
}

interface SeverityFieldProps {
  isEditing: boolean
  isEditAllowed: boolean
  isCreate?: boolean
  data?: FieldValues | undefined
  internalEditing: string | null
  setInternalEditing: InternalEditingType
  handleUpdate?: (input: UpdateVulnerabilityInput) => Promise<void>
}

const SeverityField: React.FC<SeverityFieldProps> = ({ isEditing, isEditAllowed, isCreate = false, data, internalEditing, setInternalEditing, handleUpdate }) => {
  const { control, getValues } = useFormContext()
  const securityLevel = data?.securityLevel as string | null | undefined
  const isFieldEditing = isCreate || isEditing || internalEditing === 'severity'

  const handleBlur = async () => {
    if (isEditing) return
    const newValue = getValues('severity')
    const oldValue = data?.severity ?? ''
    if (!newValue || newValue === oldValue) {
      setInternalEditing(null)
      return
    }
    if (handleUpdate) await handleUpdate({ severity: newValue })
    setInternalEditing(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
  }

  return (
    <FormField
      control={control}
      name="severity"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Severity</FormLabel>
          <FormControl>
            {isFieldEditing ? (
              <Input {...field} value={field.value ?? ''} onBlur={handleBlur} onKeyDown={handleKeyDown} autoFocus={internalEditing === 'severity'} />
            ) : (
              <div
                className="text-sm py-2 rounded-md cursor-pointer px-1 w-full hover:bg-accent"
                onClick={() => {
                  if (isEditAllowed) setInternalEditing('severity')
                }}
              >
                {securityLevel ? (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={getSeverityStyle(securityLevel)}>
                    {securityLevel.toLowerCase()}
                  </span>
                ) : (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </div>
            )}
          </FormControl>
        </FormItem>
      )}
    />
  )
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
  riskScoresAction,
}) => {
  const handleExternalURIUpdate = async (input: UpdateVulnerabilityInput) => {
    if (!input.externalURI) {
      return handleUpdateField?.({ clearExternalURI: true })
    }
    return handleUpdateField?.(input)
  }

  const sharedFieldProps = {
    isEditing,
    isEditAllowed,
    isCreate,
    data,
    internalEditing,
    setInternalEditing,
    handleUpdate: handleUpdateField,
  }

  const hasPackageDetails = Boolean(data?.packageName || data?.vulnerableVersionRange || data?.firstPatchedVersion || data?.packageEcosystem)
  const isExternalRefLocked = (data?.integrations?.totalCount ?? 0) > 0
  const externalRefLockedTooltip = 'This field is managed by the source integration and cannot be edited.'
  const externalRefLockProps = isExternalRefLocked
    ? {
        isEditing: false,
        isEditAllowed: false,
        handleUpdate: undefined,
        tooltipContent: externalRefLockedTooltip,
      }
    : null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">Details</CardTitle>
          <CardDescription className="p-0">Identifiers and classification for the vulnerability</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="cveID" label="CVE ID" {...sharedFieldProps} />
            <TextField name="category" label="Category" {...sharedFieldProps} />
          </div>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="source" label="Source" {...sharedFieldProps} />
            <TextField name="priority" label="Priority" {...sharedFieldProps} />
          </div>
          <div className="grid grid-cols-1 gap-2">
            <SelectField
              name="vulnerabilityStatusName"
              label="Status"
              options={enumOptions.vulnerabilityStatusOptions}
              onCreateOption={enumCreateHandlers?.vulnerabilityStatusName}
              {...sharedFieldProps}
            />
          </div>
        </CardContent>
      </Card>

      {hasPackageDetails && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md p-0">Package Details</CardTitle>
            <CardDescription className="p-0">Affected package and patched version information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
              <TextField name="packageName" label="Package Name" {...sharedFieldProps} />
              <TextField name="packageEcosystem" label="Package Ecosystem" {...sharedFieldProps} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <TextField name="vulnerableVersionRange" label="Vulnerable Version Range" {...sharedFieldProps} />
              <TextField name="firstPatchedVersion" label="First Patched Version" {...sharedFieldProps} />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-md p-0">Risk Scores</CardTitle>
              <CardDescription className="p-0">Severity, scoring, and remediation timeline</CardDescription>
            </div>
            {riskScoresAction}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <SeverityField
              isEditing={isEditing}
              isEditAllowed={isEditAllowed}
              isCreate={isCreate}
              data={data}
              internalEditing={internalEditing}
              setInternalEditing={setInternalEditing}
              handleUpdate={handleUpdateField}
            />
            <TextField name="score" label="Score (CVSS)" type="text" {...sharedFieldProps} />
          </div>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="exploitability" label="Exploitability Score" type="text" {...sharedFieldProps} />
            <TextField name="impact" label="Impact Score" type="text" {...sharedFieldProps} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="remediationSLA" label="Remediation SLA (days)" type="text" {...sharedFieldProps} />
            <TextField name="vector" label="Attack Vector" {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">Scope</CardTitle>
          <CardDescription className="p-0">Environment and audit scope for this vulnerability</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <SelectField name="environmentName" label="Environment" options={enumOptions.environmentOptions} onCreateOption={enumCreateHandlers?.environmentName} {...sharedFieldProps} />
            <SelectField name="scopeName" label="Scope" options={enumOptions.scopeOptions} onCreateOption={enumCreateHandlers?.scopeName} {...sharedFieldProps} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <CheckboxField name="production" label="Affects Production" {...sharedFieldProps} />
            <CheckboxField name="blocking" label="Blocks Production Changes" {...sharedFieldProps} />
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
            <TextField name="externalID" label="External ID" {...sharedFieldProps} {...externalRefLockProps} formatDisplayValue={(v) => <TruncatedCell>{v}</TruncatedCell>} />
            <TextField name="externalOwnerID" label="External Owner ID" {...sharedFieldProps} {...externalRefLockProps} formatDisplayValue={(v) => <TruncatedCell>{v}</TruncatedCell>} />
          </div>
          <div className="grid grid-cols-1 gap-2">
            <TextField name="externalURI" label="External URI" type="link" {...sharedFieldProps} handleUpdate={handleExternalURIUpdate} {...externalRefLockProps} />
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
            <CheckboxField name="validated" label="Validated" {...sharedFieldProps} />
            <CheckboxField name="public" label="Publicly Disclosed" {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'
import { isIntegrationSourced } from '@/lib/integrations/utils'

import { CheckboxField } from '@/components/shared/crud-base/form-fields/checkbox-field'
import { ResponsibilityField } from '@/components/shared/crud-base/form-fields/responsibility-field'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { type InternalEditingType } from '@/components/shared/crud-base/generic-sheet'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { HtmlOrText } from '@/components/shared/sanitized-html/sanitized-html'
import { SeverityChip } from '@/components/shared/severity/severity-chip'
import { formatDateTime } from '@/utils/date'
import { normalizeUrl } from '@/utils/normalizeUrl'
import { type UpdateFindingInput } from '@repo/codegen/src/schema'
import { Badge } from '@repo/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/cardpanel'
import { TruncatedCell } from '@repo/ui/data-table'
import { FormItem, FormLabel } from '@repo/ui/form'
import { activatable } from '@repo/ui/lib/a11y'
import { cn } from '@repo/ui/lib/utils'
import { Textarea } from '@repo/ui/textarea'
import { ExternalLink as ExternalLinkIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useFormContext, type FieldValues } from 'react-hook-form'
import { FINDING_ASSIGNEE, FINDING_INTERNAL_OWNER, FINDING_REVIEWER } from '../../../finding-responsibility'
import { type EnumCreateHandlers, type EnumOptions } from '../../../table/types'
import { EXTERNAL_REF_LOCKED_TOOLTIP } from '../../../../exposure/detail/external-ref-lock'
import { getFindingSeverity } from '../../../finding-display'
import { isPopulatedObject, TargetDetailsCard } from '../../../target-details/target-details'

interface AdditionalFieldsProps {
  isEditing: boolean
  isEditAllowed: boolean
  isCreate?: boolean
  data?: FieldValues | undefined
  internalEditing: string | null
  setInternalEditing: InternalEditingType
  handleUpdateField?: (input: UpdateFindingInput) => Promise<void>
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

  const plainChipDisplay = (v: string) => (v ? <Badge variant="secondary">{v}</Badge> : null)
  const enumChipDisplay = (v: string) => (v ? <Badge variant="secondary">{getEnumLabel(v)}</Badge> : null)

  const securityLevelRaw = getFindingSeverity(data ?? {}) ?? ''
  const securityLevelDisplay = securityLevelRaw ? <SeverityChip severity={securityLevelRaw} /> : ''

  const hasTargetDetails = isPopulatedObject(data?.targetDetails)
  const hasMetadata = Boolean(data?.source || data?.sourceUpdatedAt || data?.eventTime || data?.reportedAt)
  const isExternalRefLocked = isIntegrationSourced(data)
  const externalRefLockProps = isExternalRefLocked
    ? {
        isEditing: false,
        isEditAllowed: false,
        handleUpdate: undefined,
        tooltipContent: EXTERNAL_REF_LOCKED_TOOLTIP,
      }
    : null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">Details</CardTitle>
          <CardDescription className="p-0">Identifiers and classification for the finding</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <SelectField name="findingStatusName" label="Status" options={enumOptions.findingStatusOptions} onCreateOption={enumCreateHandlers?.findingStatusName} {...sharedFieldProps} />
            <TextField name="priority" label="Priority" {...sharedFieldProps} />
          </div>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="category" label="Category" formatDisplayValue={plainChipDisplay} {...sharedFieldProps} />
            <TextField name="findingClass" label="Finding Class" formatDisplayValue={enumChipDisplay} {...sharedFieldProps} />
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
            <ReadOnlyField label="Security Level" value={securityLevelDisplay} />
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

      {hasTargetDetails && <TargetDetailsCard value={data?.targetDetails as Record<string, unknown>} />}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">Guidance</CardTitle>
          <CardDescription className="p-0">Reproduction, recommended actions, and references</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <ArrayTextField
              name="stepsToReproduce"
              label="Steps to Reproduce"
              {...sharedFieldProps}
              renderView={(arr) => (
                <ol className="list-decimal pl-5 space-y-1">
                  {arr.map((step, i) => (
                    <li key={i}>
                      <HtmlOrText value={step} />
                    </li>
                  ))}
                </ol>
              )}
            />
          </div>
          <div className="mb-4">
            <TextField name="recommendedActions" label="Recommended Actions" multiline formatDisplayValue={(v) => <HtmlOrText value={v} />} {...sharedFieldProps} />
          </div>
          <div>
            <ArrayTextField
              name="references"
              label="References"
              {...sharedFieldProps}
              renderView={(arr) => (
                <ul className="space-y-1">
                  {arr.map((url, i) => (
                    <li key={i} className="min-w-0">
                      <HtmlOrText
                        value={url}
                        renderText={(link) => (
                          <a
                            href={normalizeUrl(link)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 min-w-0 max-w-full text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLinkIcon className="w-4 h-4 shrink-0" />
                            <span className="truncate" title={link}>
                              {link}
                            </span>
                          </a>
                        )}
                      />
                    </li>
                  ))}
                </ul>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {hasMetadata && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md p-0">Metadata</CardTitle>
            <CardDescription className="p-0">Source and timing information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
              <ReadOnlyField label="Source" value={data?.source ?? ''} />
              <ReadOnlyField label="Source Updated At" value={data?.sourceUpdatedAt ? formatDateTime(data.sourceUpdatedAt) : ''} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <ReadOnlyField label="Event Time" value={data?.eventTime ? formatDateTime(data.eventTime) : ''} />
              <ReadOnlyField label="Reported At" value={data?.reportedAt ? formatDateTime(data.reportedAt) : ''} />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">Scope</CardTitle>
          <CardDescription className="p-0">Environment and audit scope for this finding</CardDescription>
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
          <CardDescription className="p-0">People responsible for triaging and reviewing this finding</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <ResponsibilityField
              name="internalOwner"
              {...FINDING_INTERNAL_OWNER}
              label="Internal Owner"
              tooltipContent="Who owns this finding internally, independent of who is triaging it"
              {...sharedFieldProps}
            />
            <ResponsibilityField name="assignedTo" {...FINDING_ASSIGNEE} label="Assignee" tooltipContent="Who is responsible for remediating this finding" {...sharedFieldProps} />
            <ResponsibilityField name="reviewedBy" {...FINDING_REVIEWER} label="Reviewed By" tooltipContent="Who reviewed this finding" {...sharedFieldProps} />
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
            <TextField name="externalURI" label="External URI" type="link" {...sharedFieldProps} {...externalRefLockProps} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const ReadOnlyField: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => {
  const notSet = <span className="text-muted-foreground italic">Not set</span>
  return (
    <FormItem>
      <div className="flex items-center gap-2 shrink-0">
        <FormLabel>{label}</FormLabel>
      </div>
      <div className="text-sm py-2 px-1 w-full">{value === '' || value === null || value === undefined ? notSet : value}</div>
    </FormItem>
  )
}

interface ArrayTextFieldProps {
  name: string
  label: string
  isEditing: boolean
  isEditAllowed: boolean
  isCreate?: boolean
  data?: FieldValues
  internalEditing: string | null
  setInternalEditing: InternalEditingType
  handleUpdate?: (input: UpdateFindingInput) => Promise<void>
  renderView?: (arr: string[]) => React.ReactNode
}

export const ArrayTextField: React.FC<ArrayTextFieldProps> = ({ name, label, isEditing, isEditAllowed, isCreate, data, internalEditing, setInternalEditing, handleUpdate, renderView }) => {
  const { setValue, getValues } = useFormContext()
  const isFieldEditing = Boolean(isCreate) || isEditing || internalEditing === name

  const currentArray: string[] = React.useMemo(() => {
    const fromData = data?.[name]
    if (Array.isArray(fromData)) return fromData as string[]
    const fromForm = getValues(name)
    if (Array.isArray(fromForm)) return fromForm as string[]
    return []
  }, [data, name, getValues])

  const [localValue, setLocalValue] = useState<string>(currentArray.join('\n'))

  useEffect(() => {
    if (isFieldEditing) {
      setLocalValue(currentArray.join('\n'))
    }
  }, [isFieldEditing, currentArray])

  const parseToArray = (text: string) =>
    text
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value
    setLocalValue(next)
    setValue(name, parseToArray(next), { shouldDirty: true })
  }

  const handleBlur = async () => {
    if (isEditing) return
    const newArr = parseToArray(localValue)
    setValue(name, newArr, { shouldDirty: true })
    setInternalEditing(null)
    const same = newArr.length === currentArray.length && newArr.every((v, i) => v === currentArray[i])
    if (!same && handleUpdate) {
      await handleUpdate({ [name]: newArr } as unknown as UpdateFindingInput)
    }
  }

  const handleClick = () => {
    if (!isEditing && isEditAllowed) setInternalEditing(name)
  }

  const notSet = <span className="text-muted-foreground italic">Not set</span>

  return (
    <FormItem>
      <div className="flex items-center gap-2 shrink-0">
        <FormLabel>{label}</FormLabel>
      </div>
      {isFieldEditing ? (
        <Textarea value={localValue} onChange={handleChange} onBlur={handleBlur} autoFocus={internalEditing === name} rows={4} placeholder="One entry per line" />
      ) : (
        <div className={cn('text-sm py-2 px-1 w-full rounded-md', isEditAllowed && 'cursor-pointer hover:bg-accent')} {...activatable(isEditAllowed ? handleClick : undefined)}>
          {currentArray.length === 0 ? notSet : renderView?.(currentArray)}
        </div>
      )}
    </FormItem>
  )
}

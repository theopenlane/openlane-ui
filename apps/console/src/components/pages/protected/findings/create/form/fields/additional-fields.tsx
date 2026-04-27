'use client'

import React, { useState, useEffect } from 'react'
import { useFormContext, type FieldValues } from 'react-hook-form'
import { ExternalLink as ExternalLinkIcon } from 'lucide-react'
import { CheckboxField } from '@/components/shared/crud-base/form-fields/checkbox-field'
import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { type UpdateFindingInput, FindingSecurityLevel } from '@repo/codegen/src/schema'
import { type InternalEditingType } from '@/components/shared/crud-base/generic-sheet'
import { type EnumOptions, type EnumCreateHandlers } from '../../../table/types'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@repo/ui/cardpanel'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Textarea } from '@repo/ui/textarea'
import { FormItem, FormLabel } from '@repo/ui/form'
import { cn } from '@repo/ui/lib/utils'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { formatDateTime } from '@/utils/date'
import { normalizeUrl } from '@/utils/normalizeUrl'
import { getSeverityStyle } from '@/utils/severity'
import { toUpperSnakeCase } from '@/utils/strings'

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
  riskScoresAction?: React.ReactNode
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

  const securityLevelRaw: string = data?.securityLevel && data.securityLevel !== FindingSecurityLevel.NONE ? String(data.securityLevel) : (data?.severity ?? '')
  const securityLevelDisplay = securityLevelRaw ? (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={getSeverityStyle(securityLevelRaw)}>
      {securityLevelRaw.toLowerCase()}
    </span>
  ) : (
    ''
  )

  const hasTargetDetails = isPopulatedObject(data?.targetDetails)
  const hasMetadata = Boolean(data?.source || data?.sourceUpdatedAt || data?.eventTime || data?.reportedAt)

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
                    <li key={i} className="whitespace-pre-wrap">
                      {step}
                    </li>
                  ))}
                </ol>
              )}
            />
          </div>
          <div className="mb-4">
            <TextField name="recommendedActions" label="Recommended Actions" multiline {...sharedFieldProps} />
          </div>
          <div>
            <ArrayTextField
              name="references"
              label="References"
              {...sharedFieldProps}
              renderView={(arr) => (
                <ul className="space-y-1">
                  {arr.map((url, i) => (
                    <li key={i}>
                      <a
                        href={normalizeUrl(url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLinkIcon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{url}</span>
                      </a>
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
          <CardTitle className="text-md p-0">External Reference</CardTitle>
          <CardDescription className="p-0">Links and ownership from the source system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="externalID" label="External ID" {...sharedFieldProps} />
            <TextField name="externalOwnerID" label="External Owner ID" {...sharedFieldProps} />
          </div>
          <div className="grid grid-cols-1 gap-2">
            <TextField name="externalURI" label="External URI" type="link" {...sharedFieldProps} />
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
  renderView: (arr: string[]) => React.ReactNode
}

const ArrayTextField: React.FC<ArrayTextFieldProps> = ({ name, label, isEditing, isEditAllowed, isCreate, data, internalEditing, setInternalEditing, handleUpdate, renderView }) => {
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
        <div className={cn('text-sm py-2 px-1 w-full rounded-md', isEditAllowed && 'cursor-pointer hover:bg-accent')} onClick={handleClick}>
          {currentArray.length === 0 ? notSet : renderView(currentArray)}
        </div>
      )}
    </FormItem>
  )
}

const isPopulatedObject = (val: unknown): val is Record<string, unknown> => typeof val === 'object' && val !== null && !Array.isArray(val) && Object.keys(val as object).length > 0

const TargetDetailsCard: React.FC<{ value: Record<string, unknown> }> = ({ value }) => {
  const [view, setView] = useState<'fields' | 'json'>('fields')
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-md p-0">Target Details</CardTitle>
            <CardDescription className="p-0">Resource context from the source system</CardDescription>
          </div>
          <div className="flex items-center gap-1 rounded-md border p-0.5">
            <Button type="button" size="sm" variant={view === 'fields' ? 'secondary' : 'transparent'} onClick={() => setView('fields')}>
              Fields
            </Button>
            <Button type="button" size="sm" variant={view === 'json' ? 'secondary' : 'transparent'} onClick={() => setView('json')}>
              JSON
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {view === 'json' ? (
          <pre className="text-xs overflow-auto max-h-120 bg-muted rounded p-3 whitespace-pre-wrap break-all">{JSON.stringify(value, null, 2)}</pre>
        ) : (
          <TargetDetailsFields value={value} />
        )}
      </CardContent>
    </Card>
  )
}

const URL_RE = /^(https?:\/\/|ghcr\.io\/|docker\.io\/|gcr\.io\/|registry\.)/i
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T/

const isEmpty = (val: unknown): boolean => {
  if (val === null || val === undefined) return true
  if (typeof val === 'string' && val.trim() === '') return true
  if (Array.isArray(val)) return val.length === 0 || val.every(isEmpty)
  if (typeof val === 'object') return Object.values(val as Record<string, unknown>).every(isEmpty)
  return false
}

const formatPrimitive = (val: unknown): React.ReactNode => {
  if (typeof val === 'boolean') return val ? 'Yes' : 'No'
  if (typeof val === 'number') return String(val)
  if (typeof val === 'string') {
    if (ISO_DATE_RE.test(val)) return formatDateTime(val)
    if (URL_RE.test(val)) {
      return (
        <a href={normalizeUrl(val)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline break-all" onClick={(e) => e.stopPropagation()}>
          <span className="break-all">{val}</span>
          <ExternalLinkIcon className="w-3.5 h-3.5 shrink-0" />
        </a>
      )
    }
    return val
  }
  return String(val)
}

const TargetDetailsFields: React.FC<{ value: Record<string, unknown> }> = ({ value }) => {
  const entries = Object.entries(value).filter(([, v]) => !isEmpty(v))
  if (entries.length === 0) {
    return <span className="text-muted-foreground italic text-sm">No populated fields</span>
  }
  return (
    <div className="space-y-4">
      {entries.map(([key, val]) => (
        <div key={key}>
          <div className="text-xs text-muted-foreground tracking-wide mb-2">{toUpperSnakeCase(key)}</div>
          <TargetNode value={val} />
        </div>
      ))}
    </div>
  )
}

const TargetNode: React.FC<{ value: unknown }> = ({ value }) => {
  if (isEmpty(value)) return null

  if (Array.isArray(value)) {
    const allPrimitive = value.every((v) => typeof v !== 'object' || v === null)
    if (allPrimitive) {
      return <div className="text-sm">{value.map((v) => String(v)).join(', ')}</div>
    }
    return (
      <div className="space-y-2">
        {value.map((item, i) => (
          <div key={i} className="border-l pl-3 ml-1">
            <TargetNode value={item} />
          </div>
        ))}
      </div>
    )
  }

  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => !isEmpty(v))
    return (
      <dl className="grid grid-cols-[minmax(120px,max-content)_1fr] gap-x-3 gap-y-1 text-sm">
        {entries.map(([k, v]) => (
          <React.Fragment key={k}>
            <dt className="text-muted-foreground break-all">{k}</dt>
            <dd className="min-w-0 break-all">{typeof v === 'object' && v !== null ? <TargetNode value={v} /> : formatPrimitive(v)}</dd>
          </React.Fragment>
        ))}
      </dl>
    )
  }

  return <div className="text-sm">{formatPrimitive(value)}</div>
}

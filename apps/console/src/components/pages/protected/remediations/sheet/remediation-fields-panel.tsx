'use client'

import React, { useMemo, useState } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { Panel } from '@repo/ui/panel'
import { Input } from '@repo/ui/input'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { RemediationRemediationStatus } from '@repo/codegen/src/schema'
import PlateEditor from '@/components/shared/plate/plate-editor'
import { usePlateHydration } from '@/components/shared/plate/usePlateHydration'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { isPlateValueEmpty } from '@/components/shared/plate/plate-utils'
import { ReadOnlyField } from '@/components/shared/read-only-field/read-only-field'
import { CreatableCustomTypeEnumSelect } from '@/components/shared/custom-type-enum-select/creatable-custom-type-enum-select'
import { CustomEnumChipCell } from '@/components/shared/crud-base/columns/custom-enum-chip-cell'
import { RemediationStatusIconLabel } from '@/components/shared/enum-mapper/remediation-enum'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { type RemediationFormData } from '../hooks/use-form-schema'
import { type TRemediation } from './remediation-context'

type TRichTextFieldName = 'explanation' | 'instructions' | 'intent'

const RICH_TEXT_FIELDS: { name: TRichTextFieldName; label: string; placeholder: string; required: boolean }[] = [
  { name: 'explanation', label: 'Explanation', placeholder: 'Explain what this remediation addresses and why', required: true },
  { name: 'instructions', label: 'Instructions', placeholder: 'List the steps needed to remediate the issue', required: true },
  { name: 'intent', label: 'Intent', placeholder: 'Describe the goal or expected outcome of the remediation', required: false },
]

type TRemediationFieldsPanelProps = {
  form: UseFormReturn<RemediationFormData>
  isEditing: boolean
  isCreate: boolean
  remediation?: TRemediation
  contextValues?: Partial<Record<'environmentName' | 'scopeName', string | null>>
}

const ReadOnlyRichText: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => {
  const { convertToReadOnly } = usePlateEditor()
  const isEmpty = isPlateValueEmpty(value)
  const content = useMemo(() => (isEmpty || !value ? null : convertToReadOnly(value)), [isEmpty, value, convertToReadOnly])

  if (!content) {
    return null
  }

  return (
    <ReadOnlyField label={label}>
      <div className="whitespace-pre-wrap break-words">{content}</div>
    </ReadOnlyField>
  )
}

const RemediationFieldsView: React.FC<{ remediation: TRemediation }> = ({ remediation }) => {
  const hasDetails = RICH_TEXT_FIELDS.some(({ name }) => !isPlateValueEmpty(remediation[name])) || !!remediation.environmentName || !!remediation.scopeName

  if (!hasDetails) {
    return <p className="text-sm text-muted-foreground">No explanation, instructions or intent have been added yet.</p>
  }

  return (
    <>
      {RICH_TEXT_FIELDS.map(({ name, label }) => (
        <ReadOnlyRichText key={name} label={label} value={remediation[name]} />
      ))}
      {(remediation.environmentName || remediation.scopeName) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {remediation.environmentName && (
            <ReadOnlyField label="Environment">
              <CustomEnumChipCell value={remediation.environmentName} field="environment" />
            </ReadOnlyField>
          )}
          {remediation.scopeName && (
            <ReadOnlyField label="Scope">
              <CustomEnumChipCell value={remediation.scopeName} field="scope" />
            </ReadOnlyField>
          )}
        </div>
      )}
    </>
  )
}

const AutoFilledHint: React.FC<{ value?: string | null; contextValue?: string | null }> = ({ value, contextValue }) =>
  value && value === contextValue ? <span className="font-normal text-muted-foreground">(auto-filled)</span> : null

const RemediationFieldsEdit: React.FC<Omit<TRemediationFieldsPanelProps, 'isEditing' | 'remediation'>> = ({ form, isCreate, contextValues }) => {
  const hydrate = usePlateHydration(form)
  const [initialRichText] = useState(() => ({ explanation: form.getValues('explanation'), instructions: form.getValues('instructions'), intent: form.getValues('intent') }))
  const { enumOptions: environmentOptions, onCreateOption: createEnvironment } = useCreatableEnumOptions({ field: 'environment' })
  const { enumOptions: scopeOptions, onCreateOption: createScope } = useCreatableEnumOptions({ field: 'scope' })

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel required={isCreate}>Title</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} className="w-full" placeholder="Remediation title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel required={isCreate}>Status</FormLabel>
              <Select value={field.value ?? ''} onValueChange={(value) => field.onChange(value as RemediationRemediationStatus)}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(RemediationRemediationStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      <RemediationStatusIconLabel status={status} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {RICH_TEXT_FIELDS.map(({ name, label, placeholder, required }) => (
        <FormField
          key={name}
          control={form.control}
          name={name}
          render={({ field }) => (
            <FormItem>
              <FormLabel required={isCreate && required}>{label}</FormLabel>
              <FormControl>
                <PlateEditor onChange={field.onChange} onHydrate={hydrate(field.name)} initialValue={initialRichText[name]} placeholder={placeholder} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="environmentName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Environment <AutoFilledHint value={field.value} contextValue={contextValues?.environmentName} />
              </FormLabel>
              <FormControl>
                <CreatableCustomTypeEnumSelect
                  value={field.value ?? ''}
                  options={environmentOptions}
                  onValueChange={field.onChange}
                  onCreateOption={createEnvironment}
                  placeholder="Select environment"
                  clearable
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="scopeName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Scope <AutoFilledHint value={field.value} contextValue={contextValues?.scopeName} />
              </FormLabel>
              <FormControl>
                <CreatableCustomTypeEnumSelect value={field.value ?? ''} options={scopeOptions} onValueChange={field.onChange} onCreateOption={createScope} placeholder="Select scope" clearable />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  )
}

const RemediationFieldsPanel: React.FC<TRemediationFieldsPanelProps> = ({ isEditing, remediation, ...props }) => (
  <Panel className="p-4 flex flex-col gap-4">
    <p className="text-lg font-medium">{isEditing ? 'Remediation Details' : 'Remediation'}</p>
    {isEditing || !remediation ? <RemediationFieldsEdit {...props} /> : <RemediationFieldsView remediation={remediation} />}
  </Panel>
)

export default RemediationFieldsPanel

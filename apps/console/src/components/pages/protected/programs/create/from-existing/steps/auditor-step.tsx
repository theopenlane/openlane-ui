'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Input } from '@repo/ui/input'
import { Switch } from '@repo/ui/switch'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import { type SourceProgram } from '../from-existing-types'
import { hasAuditorDetails, type WizardValues } from '../from-existing-wizard-config'

type AuditorStepProps = {
  sourceProgram?: SourceProgram
  onUseSameAuditorChange: (useSameAuditor: boolean) => void
}

const AuditorStep = ({ sourceProgram, onUseSameAuditorChange }: AuditorStepProps) => {
  const { control } = useFormContext<WizardValues>()

  const hasSourceAuditor = hasAuditorDetails(sourceProgram)

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-lg font-medium">Auditor</h2>
        <p className="text-sm text-muted-foreground">Keep the auditor from {sourceProgram?.name || 'the copied program'} or enter a new one.</p>
      </div>

      <FormField
        control={control}
        name="useSameAuditor"
        render={({ field }) => (
          <FormItem className="flex items-center gap-3 space-y-0">
            <FormControl>
              <Switch
                checked={!!field.value}
                disabled={!hasSourceAuditor}
                onCheckedChange={(checked) => {
                  field.onChange(checked)
                  onUseSameAuditorChange(checked)
                }}
              />
            </FormControl>
            <FormLabel className="!mt-0">Use the same auditor</FormLabel>
          </FormItem>
        )}
      />

      {!hasSourceAuditor && <p className="text-sm text-muted-foreground">{sourceProgram?.name || 'The copied program'} doesn&apos;t have auditor details yet.</p>}

      <FormField
        control={control}
        name="auditPartnerName"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Audit Partner Name</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ''} placeholder="Jane Doe" />
            </FormControl>
            {fieldState.error && <FormMessage />}
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="auditFirm"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Audit Firm</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ''} placeholder="Audit firm" />
            </FormControl>
            {fieldState.error && <FormMessage />}
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="auditPartnerEmail"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Audit Partner Email</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ''} placeholder="jane@auditfirm.com" />
            </FormControl>
            {fieldState.error && <FormMessage />}
          </FormItem>
        )}
      />
    </div>
  )
}

export default AuditorStep

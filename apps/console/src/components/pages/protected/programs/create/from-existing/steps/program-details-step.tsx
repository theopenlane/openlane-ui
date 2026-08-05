'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Callout } from '@/components/shared/callout/callout'
import ProgramTypeSelect from '../../shared/form-fields/program-select'
import { DateSelect } from '../../shared/form-fields/date-select'
import { useUserSelect } from '@/lib/graphql-hooks/member'
import { useStandardsSelect } from '@/lib/graphql-hooks/standard'
import { type SourceProgram } from '../from-existing-types'
import { type WizardValues } from '../from-existing-wizard-config'

type ProgramDetailsStepProps = {
  sourceProgram?: SourceProgram
  ownerLeftOrg: boolean
}

const ProgramDetailsStep = ({ sourceProgram, ownerLeftOrg }: ProgramDetailsStepProps) => {
  const {
    control,
    formState: { errors },
  } = useFormContext<WizardValues>()
  const { userOptions } = useUserSelect({})
  const { standardOptions } = useStandardsSelect({})

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-lg font-medium">Program details</h2>
        <p className="text-sm text-muted-foreground">Copied from {sourceProgram?.name || 'the selected program'} and fully editable. The period defaults to today through one year from today.</p>
      </div>

      <FormField
        control={control}
        name="name"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>
              Program Name<span className="text-destructive"> *</span>
            </FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ''} placeholder="Program name" />
            </FormControl>
            {fieldState.error && <FormMessage />}
          </FormItem>
        )}
      />

      <ProgramTypeSelect />

      <FormField
        control={control}
        name="framework"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Framework</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ''} placeholder="Framework name" list="from-existing-frameworks" />
            </FormControl>
            <datalist id="from-existing-frameworks">
              {standardOptions.map((standard) => (
                <option key={standard.value} value={standard.label} />
              ))}
            </datalist>
            {fieldState.error && <FormMessage />}
          </FormItem>
        )}
      />

      <div className="flex gap-6">
        <div className="flex flex-col gap-1.5">
          <FormLabel>Start Date</FormLabel>
          <DateSelect name="startDate" />
        </div>
        <div className="flex flex-col gap-1.5">
          <FormLabel>End Date</FormLabel>
          <DateSelect name="endDate" />
          {errors.endDate?.message && <span className="text-xs text-destructive">{errors.endDate.message}</span>}
        </div>
      </div>

      <FormField
        control={control}
        name="programOwnerID"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Program Owner</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  {userOptions.map((user) => (
                    <SelectItem key={user.value} value={user.value}>
                      {user.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            {fieldState.error && <FormMessage />}
          </FormItem>
        )}
      />

      {ownerLeftOrg && (
        <Callout variant="warning" compact>
          The owner of {sourceProgram?.name} is no longer in this organization, so we couldn&apos;t carry them over. Pick a new program owner.
        </Callout>
      )}

      <FormField
        control={control}
        name="description"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea {...field} value={field.value ?? ''} placeholder="Enter a description for this program" />
            </FormControl>
            {fieldState.error && <FormMessage />}
          </FormItem>
        )}
      />
    </div>
  )
}

export default ProgramDetailsStep

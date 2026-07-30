'use client'

import React from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { FindingSecurityLevel } from '@repo/codegen/src/schema'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { type ControlReviewFormData } from './use-control-review-form-schema'

const SEVERITY_ORDER: string[] = [FindingSecurityLevel.CRITICAL, FindingSecurityLevel.HIGH, FindingSecurityLevel.MEDIUM, FindingSecurityLevel.LOW, FindingSecurityLevel.NONE]

const SEVERITY_OPTIONS = enumToOptions(FindingSecurityLevel).sort((a, b) => SEVERITY_ORDER.indexOf(a.value) - SEVERITY_ORDER.indexOf(b.value))

type TFindingFieldsProps = {
  form: UseFormReturn<ControlReviewFormData>
}

const FindingFields: React.FC<TFindingFieldsProps> = ({ form }) => (
  <div className="flex flex-col gap-3 rounded-md border border-border p-3">
    <p className="text-xs text-muted-foreground">Findings must be created inside a review. Once this review is saved, you can add more findings from the review page.</p>
    <FormField
      control={form.control}
      name="findingTitle"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Finding Title</FormLabel>
          <FormControl>
            <Input {...field} value={field.value ?? ''} className="w-full" placeholder="Describe the finding..." />
          </FormControl>
        </FormItem>
      )}
    />
    <FormField
      control={form.control}
      name="findingSeverity"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Severity</FormLabel>
          <FormControl>
            <Select value={field.value ?? undefined} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select severity..." />
              </SelectTrigger>
              <SelectContent>
                {SEVERITY_OPTIONS.map((severity) => (
                  <SelectItem key={severity.value} value={severity.value}>
                    {severity.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
        </FormItem>
      )}
    />
    <FormField
      control={form.control}
      name="findingDescription"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Description</FormLabel>
          <FormControl>
            <Textarea {...field} value={field.value ?? ''} rows={3} placeholder="Describe the details of this finding..." />
          </FormControl>
        </FormItem>
      )}
    />
  </div>
)

export default FindingFields

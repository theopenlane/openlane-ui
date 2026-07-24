'use client'

import React, { useState } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { InfoIcon, X } from 'lucide-react'
import { Panel } from '@repo/ui/panel'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { FindingSecurityLevel } from '@repo/codegen/src/schema'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { type ControlReviewFormData } from './use-control-review-form-schema'

const SEVERITY_ORDER: string[] = [FindingSecurityLevel.CRITICAL, FindingSecurityLevel.HIGH, FindingSecurityLevel.MEDIUM, FindingSecurityLevel.LOW, FindingSecurityLevel.NONE]

const SEVERITY_OPTIONS = enumToOptions(FindingSecurityLevel).sort((a, b) => SEVERITY_ORDER.indexOf(a.value) - SEVERITY_ORDER.indexOf(b.value))

type TFindingFieldsPanelProps = {
  form: UseFormReturn<ControlReviewFormData>
}

const FindingFieldsPanel: React.FC<TFindingFieldsPanelProps> = ({ form }) => {
  const [expanded, setExpanded] = useState(false)

  const collapse = () => {
    form.resetField('findingTitle')
    form.resetField('findingSeverity')
    form.resetField('findingDescription')
    setExpanded(false)
  }

  return (
    <Panel className="p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <InfoIcon size={16} className="text-warning" />
          <p className="text-lg font-medium">Add a Finding</p>
          <span className="text-xs text-muted-foreground">Optional</span>
        </div>
        {expanded && <X aria-label="Remove finding" size={16} className="cursor-pointer text-muted-foreground" onClick={collapse} />}
      </div>
      {expanded ? (
        <>
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
        </>
      ) : (
        <Button type="button" variant="secondary" className="self-start" onClick={() => setExpanded(true)}>
          Add a Finding
        </Button>
      )}
    </Panel>
  )
}

export default FindingFieldsPanel

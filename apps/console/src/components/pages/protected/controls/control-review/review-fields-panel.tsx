'use client'

import React from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { Panel } from '@repo/ui/panel'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import PlateEditor from '@/components/shared/plate/plate-editor'
import { type ControlReviewFormData } from './use-control-review-form-schema'

type TReviewFieldsPanelProps = {
  form: UseFormReturn<ControlReviewFormData>
  clearAuditorNotes: boolean
  onAuditorNotesCleared: () => void
  auditorNotesLabel?: string
  auditorNotesPlaceholder?: string
}

const ReviewFieldsPanel: React.FC<TReviewFieldsPanelProps> = ({
  form,
  clearAuditorNotes,
  onAuditorNotesCleared,
  auditorNotesLabel = 'Auditor Notes',
  auditorNotesPlaceholder = 'Add notes about this review...',
}) => (
  <Panel className="p-4 flex flex-col gap-3">
    <p className="text-lg font-medium">Review</p>
    <FormField
      control={form.control}
      name="title"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            Review Title <span className="text-red-500">*</span>
          </FormLabel>
          <FormControl>
            <Input {...field} className="w-full" placeholder="Review title" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={form.control}
      name="testApplied"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Test Applied</FormLabel>
          <FormControl>
            <Textarea {...field} value={field.value ?? ''} rows={3} placeholder="Describe the test applied, e.g. Inspected the Human Resource Security Policy to determine that..." />
          </FormControl>
        </FormItem>
      )}
    />
    <FormField
      control={form.control}
      name="auditorNotes"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{auditorNotesLabel}</FormLabel>
          <FormControl>
            <PlateEditor onChange={field.onChange} initialValue="" clearData={clearAuditorNotes} onClear={onAuditorNotesCleared} placeholder={auditorNotesPlaceholder} />
          </FormControl>
        </FormItem>
      )}
    />
    <FormField
      control={form.control}
      name="externalID"
      render={({ field }) => (
        <FormItem>
          <FormLabel>External ID</FormLabel>
          <FormControl>
            <Input {...field} value={field.value ?? ''} className="w-full" placeholder="Optional external reference" />
          </FormControl>
        </FormItem>
      )}
    />
  </Panel>
)

export default ReviewFieldsPanel

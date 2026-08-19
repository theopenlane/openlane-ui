'use client'

import React, { useMemo } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { Panel } from '@repo/ui/panel'
import { Input } from '@repo/ui/input'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import PlateEditor from '@/components/shared/plate/plate-editor'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { ReadOnlyField } from '@/components/shared/read-only-field/read-only-field'
import { ReviewDocumentsSection } from '@/components/pages/protected/reviews/create/form/fields/documents-section'
import { type VendorReviewFormData } from './use-vendor-review-form-schema'

const DESCRIPTION_PLACEHOLDER = 'Add details about the review, findings, compensating controls, and any follow-up actions...'

type TVendorReviewFieldsPanelProps = {
  form: UseFormReturn<VendorReviewFormData>
  isEditing: boolean
  reviewId?: string
  savedDescription: string
  onStagedFilesChange: (files: File[]) => void
  onExistingFileIdsChange: (fileIds: string[]) => void
}

const VendorReviewFieldsPanel: React.FC<TVendorReviewFieldsPanelProps> = ({ form, isEditing, reviewId, savedDescription, onStagedFilesChange, onExistingFileIdsChange }) => {
  const { convertToReadOnly } = usePlateEditor()
  const description = useMemo(() => (savedDescription ? convertToReadOnly(savedDescription) : null), [savedDescription, convertToReadOnly])

  return (
    <Panel className="p-4 flex flex-col gap-3">
      <p className="text-lg font-medium">Review</p>
      {isEditing ? (
        <>
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
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Review Description</FormLabel>
                <FormControl>
                  <PlateEditor onChange={field.onChange} initialValue={savedDescription} placeholder={DESCRIPTION_PLACEHOLDER} />
                </FormControl>
              </FormItem>
            )}
          />
        </>
      ) : (
        <ReadOnlyField label="Review Description">{description}</ReadOnlyField>
      )}

      <ReviewDocumentsSection reviewId={reviewId} isCreate={!reviewId} isEditAllowed={isEditing} onStagedFilesChange={onStagedFilesChange} onExistingFileIdsChange={onExistingFileIdsChange} />
    </Panel>
  )
}

export default VendorReviewFieldsPanel

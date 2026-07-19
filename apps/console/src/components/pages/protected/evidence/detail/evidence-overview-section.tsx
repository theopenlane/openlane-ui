'use client'

import React, { useMemo } from 'react'
import { InfoIcon } from 'lucide-react'
import { FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'
import PlateEditor from '@/components/shared/plate/plate-editor'
import { type CreateEvidenceFormMethods } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { type EvidenceEditableField } from '@/components/pages/protected/evidence/evidence-sheet-config'
import EvidenceDetailSection from './evidence-detail-section'

type TEvidenceOverviewSectionProps = {
  form: CreateEvidenceFormMethods
  isEditing: boolean
  editField: EvidenceEditableField | null
  editAllowed: boolean
  onEdit: (field: EvidenceEditableField) => void
  onUpdateField: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  name?: string | null
  description?: string | null
  collectionProcedure?: string | null
  renderCollectionProcedure: (value: string) => React.ReactNode
}

const EvidenceOverviewSection: React.FC<TEvidenceOverviewSectionProps> = ({
  form,
  isEditing,
  editField,
  editAllowed,
  onEdit,
  onUpdateField,
  onKeyDown,
  name,
  description,
  collectionProcedure,
  renderCollectionProcedure,
}) => {
  const handleEdit = (field: EvidenceEditableField) => {
    if (editAllowed) onEdit(field)
  }

  const readOnlyProcedure = useMemo(() => (collectionProcedure ? renderCollectionProcedure(collectionProcedure) : null), [collectionProcedure, renderCollectionProcedure])

  return (
    <EvidenceDetailSection title="Overview">
      <div>
        <FormLabel className="text-muted-foreground text-xs">Evidence name</FormLabel>
        {isEditing || editField === 'name' ? (
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <Input variant="medium" {...field} className="w-full" onBlur={onUpdateField} onKeyDown={onKeyDown} autoFocus />
                </FormControl>
                {form.formState.errors.name && <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>}
              </FormItem>
            )}
          />
        ) : (
          <HoverPencilWrapper showPencil={editAllowed} pencilClass="!-right-5" className={`w-fit ${editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`} onPencilClick={() => handleEdit('name')}>
            <div onDoubleClick={() => handleEdit('name')}>{name ? <p className="font-medium">{name}</p> : <p className="text-gray-500">no name provided</p>}</div>
          </HoverPencilWrapper>
        )}
      </div>

      <div>
        <div className="flex items-center">
          <FormLabel className="text-muted-foreground text-xs">Description</FormLabel>
          <SystemTooltip icon={<InfoIcon size={14} className="mx-1" />} content={<p>Provide a short description of what is contained in the files or linked URLs.</p>} />
        </div>
        {isEditing || editField === 'description' ? (
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <Textarea id="description" {...field} className="w-full" onBlur={onUpdateField} onKeyDown={onKeyDown} autoFocus />
                </FormControl>
                {form.formState.errors.description && <p className="text-red-500 text-sm">{form.formState.errors.description.message}</p>}
              </FormItem>
            )}
          />
        ) : (
          <HoverPencilWrapper
            showPencil={editAllowed}
            pencilClass="!-right-5"
            className={`w-fit ${editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            onPencilClick={() => handleEdit('description')}
          >
            <div onDoubleClick={() => handleEdit('description')}>{description ? <p>{description}</p> : <p className="text-gray-500">no description provided</p>}</div>
          </HoverPencilWrapper>
        )}
      </div>

      <div className="rounded-md border border-border p-4">
        <div className="flex items-center">
          <FormLabel className="text-muted-foreground text-xs">Collection procedure</FormLabel>
          <SystemTooltip icon={<InfoIcon size={14} className="mx-1" />} content={<p>Write down the steps that were taken to collect the evidence.</p>} />
        </div>
        {isEditing || editField === 'collectionProcedure' ? (
          <FormField
            control={form.control}
            name="collectionProcedure"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <PlateEditor initialValue={field.value ?? ''} onChange={(val) => field.onChange(val)} />
                </FormControl>
                {form.formState.errors.collectionProcedure && <p className="text-red-500 text-sm">{form.formState.errors.collectionProcedure.message}</p>}
              </FormItem>
            )}
          />
        ) : (
          <div>{readOnlyProcedure ?? <p className="text-gray-500">no collection procedure provided</p>}</div>
        )}
      </div>
    </EvidenceDetailSection>
  )
}

export default EvidenceOverviewSection

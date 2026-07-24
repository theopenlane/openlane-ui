'use client'

import React, { useMemo } from 'react'
import { Calendar, CalendarCheck2, CalendarClock, CircuitBoard, Download, Eye, Fingerprint, LinkIcon, Maximize2, Radio, RefreshCw, Tag, UserRoundCheck, UserRoundPen } from 'lucide-react'
import NextLink from 'next/link'
import { Controller } from 'react-hook-form'
import { FormControl, FormField, FormItem } from '@repo/ui/form'
import { Input, InputRow } from '@repo/ui/input'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import MultipleSelector, { type Option } from '@repo/ui/multiple-selector'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { EvidenceFrequency } from '@repo/codegen/src/schema'
import { enumToOptions, getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { CreatableCustomTypeEnumSelect } from '@/components/shared/custom-type-enum-select/creatable-custom-type-enum-select'
import { CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import TagChip from '@/components/shared/tag-chip.tsx/tag-chip'
import { AuthorCell } from '@/components/shared/user-display/author-cell'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'
import { useNotification } from '@/hooks/useNotification'
import { formatDate } from '@/utils/date'
import { fileDownload } from '@/components/shared/lib/export'
import { type CreateEvidenceFormMethods } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { type EvidenceEditableField } from '@/components/pages/protected/evidence/evidence-sheet-config'
import EvidenceDetailSection from './evidence-detail-section'
import EvidenceDetailFieldRow from './evidence-detail-field-row'

const frequencyOptions = enumToOptions(EvidenceFrequency)

type TEvidenceMetadata = {
  source?: string | null
  url?: string | null
  creationDate?: string | null
  renewalDate?: string | null
  reviewFrequency?: EvidenceFrequency | null
  scopeName?: string | null
  environmentName?: string | null
  externalUUID?: string | null
  tags?: (string | null)[] | null
  createdAt?: string | null
  createdBy?: string | null
  updatedAt?: string | null
  updatedBy?: string | null
}

type TEvidenceMetadataSectionProps = {
  form: CreateEvidenceFormMethods
  evidence: TEvidenceMetadata
  isEditing: boolean
  editField: EvidenceEditableField | null
  editAllowed: boolean
  onEdit: (field: EvidenceEditableField) => void
  onUpdateField: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  triggerRef: React.RefObject<HTMLDivElement | null>
  popoverRef: React.RefObject<HTMLDivElement | null>
}

const EvidenceMetadataSection: React.FC<TEvidenceMetadataSectionProps> = ({ form, evidence, isEditing, editField, editAllowed, onEdit, onUpdateField, onKeyDown, triggerRef, popoverRef }) => {
  const { tagOptions } = useGetTags()
  const { errorNotification } = useNotification()
  const { enumOptions: scopeOptions, onCreateOption: onCreateScope } = useCreatableEnumOptions({ field: 'scope', isEditAllowed: editAllowed })
  const { enumOptions: environmentOptions, onCreateOption: onCreateEnvironment } = useCreatableEnumOptions({ field: 'environment', isEditAllowed: editAllowed })
  const authorMaps = useAuthorMaps([evidence.createdBy, evidence.updatedBy])

  const watchedTags = form.watch('tags')
  const tagValues = useMemo<Option[]>(() => (watchedTags ?? []).map((tag) => ({ value: tag, label: tag })), [watchedTags])

  const rowProps = { isEditing, editField, editAllowed, onEdit, triggerRef }

  return (
    <EvidenceDetailSection title="Renewal and metadata">
      <div className="space-y-4">
        <EvidenceDetailFieldRow
          {...rowProps}
          field="creationDate"
          icon={<Calendar size={16} />}
          label="Creation date"
          editControl={
            <FormField
              control={form.control}
              name="creationDate"
              render={({ field }) => (
                <FormItem ref={popoverRef} className="w-62.5">
                  <CalendarPopover
                    field={field}
                    defaultToday
                    required
                    onChange={(date) => {
                      field.onChange(date)
                      onUpdateField()
                    }}
                  />
                  {form.formState.errors.creationDate && <p className="text-red-500 text-sm">{form.formState.errors.creationDate.message}</p>}
                </FormItem>
              )}
            />
          }
        >
          <p>{formatDate(evidence.creationDate) || <span className="text-gray-500">no date provided</span>}</p>
        </EvidenceDetailFieldRow>

        <EvidenceDetailFieldRow
          {...rowProps}
          field="renewalDate"
          icon={<Calendar size={16} />}
          label="Renewal date"
          editControl={
            <FormField
              control={form.control}
              name="renewalDate"
              render={({ field }) => (
                <FormItem ref={popoverRef} className="w-62.5">
                  <CalendarPopover
                    field={field}
                    defaultAddDays={365}
                    onChange={(date) => {
                      field.onChange(date)
                      onUpdateField()
                    }}
                  />
                  {form.formState.errors.renewalDate && <p className="text-red-500 text-sm">{form.formState.errors.renewalDate.message}</p>}
                </FormItem>
              )}
            />
          }
        >
          <p>{formatDate(evidence.renewalDate) || <span className="text-gray-500">no date provided</span>}</p>
        </EvidenceDetailFieldRow>

        <EvidenceDetailFieldRow
          {...rowProps}
          field="reviewFrequency"
          icon={<RefreshCw size={16} />}
          label="Renewal frequency"
          editControl={
            <Controller
              name="reviewFrequency"
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    value={field.value ?? undefined}
                    onValueChange={(value) => {
                      field.onChange(value as EvidenceFrequency)
                      onUpdateField()
                    }}
                  >
                    <SelectTrigger className="w-62.5">{getEnumLabel(field.value ?? undefined) || 'Select'}</SelectTrigger>
                    <SelectContent ref={popoverRef}>
                      {frequencyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {getEnumLabel(option.value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.reviewFrequency && <p className="text-red-500 text-sm">{form.formState.errors.reviewFrequency.message}</p>}
                </>
              )}
            />
          }
        >
          <p>{evidence.reviewFrequency ? getEnumLabel(evidence.reviewFrequency) : <span className="text-gray-500">no frequency set</span>}</p>
        </EvidenceDetailFieldRow>

        <EvidenceDetailFieldRow
          {...rowProps}
          field="source"
          icon={<CircuitBoard size={16} />}
          label="Source"
          editControl={
            <InputRow className="w-full">
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Input variant="medium" {...field} className="w-62.5" onBlur={onUpdateField} onKeyDown={onKeyDown} autoFocus />
                    </FormControl>
                    {form.formState.errors.source && <p className="text-red-500 text-sm">{form.formState.errors.source.message}</p>}
                  </FormItem>
                )}
              />
            </InputRow>
          }
        >
          <p>{evidence.source || <span className="text-gray-500">no source provided</span>}</p>
        </EvidenceDetailFieldRow>

        <EvidenceDetailFieldRow
          {...rowProps}
          field="url"
          icon={<LinkIcon size={16} />}
          label="URL"
          editControl={
            <InputRow className="w-full">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Input variant="medium" {...field} className="w-62.5" onBlur={onUpdateField} onKeyDown={onKeyDown} autoFocus />
                    </FormControl>
                    {form.formState.errors.url && <p className="text-red-500 text-sm">{form.formState.errors.url.message}</p>}
                  </FormItem>
                )}
              />
            </InputRow>
          }
        >
          {evidence.url ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3 justify-end w-full">
                    <span className="truncate overflow-hidden whitespace-nowrap">{evidence.url}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <NextLink href={evidence.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {evidence.url}
                  </NextLink>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span className="text-gray-500">no url provided</span>
          )}
        </EvidenceDetailFieldRow>

        {!isEditing && evidence.url && (
          <div className="flex justify-end items-center gap-4 text-sm">
            <NextLink href={evidence.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 cursor-pointer">
              <Eye size={16} />
              View
            </NextLink>
            <button type="button" className="flex items-center gap-1 cursor-pointer" onClick={() => fileDownload(evidence.url ?? '', 'customFileName', errorNotification)}>
              <Download size={16} />
              Download
            </button>
          </div>
        )}

        <EvidenceDetailFieldRow
          {...rowProps}
          field="scopeName"
          icon={<Radio size={16} />}
          label="Scope"
          editControl={
            <Controller
              name="scopeName"
              control={form.control}
              render={({ field }) => (
                <CreatableCustomTypeEnumSelect
                  value={field.value ?? undefined}
                  options={scopeOptions}
                  onCreateOption={onCreateScope}
                  placeholder="Select scope"
                  searchPlaceholder="Search scope..."
                  triggerClassName="w-[250px]"
                  onValueChange={async (val) => {
                    field.onChange(val)
                    await onUpdateField()
                  }}
                />
              )}
            />
          }
        >
          {evidence.scopeName ? <CustomTypeEnumValue value={evidence.scopeName} options={scopeOptions} /> : <span className="text-gray-500">no scope provided</span>}
        </EvidenceDetailFieldRow>

        <EvidenceDetailFieldRow
          {...rowProps}
          field="environmentName"
          icon={<Maximize2 size={16} />}
          label="Environment"
          editControl={
            <Controller
              name="environmentName"
              control={form.control}
              render={({ field }) => (
                <CreatableCustomTypeEnumSelect
                  value={field.value ?? undefined}
                  options={environmentOptions}
                  onCreateOption={onCreateEnvironment}
                  placeholder="Select environment"
                  searchPlaceholder="Search environment..."
                  triggerClassName="w-[250px]"
                  onValueChange={async (val) => {
                    field.onChange(val)
                    await onUpdateField()
                  }}
                />
              )}
            />
          }
        >
          {evidence.environmentName ? <CustomTypeEnumValue value={evidence.environmentName} options={environmentOptions} /> : <span className="text-gray-500">no environment provided</span>}
        </EvidenceDetailFieldRow>

        <EvidenceDetailFieldRow
          {...rowProps}
          field="externalUUID"
          icon={<Fingerprint size={16} />}
          label="External ID"
          editControl={
            <InputRow className="w-full">
              <FormField
                control={form.control}
                name="externalUUID"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Input variant="medium" {...field} value={field.value ?? ''} className="w-62.5" onBlur={onUpdateField} onKeyDown={onKeyDown} autoFocus />
                    </FormControl>
                    {form.formState.errors.externalUUID && <p className="text-red-500 text-sm">{form.formState.errors.externalUUID.message}</p>}
                  </FormItem>
                )}
              />
            </InputRow>
          }
        >
          <p>{evidence.externalUUID || <span className="text-gray-500">no external id provided</span>}</p>
        </EvidenceDetailFieldRow>

        <EvidenceDetailFieldRow
          {...rowProps}
          field="tags"
          icon={<Tag size={16} />}
          label="Tags"
          editControl={
            <Controller
              name="tags"
              control={form.control}
              render={({ field }) => (
                <>
                  <MultipleSelector
                    placeholder="Add tag..."
                    creatable
                    className="w-62.5"
                    commandProps={{ className: 'w-full' }}
                    value={tagValues}
                    hideClearAllButton
                    options={tagOptions}
                    onChange={(selectedOptions) => field.onChange(selectedOptions.map((option) => option.value))}
                  />
                  {form.formState.errors.tags && <p className="text-red-500 text-sm">{form.formState.errors.tags.message}</p>}
                </>
              )}
            />
          }
        >
          {evidence.tags?.length ? (
            <div className="flex justify-end flex-wrap gap-2">{evidence.tags.map((tag) => tag && <TagChip key={tag} tag={tag} />)}</div>
          ) : (
            <span className="text-gray-500">no tags provided</span>
          )}
        </EvidenceDetailFieldRow>

        {!isEditing && (
          <>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm w-45">
                <CalendarCheck2 size={16} className="text-accent-secondary" />
                Created At
              </div>
              <p className="text-sm text-right">{formatDate(evidence.createdAt)}</p>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm w-45">
                <UserRoundCheck size={16} className="text-accent-secondary" />
                Created By
              </div>
              <AuthorCell id={evidence.createdBy} {...authorMaps} className="text-sm justify-end flex items-center gap-2" />
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm w-45">
                <CalendarClock size={16} className="text-accent-secondary" />
                Updated At
              </div>
              <p className="text-sm text-right">{formatDate(evidence.updatedAt)}</p>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm w-45">
                <UserRoundPen size={16} className="text-accent-secondary" />
                Updated By
              </div>
              <AuthorCell id={evidence.updatedBy} {...authorMaps} className="text-sm justify-end flex items-center gap-2" />
            </div>
          </>
        )}
      </div>
    </EvidenceDetailSection>
  )
}

export default EvidenceMetadataSection

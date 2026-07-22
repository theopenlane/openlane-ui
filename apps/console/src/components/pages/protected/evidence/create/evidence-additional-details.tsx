'use client'

import React, { useMemo } from 'react'
import { ChevronDown, ClipboardList, Clock, CircuitBoard, Folder, Layers, Tag } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import MultipleSelector, { type Option } from '@repo/ui/multiple-selector'
import PlateEditor from '@/components/shared/plate/plate-editor'
import ObjectAssociation from '@/components/shared/object-association/object-association'
import { type ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { EvidenceFrequency } from '@repo/codegen/src/schema'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { type CreateEvidenceFormMethods } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { type TFormEvidenceData } from '@/components/pages/protected/evidence/types/TFormEvidenceData'
import EvidenceLinkedProgramsPanel from '@/components/pages/protected/evidence/panels/evidence-linked-programs-panel'

type TEvidenceAdditionalDetailsProps = {
  form: CreateEvidenceFormMethods
  showCollectionProcedure: boolean
  tagOptions: Option[]
  associationProgramsRefMap: string[]
  setAssociationProgramsRefMap: React.Dispatch<React.SetStateAction<string[]>>
  onObjectAssociationChange: (updatedMap: TObjectAssociationMap) => void
  allowedObjectTypes?: ObjectTypeObjects[]
  defaultSelectedObject?: ObjectTypeObjects
  formData?: TFormEvidenceData
}

const frequencyOptions = enumToOptions(EvidenceFrequency)

type TSectionProps = {
  value: string
  icon: React.ReactNode
  title: string
  description?: string
  children: React.ReactNode
}

const Section: React.FC<TSectionProps> = ({ value, icon, title, description, children }) => (
  <AccordionItem value={value} className="border border-border rounded-md px-4 py-3">
    <AccordionTrigger asChild>
      <div className="flex items-center justify-between w-full cursor-pointer group">
        <div className="flex items-center gap-2">
          <span className="text-accent-secondary">{icon}</span>
          <span className="text-sm font-medium">{title}</span>
        </div>
        <ChevronDown size={18} className="text-brand transform -rotate-90 transition-transform group-data-[state=open]:rotate-0" />
      </div>
    </AccordionTrigger>
    <AccordionContent>
      <div className="pt-3 flex flex-col gap-4">
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        {children}
      </div>
    </AccordionContent>
  </AccordionItem>
)

const EvidenceAdditionalDetails: React.FC<TEvidenceAdditionalDetailsProps> = ({
  form,
  showCollectionProcedure,
  tagOptions,
  associationProgramsRefMap,
  setAssociationProgramsRefMap,
  onObjectAssociationChange,
  allowedObjectTypes,
  defaultSelectedObject,
  formData,
}) => {
  const watchedTags = form.watch('tags')
  const tagValues = useMemo<Option[]>(() => (watchedTags ?? []).map((tag) => ({ value: tag, label: tag })), [watchedTags])

  return (
    <div className="rounded-md border border-border p-4 bg-card">
      <p className="text-sm font-medium">Additional details (optional)</p>
      <p className="text-xs text-muted-foreground mt-1 mb-4">Add collection steps, link programs, or set renewal details.</p>

      <Accordion type="multiple" className="flex flex-col gap-3">
        {showCollectionProcedure && (
          <Section
            value="collectionProcedure"
            icon={<ClipboardList size={16} />}
            title="Collection Procedure"
            description="Describe how this evidence is collected, including the system, owner, steps, and expected output."
          >
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
          </Section>
        )}

        <Section value="programs" icon={<Folder size={16} />} title="Linked Program(s)">
          <EvidenceLinkedProgramsPanel form={form} refMap={associationProgramsRefMap} setRefMap={setAssociationProgramsRefMap} />
        </Section>

        <Section value="renewal" icon={<Clock size={16} />} title="Renewal settings">
          <FormField
            control={form.control}
            name="creationDate"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="mb-2 flex items-center">Creation Date</FormLabel>
                <CalendarPopover field={field} defaultToday required disableFuture />
                {form.formState.errors.creationDate && <p className="text-red-500 text-sm">{form.formState.errors.creationDate.message}</p>}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="renewalDate"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="mb-2 flex items-center">Renewal Date</FormLabel>
                <CalendarPopover field={field} defaultAddDays={365} disabledFrom={new Date()} />
                {field.value !== null && (
                  <p>
                    Don&apos;t want to renew this evidence?{' '}
                    <b className="text-sm cursor-pointer text-accent-secondary" onClick={() => field.onChange(null)}>
                      Clear it
                    </b>
                  </p>
                )}
                {form.formState.errors.renewalDate && <p className="text-red-500 text-sm">{form.formState.errors.renewalDate.message}</p>}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reviewFrequency"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="mb-2 flex items-center">Renewal Frequency</FormLabel>
                <FormControl>
                  <Select value={field.value ?? undefined} onValueChange={(val) => field.onChange(val as EvidenceFrequency)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select renewal frequency..." />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                {form.formState.errors.reviewFrequency && <p className="text-red-500 text-sm">{form.formState.errors.reviewFrequency.message}</p>}
              </FormItem>
            )}
          />
        </Section>

        <Section value="details" icon={<CircuitBoard size={16} />} title="Source and tags">
          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="mb-2 flex items-center">Source</FormLabel>
                <FormControl>
                  <Input variant="medium" {...field} className="w-full" placeholder="System the evidence was pulled from" />
                </FormControl>
                {form.formState.errors.source && <p className="text-red-500 text-sm">{form.formState.errors.source.message}</p>}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="mb-2 flex items-center">
                  <Tag size={14} className="mr-1" />
                  Tags
                </FormLabel>
                <FormControl>
                  <MultipleSelector
                    options={tagOptions}
                    placeholder="Add tag..."
                    creatable
                    value={tagValues}
                    onChange={(selectedOptions) => field.onChange(selectedOptions.map((option) => option.value))}
                    className="w-full"
                  />
                </FormControl>
                {form.formState.errors.tags && <p className="text-red-500 text-sm">{form.formState.errors.tags.message}</p>}
              </FormItem>
            )}
          />
        </Section>

        <Section
          value="associations"
          icon={<Layers size={16} />}
          title="Associate more objects"
          description="Associating objects will allow users with access to the object to see the created evidence."
        >
          <ObjectAssociation onIdChange={onObjectAssociationChange} allowedObjectTypes={allowedObjectTypes} initialData={formData?.objectAssociations} defaultSelectedObject={defaultSelectedObject} />
        </Section>
      </Accordion>
    </div>
  )
}

export default EvidenceAdditionalDetails

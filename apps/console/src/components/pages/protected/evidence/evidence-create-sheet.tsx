'use client'
import { Grid, GridCell, GridRow } from '@repo/ui/grid'
import React, { useCallback, useEffect, useState } from 'react'
import { ChevronDown, InfoIcon, Plus, X } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import useFormSchema, { type CreateEvidenceFormData } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { Input, InputRow } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import MultipleSelector from '@repo/ui/multiple-selector'
import { Button } from '@repo/ui/button'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { type CreateEvidenceInput } from '@repo/codegen/src/schema'
import EvidenceUploadForm from '@/components/pages/protected/evidence/upload/evidence-upload-form'
import { useNotification } from '@/hooks/useNotification'
import { type Option } from '@repo/ui/multiple-selector'
import { useCreateEvidence } from '@/lib/graphql-hooks/evidence'
import { type TFormEvidenceData } from '@/components/pages/protected/evidence/types/TFormEvidenceData.ts'
import ObjectAssociation from '@/components/shared/object-association/object-association'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { Panel } from '@repo/ui/panel'
import { useQueryClient } from '@tanstack/react-query'
import { type TUploadedFile } from './upload/types/TUploadedFile'
import { useRouter, useSearchParams } from 'next/navigation'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { Sheet, SheetContent, SheetHeader } from '@repo/ui/sheet'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'
import { ProgramSelectionDialog } from '@/components/shared/object-association/object-association-programs-dialog'
import { ControlSelectionDialog } from '@/components/shared/object-association/object-association-control-dialog'
import ObjectAssociationProgramsChips from '@/components/shared/object-association/object-association-programs-chips'
import ObjectAssociationControlsChips from '@/components/shared/object-association/object-association-controls-chips'
import { type CustomEvidenceControl, EVIDENCE_ASSOCIATION_FIELDS } from './evidence-sheet-config'
import { useEvidenceSuggestedControls } from './hooks/use-evidence-suggested-controls'
import Link from 'next/link'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import PlateEditor from '@/components/shared/plate/plate-editor'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { EvidenceEvidenceStatus } from '@repo/codegen/src/schema'

type TEvidenceCreateSheetProps = {
  formData?: TFormEvidenceData
  onEvidenceCreateSuccess?: () => void
  allowedObjectTypes?: ObjectTypeObjects[]
  defaultSelectedObject?: ObjectTypeObjects
  open: boolean
  onOpenChange: (open: boolean) => void
  controlParam?: CustomEvidenceControl[]
}

const EvidenceCreateSheet: React.FC<TEvidenceCreateSheetProps> = ({
  formData,
  onEvidenceCreateSuccess,
  allowedObjectTypes,
  defaultSelectedObject,
  open,
  onOpenChange,
  controlParam,
}: TEvidenceCreateSheetProps) => {
  const { form } = useFormSchema()
  const { successNotification, errorNotification } = useNotification()
  const [tagValues, setTagValues] = useState<Option[]>([])
  const [resetEvidenceFiles, setResetEvidenceFiles] = useState(false)
  const [evidenceObjectTypes, setEvidenceObjectTypes] = useState<TObjectAssociationMap>()
  const { mutateAsync: createEvidence, isPending } = useCreateEvidence()
  const searchParams = useSearchParams()
  const programId = searchParams.get('programId')
  const queryClient = useQueryClient()
  const [openControlsDialog, setOpenControlsDialog] = useState(false)
  const router = useRouter()
  const [associationProgramsRefMap, setAssociationProgramsRefMap] = useState<string[]>([])

  const [evidenceControls, setEvidenceControls] = useState<CustomEvidenceControl[] | null>(null)
  const [evidenceSubcontrols, setEvidenceSubcontrols] = useState<CustomEvidenceControl[] | null>(null)

  const [openProgramsDialog, setOpenProgramsDialog] = useState(false)
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState<boolean>(false)
  const { tagOptions } = useGetTags()

  const { convertToHtml } = usePlateEditor()

  const onSubmitHandler = async (data: CreateEvidenceFormData) => {
    const collectionProcedure = data.collectionProcedure && typeof data.collectionProcedure !== 'string' ? await convertToHtml(data.collectionProcedure) : data.collectionProcedure

    const input: CreateEvidenceInput = {
      name: data.name,
      description: data.description,
      tags: data.tags,
      creationDate: data.creationDate,
      renewalDate: data.renewalDate,
      collectionProcedure,
      source: data.source,
      fileIDs: data.fileIDs,
      taskIDs: data.taskIDs,
      ...evidenceObjectTypes,
      controlIDs: data.controlIDs,
      subcontrolIDs: data.subcontrolIDs,
      programIDs: programId ? [programId] : (data.programIDs ?? []),
      ...(data.url ? { url: data.url } : {}),
      ...(data.status ? { status: data.status } : {}),
    }

    const payload = {
      input,
      evidenceFiles: data.evidenceFiles?.map((item) => item.file) || [],
    }

    try {
      const res = await createEvidence(payload)
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0]
          return typeof key === 'string' && ['controls', 'programs', 'tasks', 'subcontrols', 'controlObjectives', 'evidences'].includes(key)
        },
      })

      if (onEvidenceCreateSuccess) {
        onEvidenceCreateSuccess()
      }
      setEvidenceSubcontrols(null)
      setEvidenceControls(null)
      form.reset()

      if (!res.createEvidence.evidence.id) return
      const id = res.createEvidence.evidence.id
      if (defaultSelectedObject === ObjectTypeObjects.TASK || defaultSelectedObject === ObjectTypeObjects.CONTROL) {
        successNotification({
          title: 'Evidence Created',
          description: (
            <>
              Evidence has been successfully created.{' '}
              <Link href={`/evidence?id=${id}`} className="text-blue-600 underline">
                View Evidence
              </Link>
            </>
          ),
        })
        onOpenChange(false)
        return
      } else {
        successNotification({
          title: 'Evidence Created',
          description: `Evidence has been successfully created`,
        })
        router.push(`/evidence?id=${id}`)
      }
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const handleInitialValue = useCallback(() => {
    if (formData) {
      if (controlParam && controlParam.length) {
        const newEvidenceControls: CustomEvidenceControl[] = []
        const newEvidenceSubcontrols: CustomEvidenceControl[] = []

        controlParam.forEach((control) => {
          if (control.__typename === ObjectTypes.CONTROL) {
            newEvidenceControls.push(control)
          } else {
            newEvidenceSubcontrols.push(control)
          }
        })

        setEvidenceControls(newEvidenceControls)
        setEvidenceSubcontrols(newEvidenceSubcontrols)
      }

      form.setValue('name', `Evidence for ${formData.displayID}`)
      for (const key of EVIDENCE_ASSOCIATION_FIELDS) {
        const value = formData.objectAssociations[key]
        if (value) {
          form.setValue(key, value)
        }
      }

      if (formData?.tags) {
        form.setValue('tags', formData.tags)
        const tags = formData.tags.map((item) => {
          return {
            value: item,
            label: item,
          }
        })
        setTagValues(tags)
      }
      if (formData && formData.objectAssociations) {
        form.setValue('controlIDs', formData.objectAssociations.controlIDs ? formData.objectAssociations.controlIDs : [])
        form.setValue('programIDs', formData.objectAssociations.programIDs ? formData.objectAssociations.programIDs : [])
        form.setValue('subcontrolIDs', formData.objectAssociations.subcontrolIDs ? formData.objectAssociations.subcontrolIDs : [])

        setAssociationProgramsRefMap(formData.programDisplayIDs ? formData.programDisplayIDs : [])
      }
    }
  }, [form, formData, controlParam])

  const { suggestedControlsMap, isLoading: isSuggestionsLoading } = useEvidenceSuggestedControls({
    evidenceControls,
    evidenceSubcontrols,
    enabled: open,
  })

  useEffect(() => {
    handleInitialValue()
  }, [handleInitialValue])

  const handleOnOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setIsDiscardDialogOpen(true)
    } else {
      onOpenChange?.(true)
    }
    handleInitialValue()
  }

  const handleSheetClose = () => {
    setIsDiscardDialogOpen(true)
  }

  const programIDs = form.watch('programIDs')

  const programsAccordionValue = (programIDs?.length || 0) > 0 ? 'ProgramsAccordion' : undefined

  const handleEvidenceObjectIdsChange = useCallback((updatedMap: TObjectAssociationMap) => {
    setEvidenceObjectTypes(updatedMap)
  }, [])

  const handleUploadedFiles = (evidenceFiles: TUploadedFile[]) => {
    const evidenceFilesFiltered = evidenceFiles?.filter((item) => item.type === 'file')
    if (evidenceFilesFiltered) {
      form.setValue('evidenceFiles', evidenceFilesFiltered)
    }
  }

  const handleResetEvidenceFiles = () => {
    setResetEvidenceFiles(false)
  }

  const handleSavePrograms = (newIds: string[], newRefCodes: string[]) => {
    setAssociationProgramsRefMap(newRefCodes || [])

    form.setValue('programIDs', newIds)
  }

  return (
    <Sheet open={open} onOpenChange={handleOnOpenChange}>
      <SheetContent
        side="right"
        className="bg-secondary flex flex-col"
        minWidth={470}
        header={
          <SheetHeader className="mb-5">
            <div className="flex items-center justify-between">
              <span className="text-2xl leading-8 font-medium">
                {controlParam && controlParam?.length > 0 ? (
                  <span className="text-2xl leading-8 font-medium whitespace-nowrap">{`Evidence for ${Array.from(new Set(controlParam.map((c) => c.refCode))).join(', ')}`}</span>
                ) : (
                  <span className="text-2xl leading-8 font-medium">{`Evidence ${formData?.displayID ? 'for ' + formData.displayID : ''}`}</span>
                )}
              </span>
              <X aria-label="Close sheet" size={20} className="cursor-pointer" onClick={handleSheetClose} />
            </div>
          </SheetHeader>
        }
      >
        <Grid>
          {/* Form Section */}
          <GridRow columns={1}>
            <GridCell>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitHandler)} className="flex flex-col gap-4">
                  {/* Name Field */}
                  <InputRow className="w-full">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <div className="flex items-center">
                            <FormLabel>Evidence name</FormLabel>
                            <SystemTooltip
                              icon={<InfoIcon size={14} className="mx-1 mt-1" />}
                              content={<p>Provide a name for the evidence, generally should include the related Control or Task.</p>}
                            />
                          </div>
                          <FormControl>
                            <Input variant="medium" {...field} className="w-full" />
                          </FormControl>
                          {form.formState.errors.name && <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>}
                        </FormItem>
                      )}
                    />
                  </InputRow>

                  {/* Description Field */}
                  <InputRow className="w-full">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <div className="flex items-center">
                            <FormLabel>Description</FormLabel>
                            <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Provide a short description of what is contained in the files or linked URLs.</p>} />
                          </div>
                          <FormControl>
                            <Textarea id="description" {...field} className="w-full" />
                          </FormControl>
                          {form.formState.errors.description && <p className="text-red-500 text-sm">{form.formState.errors.description.message}</p>}
                        </FormItem>
                      )}
                    />
                  </InputRow>

                  {/* Collection Procedure */}
                  <InputRow className="w-full">
                    <FormField
                      control={form.control}
                      name="collectionProcedure"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <div className="flex items-center">
                            <FormLabel>Collection Procedure</FormLabel>
                            <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Write down the steps that were taken to collect the evidence.</p>} />
                          </div>
                          <FormControl>
                            <PlateEditor initialValue={field.value ?? ''} onChange={(val) => field.onChange(val)} />
                          </FormControl>
                          {form.formState.errors.collectionProcedure && <p className="text-red-500 text-sm">{form.formState.errors.collectionProcedure.message}</p>}
                        </FormItem>
                      )}
                    />
                  </InputRow>

                  {/* Source Field */}
                  <InputRow className="w-full">
                    <FormField
                      control={form.control}
                      name="source"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <div className="flex items-center">
                            <FormLabel>Source</FormLabel>
                            <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>System the evidence was pulled from.</p>} />
                          </div>
                          <FormControl>
                            <Input variant="medium" {...field} className="w-full" />
                          </FormControl>
                          {form.formState.errors.source && <p className="text-red-500 text-sm">{form.formState.errors.source.message}</p>}
                        </FormItem>
                      )}
                    />
                  </InputRow>

                  {/* Status Field */}
                  <InputRow className="w-full">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <div className="flex items-center">
                            <FormLabel>Status</FormLabel>
                          </div>
                          <FormControl>
                            <Select value={field.value ?? undefined} onValueChange={(val) => field.onChange(val === 'none' ? undefined : val)}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select status..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {Object.values(EvidenceEvidenceStatus).map((status) => (
                                  <SelectItem key={status} value={status}>
                                    {status
                                      .toLowerCase()
                                      .replace(/_/g, ' ')
                                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          {form.formState.errors.status && <p className="text-red-500 text-sm">{form.formState.errors.status.message}</p>}
                        </FormItem>
                      )}
                    />
                  </InputRow>

                  {/* Tags Field */}
                  <InputRow className="w-full">
                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel>Tags</FormLabel>
                          <FormControl>
                            <MultipleSelector
                              options={tagOptions}
                              placeholder="Add tag..."
                              creatable
                              value={tagValues}
                              onChange={(selectedOptions) => {
                                const options = selectedOptions.map((option) => option.value)
                                field.onChange(options)
                                setTagValues(
                                  selectedOptions.map((item) => ({
                                    value: item.value,
                                    label: item.label,
                                  })),
                                )
                              }}
                              className="w-full"
                            />
                          </FormControl>
                          {form.formState.errors.tags && <p className="text-red-500 text-sm">{form.formState.errors.tags.message}</p>}
                        </FormItem>
                      )}
                    />
                  </InputRow>
                  <div>
                    {/* Creation Date */}
                    <InputRow className="w-full">
                      <FormField
                        control={form.control}
                        name="creationDate"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel className="mb-2 flex items-center">
                              Creation Date
                              <SystemTooltip
                                icon={<InfoIcon size={14} className="mx-1 mt-1" />}
                                content={<p>The date the evidence was collected, generally the current date but can be adjusted.</p>}
                              />
                            </FormLabel>
                            <CalendarPopover field={field} defaultToday required disableFuture />
                            {form.formState.errors.creationDate && <p className="text-red-500 text-sm">{form.formState.errors.creationDate.message}</p>}
                          </FormItem>
                        )}
                      />
                    </InputRow>

                    {/* Renewal Date */}
                    <InputRow className="w-full mt-4">
                      <FormField
                        control={form.control}
                        name="renewalDate"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel className="mb-2 flex items-center">
                              Renewal Date
                              <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>The date the evidence will be re-requested.</p>} />
                            </FormLabel>
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
                    </InputRow>
                  </div>
                </form>
                <div className="flex flex-col gap-4 mt-4">
                  <GridRow columns={1}>
                    <GridCell>
                      <Panel>
                        <Accordion type="single" collapsible defaultValue="ControlsAccordion" className="w-full">
                          <AccordionItem value="ControlsAccordion">
                            <div className="flex items-center justify-between w-full">
                              <AccordionTrigger asChild>
                                <div className="flex items-center gap-2 cursor-pointer group">
                                  <ChevronDown size={22} className="text-brand transform -rotate-90 transition-transform group-data-[state=open]:rotate-0" />
                                  <span className="text-sm font-medium">Linked Control(s)</span>
                                  <span className="rounded-full border border-border text-xs text-muted-foreground flex justify-center items-center h-[26px] w-[26px]">
                                    {(form.getValues('subcontrolIDs')?.length || 0) + (form.getValues('controlIDs')?.length || 0)}
                                  </span>
                                </div>
                              </AccordionTrigger>
                              <Button
                                variant="secondary"
                                className="py-5"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenControlsDialog(true)
                                }}
                                icon={<Plus />}
                                iconPosition="left"
                              >
                                Add Controls
                              </Button>
                            </div>

                            <AccordionContent>
                              <div className="mt-5 flex flex-col gap-5">
                                <ObjectAssociationControlsChips
                                  form={form}
                                  suggestedControlsMap={suggestedControlsMap}
                                  isLoadingSuggestions={isSuggestionsLoading}
                                  evidenceControls={evidenceControls}
                                  setEvidenceControls={setEvidenceControls}
                                  evidenceSubcontrols={evidenceSubcontrols}
                                  setEvidenceSubcontrols={setEvidenceSubcontrols}
                                />
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                        <ControlSelectionDialog
                          open={openControlsDialog}
                          onClose={() => setOpenControlsDialog(false)}
                          form={form}
                          evidenceControls={evidenceControls}
                          setEvidenceControls={setEvidenceControls}
                          evidenceSubcontrols={evidenceSubcontrols}
                          setEvidenceSubcontrols={setEvidenceSubcontrols}
                        />
                      </Panel>
                    </GridCell>
                  </GridRow>
                  <GridRow columns={1}>
                    <GridCell>
                      <Panel>
                        <Accordion type="single" collapsible value={programsAccordionValue} className="w-full">
                          <AccordionItem value="ProgramsAccordion">
                            <div className="flex items-center justify-between w-full">
                              <AccordionTrigger asChild>
                                <div className="flex items-center gap-2 cursor-pointer group">
                                  <ChevronDown size={22} className="text-brand transform -rotate-90 transition-transform group-data-[state=open]:rotate-0" />
                                  <span className="text-sm font-medium">Linked Program(s)</span>
                                  <span className="rounded-full border border-border text-xs text-muted-foreground flex justify-center items-center h-[26px] w-[26px]">
                                    {form.getValues('programIDs')?.length || 0}
                                  </span>
                                </div>
                              </AccordionTrigger>

                              <Button
                                variant="secondary"
                                className="py-5"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenProgramsDialog(true)
                                }}
                                type="button"
                                icon={<Plus />}
                                iconPosition="left"
                              >
                                Add Programs
                              </Button>
                            </div>

                            <AccordionContent>
                              <div className="mt-5 flex flex-col gap-5">
                                <ObjectAssociationProgramsChips form={form} refMap={associationProgramsRefMap} setRefMap={setAssociationProgramsRefMap} />
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>

                        <ProgramSelectionDialog
                          form={form}
                          open={openProgramsDialog}
                          onClose={() => setOpenProgramsDialog(false)}
                          initialRefCodes={associationProgramsRefMap}
                          onSave={handleSavePrograms}
                        />
                      </Panel>
                    </GridCell>
                  </GridRow>
                  {/* Object Association Panel */}
                  <GridRow columns={1}>
                    <GridCell>
                      <Panel>
                        <Accordion type="single" collapsible value={undefined} className="w-full">
                          <AccordionItem value="TITLE">
                            <div className="flex items-center justify-between w-full">
                              <AccordionTrigger asChild>
                                <button className="group flex items-center gap-2 text-sm font-medium bg-unset">
                                  <ChevronDown size={22} className="text-brand transform rotate-90 transition-transform group-data-[state=open]:rotate-0" />
                                  Associate more objects
                                </button>
                              </AccordionTrigger>
                            </div>

                            <AccordionContent className="mt-4 flex flex-col gap-4">
                              <ObjectAssociation
                                onIdChange={handleEvidenceObjectIdsChange}
                                allowedObjectTypes={allowedObjectTypes}
                                initialData={formData?.objectAssociations}
                                defaultSelectedObject={defaultSelectedObject}
                              />
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </Panel>
                    </GridCell>
                  </GridRow>
                </div>

                <p className="pt-5 pb-5">Provide supporting file(s)</p>
                <EvidenceUploadForm evidenceFiles={handleUploadedFiles} resetEvidenceFiles={resetEvidenceFiles} setResetEvidenceFiles={handleResetEvidenceFiles} form={form} />
              </Form>
            </GridCell>
          </GridRow>
          {/* Submit Button */}
          <GridRow columns={1}>
            <GridCell>
              <Button onClick={form.handleSubmit(onSubmitHandler)} loading={isPending} disabled={isPending}>
                {isPending ? 'Submitting...' : 'Submit for review'}
              </Button>
            </GridCell>
          </GridRow>
        </Grid>
        <CancelDialog
          isOpen={isDiscardDialogOpen}
          onConfirm={() => {
            setIsDiscardDialogOpen(false)
            onOpenChange(false)
            setEvidenceSubcontrols(null)
            setEvidenceControls(null)
            form.reset()
          }}
          onCancel={() => setIsDiscardDialogOpen(false)}
        />
      </SheetContent>
    </Sheet>
  )
}

export default EvidenceCreateSheet

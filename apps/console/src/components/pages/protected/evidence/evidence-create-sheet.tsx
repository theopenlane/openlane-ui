'use client'
import { Grid, GridCell, GridRow } from '@repo/ui/grid'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { ChevronDown, InfoIcon, Plus } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import useFormSchema, { CreateEvidenceFormData } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { Input, InputRow } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import MultipleSelector from '@repo/ui/multiple-selector'
import { Button } from '@repo/ui/button'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { useRouter } from 'next/navigation'
import { CreateEvidenceInput } from '@repo/codegen/src/schema'
import EvidenceUploadForm from '@/components/pages/protected/evidence/upload/evidence-upload-form'
import { useNotification } from '@/hooks/useNotification'
import { Option } from '@repo/ui/multiple-selector'
import { useCreateEvidence } from '@/lib/graphql-hooks/evidence'
import { TFormEvidenceData } from '@/components/pages/protected/evidence/types/TFormEvidenceData.ts'
import ObjectAssociation from '@/components/shared/objectAssociation/object-association'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { useQueryClient } from '@tanstack/react-query'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { TUploadedFile } from './upload/types/TUploadedFile'
import { useSearchParams } from 'next/navigation'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { Sheet, SheetContent } from '@repo/ui/sheet'
import ObjectAssociationControls from '@/components/shared/objectAssociation/object-association-controls'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import ObjectAssociationPrograms from '@/components/shared/objectAssociation/object-association-programs'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'
import { ProgramSelectionDialog } from '@/components/shared/objectAssociation/object-association-programs-dialog'
import { ControlSelectionDialog } from '@/components/shared/objectAssociation/object-association-control-dialog'
import { PageHeading } from '@repo/ui/page-heading'

type EvidenceCreateSheetProps = {
  formData?: TFormEvidenceData
  onEvidenceCreateSuccess?: () => void
  excludeObjectTypes?: ObjectTypeObjects[]
  defaultSelectedObject?: ObjectTypeObjects
  open: boolean
  onOpenChange: (open: boolean) => void
}

const EvidenceCreateSheet: React.FC<EvidenceCreateSheetProps> = ({ formData, onEvidenceCreateSuccess, excludeObjectTypes, defaultSelectedObject, open, onOpenChange }: EvidenceCreateSheetProps) => {
  const { form } = useFormSchema()
  const { successNotification, errorNotification } = useNotification()
  const [tagValues, setTagValues] = useState<Option[]>([])
  const [resetEvidenceFiles, setResetEvidenceFiles] = useState(false)
  const [evidenceObjectTypes, setEvidenceObjectTypes] = useState<TObjectAssociationMap>()
  const { mutateAsync: createEvidence, isPending } = useCreateEvidence()
  const { setCrumbs } = useContext(BreadcrumbContext)
  const searchParams = useSearchParams()
  const programId = searchParams.get('programId')
  const queryClient = useQueryClient()
  const router = useRouter()
  const [openControlsDialog, setOpenControlsDialog] = useState(false)

  const [associationControlsRefMap, setAssociationControlsRefMap] = useState<string[]>([])
  const [associationSubControlsRefMap, setAssociationSubControlsRefMap] = useState<string[]>([])
  const [associationSubControlsFrameworksMap, setAssociationSubControlsFrameworksMap] = useState<Record<string, string>>({})
  const [associationControlsFrameworksMap, setAssociationControlsFrameworksMap] = useState<Record<string, string>>({})
  const [associationProgramsRefMap, setAssociationProgramsRefMap] = useState<string[]>([])
  const [controlsAccordionValue, setControlsAccordionValue] = useState<string | undefined>(() => {
    const initialCount = (form.getValues('subcontrolIDs')?.length || 0) + (form.getValues('controlIDs')?.length || 0)
    return initialCount > 0 ? 'ControlsAccordion' : undefined
  })

  const [programsAccordionValue, setProgramsAccordionValue] = useState<string | undefined>(() => {
    const initialCount = form.getValues('programIDs')?.length || 0
    return initialCount > 0 ? 'ProgramsAccordion' : undefined
  })

  const [openProgramsDialog, setOpenProgramsDialog] = useState(false)
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState<boolean>(false)

  const onSubmitHandler = async (data: CreateEvidenceFormData) => {
    const mergedEvidenceObjectTypes: TObjectAssociationMap = Object.fromEntries(
      Object.entries({
        taskIDs: evidenceObjectTypes?.taskIDs,
        controlObjectiveIDs: evidenceObjectTypes?.controlObjectiveIDs,
      }).filter(([, value]) => value !== undefined),
    ) as TObjectAssociationMap

    const formData = {
      input: {
        name: data.name,
        description: data.description,
        tags: data.tags,
        creationDate: data.creationDate,
        renewalDate: data.renewalDate,
        collectionProcedure: data.collectionProcedure,
        source: data.source,
        fileIDs: data.fileIDs,
        controlIDs: data.controlIDs,
        taskIDs: data.taskIDs,
        subcontrolIDs: data.subcontrolIDs,
        ...(programId ? { programIDs: [programId] } : {}),
        ...(data.url ? { url: data.url } : {}),
        ...mergedEvidenceObjectTypes,
      } as CreateEvidenceInput,
      evidenceFiles: data.evidenceFiles?.map((item) => item.file) || [],
    }

    try {
      const res = await createEvidence(formData)
      successNotification({
        title: 'Evidence Created',
        description: `Evidence has been successfully created`,
      })
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0]
          return ['controls', 'programs', 'tasks', 'subcontrols', 'controlObjectives'].includes(key as string)
        },
      })

      if (onEvidenceCreateSuccess) {
        onEvidenceCreateSuccess()
      }
      if (res.createEvidence.evidence.id) router.push(`/evidence?id=${res.createEvidence.evidence.id}`)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }
  const handleInitialValue = useCallback(() => {
    if (formData) {
      form.setValue('name', `Evidence for ${formData.displayID}`)
      for (const [key, value] of Object.entries(formData.objectAssociations)) {
        form.setValue(key as keyof CreateEvidenceFormData, value)
      }

      if (formData?.tags) {
        form.setValue('tags', formData.tags)
        const tags = formData.tags.map((item) => {
          return {
            value: item,
            label: item,
          } as Option
        })
        setTagValues(tags)
      }
      if (formData && formData.objectAssociations) {
        form.setValue('controlIDs', formData.objectAssociations.controlIDs ? formData.objectAssociations.controlIDs : [])
        form.setValue('programIDs', formData.objectAssociations.programIDs ? formData.objectAssociations.programIDs : [])
        form.setValue('subcontrolIDs', formData.objectAssociations.subcontrolIDs ? formData.objectAssociations.subcontrolIDs : [])

        setAssociationControlsRefMap(formData.controlRefCodes ? [...formData.controlRefCodes] : [])
        setAssociationControlsFrameworksMap({
          ...(formData.referenceFramework || {}),
        })

        setAssociationSubControlsRefMap(formData.subcontrolRefCodes ? [...formData.subcontrolRefCodes] : [])
        setAssociationSubControlsFrameworksMap({
          ...(formData.subcontrolReferenceFramework || {}),
        })

        setAssociationProgramsRefMap(formData.programDisplayIDs ? [...formData.programDisplayIDs] : [])
      }
    }
  }, [form, formData])

  useEffect(() => {
    if (!open) {
      handleInitialValue()
    } else handleInitialValue()
  }, [handleInitialValue, open])

  const subcontrolIDs = form.watch('subcontrolIDs')
  const controlIDs = form.watch('controlIDs')
  const programIDs = form.watch('programIDs')

  useEffect(() => {
    const controlsCount = (subcontrolIDs?.length || 0) + (controlIDs?.length || 0)
    const programsCount = programIDs?.length || 0
    setControlsAccordionValue(controlsCount > 0 ? 'ControlsAccordion' : undefined)
    setProgramsAccordionValue(programsCount > 0 ? 'ProgramsAccordion' : undefined)
  }, [subcontrolIDs, controlIDs, programIDs])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Evidence', href: '/evidence' },
    ])
  }, [setCrumbs])

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

  const handleSaveControls = (
    newIds: string[],
    subcontrolsNewIds: string[],
    newControlRefCodes: string[],
    newSubcontrolRefCodes: string[],
    frameworks: Record<string, string>,
    subcontrolFrameworks: Record<string, string>,
  ) => {
    const mergedControlRefCodes = [...(associationControlsRefMap || []), ...(newControlRefCodes || [])]
    const uniqueControlRefCodes = Array.from(new Set(mergedControlRefCodes))

    const mergedSubcontrolRefCodes = [...(associationSubControlsRefMap || []), ...(newSubcontrolRefCodes || [])]
    const uniqueSubcontrolRefCodes = Array.from(new Set(mergedSubcontrolRefCodes))

    form.setValue('controlIDs', newIds)
    form.setValue('subcontrolIDs', subcontrolsNewIds)

    setAssociationControlsRefMap(uniqueControlRefCodes)
    setAssociationSubControlsRefMap(uniqueSubcontrolRefCodes)

    setAssociationControlsFrameworksMap((prev) => ({ ...(prev || {}), ...(frameworks || {}) }))
    setAssociationSubControlsFrameworksMap((prev) => ({ ...(prev || {}), ...(subcontrolFrameworks || {}) }))
  }

  const handleSavePrograms = (newIds: string[], newRefCodes: string[]) => {
    setAssociationProgramsRefMap(newRefCodes || [])

    form.setValue('programIDs', newIds)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setIsDiscardDialogOpen(true)
        } else {
          onOpenChange(true)
        }
      }}
    >
      <SheetContent side="right" className="bg-card flex flex-col" minWidth={470}>
        <PageHeading heading={`Submit evidence ${formData?.displayID ? 'for' : ''} ${formData?.displayID || ''}`}></PageHeading>
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
                            <Textarea id="collectionProcedure" {...field} className="w-full" />
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
                        <Accordion type="single" collapsible value={controlsAccordionValue} onValueChange={setControlsAccordionValue} className="w-full">
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
                                variant="outline"
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
                                <ObjectAssociationControls
                                  form={form}
                                  controlsRefMap={associationControlsRefMap}
                                  setControlsRefMap={setAssociationControlsRefMap}
                                  subcontrolsRefMap={associationSubControlsRefMap}
                                  setSubcontrolsRefMap={setAssociationSubControlsRefMap}
                                  subcontrolFrameworksMap={associationSubControlsFrameworksMap}
                                  setSubcontrolsFrameworksMap={setAssociationSubControlsFrameworksMap}
                                  frameworksMap={associationControlsFrameworksMap}
                                  setFrameworksMap={setAssociationControlsFrameworksMap}
                                />
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                        <ControlSelectionDialog
                          open={openControlsDialog}
                          onClose={() => setOpenControlsDialog(false)}
                          initialFramework={associationControlsFrameworksMap}
                          initialControlRefCodes={associationControlsRefMap}
                          initialSubcontrolRefCodes={associationSubControlsRefMap}
                          initialSubcontrolFramework={associationSubControlsFrameworksMap}
                          onSave={handleSaveControls}
                          form={form}
                        />
                      </Panel>
                    </GridCell>
                  </GridRow>
                  <GridRow columns={1}>
                    <GridCell>
                      <Panel>
                        <Accordion type="single" collapsible value={programsAccordionValue} onValueChange={setProgramsAccordionValue} className="w-full">
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
                                variant="outline"
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
                                <ObjectAssociationPrograms form={form} refMap={associationProgramsRefMap} setRefMap={setAssociationProgramsRefMap} />
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
                                <button className="group flex items-center gap-2 text-sm font-medium">
                                  <ChevronDown size={22} className="text-brand transform rotate-[-90deg] transition-transform group-data-[state=open]:rotate-0" />
                                  Associate more objects
                                </button>
                              </AccordionTrigger>
                            </div>

                            <AccordionContent className="mt-2 flex flex-col gap-4">
                              <PanelHeader heading="Object associations" noBorder />
                              <ObjectAssociation
                                onIdChange={handleEvidenceObjectIdsChange}
                                excludeObjectTypes={excludeObjectTypes || []}
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
          }}
          onCancel={() => setIsDiscardDialogOpen(false)}
        />
      </SheetContent>
    </Sheet>
  )
}

export default EvidenceCreateSheet

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
import HeadsUpDisplay from '@/components/shared/heads-up/heads-up'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { TUploadedFile } from './upload/types/TUploadedFile'
import { useSearchParams } from 'next/navigation'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { Sheet, SheetContent } from '@repo/ui/sheet'
import ObjectAssociationControls from '@/components/shared/objectAssociation/object-association-controls'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import ObjectAssociationPrograms from '@/components/shared/objectAssociation/object-association-programs'

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
  const [controlObjectTypes, setControlObjectTypes] = useState<TObjectAssociationMap>({})
  const [programObjectTypes, setProgramObjectTypes] = useState<TObjectAssociationMap>({})
  const { mutateAsync: createEvidence, isPending } = useCreateEvidence()
  const { setCrumbs } = useContext(BreadcrumbContext)
  const searchParams = useSearchParams()
  const programId = searchParams.get('programId')
  const queryClient = useQueryClient()
  const router = useRouter()
  const [openControlsDialog, setOpenControlsDialog] = useState(false)

  const [associationControlsIdsMap, setAssociationControlsIdsMap] = useState<TObjectAssociationMap>({ controlIDs: [] })
  const [associationControlsRefMap, setAssociationControlsRefMap] = useState<string[]>([])
  const [associationProgramsIdsMap, setAssociationProgramsIdsMap] = useState<TObjectAssociationMap>({ programIDs: [] })
  const [associationProgramsRefMap, setAssociationProgramsRefMap] = useState<string[]>([])
  const [openProgramsDialog, setOpenProgramsDialog] = useState(false)

  const onSubmitHandler = async (data: CreateEvidenceFormData) => {
    const mergedEvidenceObjectTypes: TObjectAssociationMap = Object.fromEntries(
      Object.entries({
        controlIDs: controlObjectTypes.controlIDs,
        programIDs: programObjectTypes.programIDs,
        subcontrolIDs: evidenceObjectTypes?.subcontrolIDs,
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

  useEffect(() => {
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
        setAssociationControlsIdsMap(formData.objectAssociations.controlIDs ? { controlIDs: [...formData.objectAssociations.controlIDs] } : { controlIDs: [] })
        setAssociationControlsRefMap(formData.controlRefCodes ? [...formData.controlRefCodes] : [])
        setAssociationProgramsIdsMap(formData.objectAssociations.programIDs ? { programIDs: [...formData.objectAssociations.programIDs] } : { programIDs: [] })
        setAssociationProgramsRefMap(formData.programDisplayIDs ? [...formData.programDisplayIDs] : [])
      }
    }
  }, [form, formData])

  useEffect(() => {
    if (!open) {
      setControlObjectTypes({})
      setProgramObjectTypes({})
      setAssociationControlsIdsMap(formData?.objectAssociations ?? { controlIDs: [] })
      setAssociationControlsRefMap(formData?.controlRefCodes ? [...formData.controlRefCodes] : [])
      setAssociationProgramsIdsMap(formData?.objectAssociations ?? { programIDs: [] })
      setAssociationProgramsRefMap(formData?.programDisplayIDs ? [...formData.programDisplayIDs] : [])
      setOpenControlsDialog(false)
      setOpenProgramsDialog(false)
    }
  }, [open, formData])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Evidence', href: '/evidence' },
    ])
  }, [setCrumbs])

  const handleEvidenceObjectIdsChange = useCallback((updatedMap: TObjectAssociationMap) => {
    setEvidenceObjectTypes(updatedMap)
  }, [])

  const handleControlIdsChange = useCallback((updatedMap: TObjectAssociationMap) => {
    setControlObjectTypes(updatedMap)
  }, [])

  const handleProgramIdsChange = useCallback((updatedMap: TObjectAssociationMap) => {
    setProgramObjectTypes(updatedMap)
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent onEscapeKeyDown={() => onOpenChange(false)} side="right" className="bg-card flex flex-col" minWidth={470}>
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

                  {/* Creation Date */}
                  <InputRow className="w-full">
                    <FormField
                      control={form.control}
                      name="creationDate"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel className="mb-2 flex items-center">
                            Creation Date
                            <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>The date the evidence was collected, generally the current date but can be adjusted.</p>} />
                          </FormLabel>
                          <CalendarPopover field={field} defaultToday required disableFuture />
                          {form.formState.errors.creationDate && <p className="text-red-500 text-sm">{form.formState.errors.creationDate.message}</p>}
                        </FormItem>
                      )}
                    />
                  </InputRow>

                  {/* Renewal Date */}
                  <InputRow className="w-full">
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
                </form>

                <p className="pt-5 pb-5">Provide supporting file(s)</p>
                <EvidenceUploadForm evidenceFiles={handleUploadedFiles} resetEvidenceFiles={resetEvidenceFiles} setResetEvidenceFiles={handleResetEvidenceFiles} form={form} />
              </Form>
            </GridCell>
          </GridRow>
          <GridRow columns={1}>
            <GridCell>
              <Panel>
                <Accordion type="single" collapsible value={undefined} className="w-full">
                  <AccordionItem value="TITLE">
                    <div className="flex items-center justify-between w-full">
                      <AccordionTrigger asChild>
                        <button className="group flex items-center gap-2 text-sm font-medium">
                          <ChevronDown size={22} className="text-brand transform rotate-[-90deg] transition-transform group-data-[state=open]:rotate-0" />
                          Linked Control(s)
                        </button>
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
                          open={openControlsDialog}
                          setOpen={setOpenControlsDialog}
                          onIdChange={handleControlIdsChange}
                          idsMap={associationControlsIdsMap}
                          setIdsMap={setAssociationControlsIdsMap}
                          refMap={associationControlsRefMap}
                          setRefMap={setAssociationControlsRefMap}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </Panel>
            </GridCell>
          </GridRow>
          <GridRow columns={1}>
            <GridCell>
              <Panel>
                <Accordion type="single" collapsible value={undefined} className="w-full">
                  <AccordionItem value="TITLE">
                    <div className="flex items-center justify-between w-full">
                      <AccordionTrigger asChild>
                        <button className="group flex items-center gap-2 text-sm font-medium">
                          <ChevronDown size={22} className="text-brand transform rotate-[-90deg] transition-transform group-data-[state=open]:rotate-0" />
                          Linked Program(s)
                        </button>
                      </AccordionTrigger>
                      <Button
                        variant="outline"
                        className="py-5"
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenProgramsDialog(true)
                        }}
                        icon={<Plus />}
                        iconPosition="left"
                      >
                        Add Programs
                      </Button>
                    </div>

                    <AccordionContent>
                      <div className="mt-5 flex flex-col gap-5">
                        <ObjectAssociationPrograms
                          open={openProgramsDialog}
                          setOpen={setOpenProgramsDialog}
                          onIdChange={handleProgramIdsChange}
                          idsMap={associationProgramsIdsMap}
                          setIdsMap={setAssociationProgramsIdsMap}
                          refMap={associationProgramsRefMap}
                          setRefMap={setAssociationProgramsRefMap}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
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
                          Object associations
                        </button>
                      </AccordionTrigger>
                    </div>

                    <AccordionContent className="mt-2 flex flex-col gap-4">
                      <PanelHeader heading="Object association" noBorder />
                      {formData?.objectAssociationsDisplayIDs && (
                        <HeadsUpDisplay
                          accordionLabel="Show objects linked to this evidence"
                          descriptionText="This requested evidence you are submitting will also be used by other tasks, controls. We have pre-selected the object association below."
                          displayIDs={formData.objectAssociationsDisplayIDs}
                        />
                      )}
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

          {/* Submit Button */}
          <GridRow columns={1}>
            <GridCell>
              <Button onClick={form.handleSubmit(onSubmitHandler)} loading={isPending} disabled={isPending}>
                {isPending ? 'Submitting...' : 'Submit for review'}
              </Button>
            </GridCell>
          </GridRow>
        </Grid>
      </SheetContent>
    </Sheet>
  )
}

export default EvidenceCreateSheet

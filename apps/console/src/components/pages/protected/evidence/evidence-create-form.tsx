'use client'
import { Grid, GridCell, GridRow } from '@repo/ui/grid'
import React, { useContext, useEffect, useState } from 'react'
import { InfoIcon } from 'lucide-react'
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
import ObjectAssociation from '@/components/shared/object-association/object-association'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { useQueryClient } from '@tanstack/react-query'
import HeadsUpDisplay from '@/components/shared/heads-up/heads-up'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { TUploadedFile } from './upload/types/TUploadedFile'
import { useSearchParams } from 'next/navigation'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useGetTags } from '@/lib/graphql-hooks/tags'
import PlateEditor from '@/components/shared/plate/plate-editor'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { Value } from 'platejs'
type TProps = {
  formData?: TFormEvidenceData
  onEvidenceCreateSuccess?: () => void
  excludeObjectTypes?: ObjectTypeObjects[]
  defaultSelectedObject?: ObjectTypeObjects
}

const EvidenceCreateForm: React.FC<TProps> = ({ formData, onEvidenceCreateSuccess, excludeObjectTypes, defaultSelectedObject }: TProps) => {
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
  const { tagOptions } = useGetTags()
  const { convertToHtml } = usePlateEditor()

  const onSubmitHandler = async (data: CreateEvidenceFormData) => {
    if (data.collectionProcedure) {
      data.collectionProcedure = await convertToHtml(data.collectionProcedure as Value)
    }

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
        ...evidenceObjectTypes,
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
    }
  }, [form, formData])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Evidence', href: '/evidence' },
    ])
  }, [setCrumbs])

  const handleEvidenceObjectIdsChange = (updatedMap: TObjectAssociationMap) => {
    setEvidenceObjectTypes(updatedMap)
  }

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
    <Grid>
      <GridRow columns={4}>
        <GridCell className="col-span-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitHandler)} className="grid grid-cols-1 gap-4">
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
                            <PlateEditor initialValue={field.value as string} onChange={(val) => field.onChange(val)} />
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
                              options={tagOptions}
                              placeholder="Add tag..."
                              creatable
                              value={tagValues}
                              onChange={(selectedOptions) => {
                                const options = selectedOptions.map((option) => option.value)
                                field.onChange(options)
                                setTagValues(
                                  selectedOptions.map((item) => {
                                    return {
                                      value: item.value,
                                      label: item.label,
                                    }
                                  }),
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
                            <SystemTooltip
                              icon={<InfoIcon size={14} className="mx-1 mt-1" />}
                              content={<p>The date the evidence will be re-requested; some evidence may be monthly (e.g. user access reviews), bi-annually, or annually, depending</p>}
                            />
                          </FormLabel>

                          <CalendarPopover field={field} defaultAddDays={365} disabledFrom={new Date()} />
                          {field.value !== null && (
                            <p>
                              Don&apos;t want to renew this evidence?{' '}
                              <b className="text-sm cursor-pointer text-primary" onClick={() => field.onChange(null)}>
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
            </div>

            <div className="col-span-1">
              <Panel>
                <PanelHeader heading="Object association" noBorder />
                {formData && formData?.objectAssociationsDisplayIDs && (
                  <HeadsUpDisplay
                    accordionLabel={'Show objects linked to this evidence'}
                    descriptionText={'This requested evidence you are submitting will also be used by other tasks, controls. We have pre-selected the object association below.'}
                    displayIDs={formData?.objectAssociationsDisplayIDs}
                  />
                )}
                <ObjectAssociation
                  onIdChange={handleEvidenceObjectIdsChange}
                  excludeObjectTypes={excludeObjectTypes || []}
                  initialData={formData?.objectAssociations}
                  defaultSelectedObject={defaultSelectedObject}
                />
              </Panel>
            </div>
          </div>
        </GridCell>
      </GridRow>
      <GridRow columns={1}>
        <GridCell>
          <Button onClick={form.handleSubmit(onSubmitHandler)} loading={isPending} disabled={isPending}>
            {isPending ? 'Submitting...' : 'Submit for review'}
          </Button>
        </GridCell>
      </GridRow>
    </Grid>
  )
}

export default EvidenceCreateForm

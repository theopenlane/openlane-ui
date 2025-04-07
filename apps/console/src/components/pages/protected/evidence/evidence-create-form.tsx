'use client'
import { Grid, GridCell, GridRow } from '@repo/ui/grid'
import React, { useEffect, useState } from 'react'
import { InfoIcon } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import useFormSchema, { CreateEvidenceFormData } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { Input, InputRow } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import MultipleSelector from '@repo/ui/multiple-selector'
import { Button } from '@repo/ui/button'
import { CalendarPopover } from '@repo/ui/calendar-popover'

import { CreateEvidenceInput } from '@repo/codegen/src/schema'
import { useSession } from 'next-auth/react'
import EvidenceUploadForm from '@/components/pages/protected/evidence/upload/evidence-upload-form'
import { useNotification } from '@/hooks/useNotification'
import { Option } from '@repo/ui/multiple-selector'
import { useCreateEvidence } from '@/lib/graphql-hooks/evidence'
import { TEvidenceObjectTypes } from '@/components/pages/protected/evidence/object-association/types/TEvidenceObjectTypes.ts'
import { TTaskDataEvidence } from '@/components/pages/protected/evidence/types/TTaskDataEvidence.ts'
import ObjectAssociation from '@/components/shared/objectAssociation/object-association'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap'

type TProps = {
  taskData?: TTaskDataEvidence
  onEvidenceCreateSuccess?: () => void
  excludeObjectTypes?: ObjectTypeObjects[]
}

const EvidenceCreateForm: React.FC<TProps> = (props: TProps) => {
  const { form } = useFormSchema()
  const { successNotification, errorNotification } = useNotification()
  const [tagValues, setTagValues] = useState<Option[]>([])
  const [resetEvidenceFiles, setResetEvidenceFiles] = useState(false)
  const [resetObjectAssociation, setResetObjectAssociation] = useState(false)
  const [evidenceObjectTypes, setEvidenceObjectTypes] = useState<TObjectAssociationMap>()
  const [preselectedObjectTypes, setPreselectedObjectTypes] = useState<Partial<Record<`${Lowercase<string>}IDs`, string[]>>>()
  const { data: sessionData } = useSession()
  const { mutateAsync: createEvidence, isPending } = useCreateEvidence()

  const onSubmitHandler = async (data: CreateEvidenceFormData) => {
    console.log(evidenceObjectTypes)
    const formData = {
      input: {
        name: data.name,
        description: data.description,
        tags: data.tags,
        creationDate: data.creationDate,
        renewalDate: data.renewalDate,
        ownerID: sessionData?.user.userId,
        collectionProcedure: data.collectionProcedure,
        source: data.source,
        fileIDs: data.fileIDs,
        taskIDs: data?.taskIDs,
        ...(data.url ? { url: data.url } : {}),
        ...evidenceObjectTypes,
      } as CreateEvidenceInput,
      evidenceFiles: data.evidenceFiles?.map((item) => item.file) || [],
    }

    try {
      await createEvidence(formData)
      successNotification({
        title: 'Evidence Created',
        description: `Evidence has been successfully created`,
      })
      props?.onEvidenceCreateSuccess && props.onEvidenceCreateSuccess()
    } catch {
      errorNotification({
        title: 'Error',
        description: 'There was an error creating the evidence. Please try again.',
      })
    }
    form.reset()
    setTagValues([])
    setResetEvidenceFiles(true)
    setResetObjectAssociation(true)
  }

  useEffect(() => {
    if (props.taskData) {
      form.setValue('name', `Evidence for ${props.taskData.displayID}`)
      form.setValue('controlObjectiveIDs', props.taskData?.controlObjectiveIDs?.edges?.map((item: any) => item?.node?.id) || [])
      form.setValue('subcontrolIDs', props.taskData?.subcontrolIDs?.edges?.map((item: any) => item?.node?.id) || [])
      form.setValue('programIDs', props.taskData?.programIDs?.edges?.map((item: any) => item?.node?.id) || [])
      form.setValue('controlIDs', props.taskData?.controlIDs?.edges?.map((item: any) => item?.node?.id) || [])
      form.setValue('taskIDs', props.taskData?.taskId ? [props.taskData.taskId] : [])
      const preselectedObjectTypes: TObjectAssociationMap = {
        controlObjectiveIDs: props.taskData?.controlObjectiveIDs?.edges?.map((item: any) => item?.node?.id) || [],
        subcontrolIDs: props.taskData?.subcontrolIDs?.edges?.map((item: any) => item?.node?.id) || [],
        programIDs: props.taskData?.programIDs?.edges?.map((item: any) => item?.node?.id) || [],
        controlIDs: props.taskData?.controlIDs?.edges?.map((item: any) => item?.node?.id) || [],
        taskIDs: props.taskData?.taskId ? [props.taskData?.taskId] : [],
      }
      setPreselectedObjectTypes(preselectedObjectTypes)

      if (props.taskData?.tags) {
        form.setValue('tags', props.taskData.tags)
        const tags = props.taskData.tags.map((item) => {
          return {
            value: item,
            label: item,
          } as Option
        })
        setTagValues(tags)
      }
    }
  }, [])

  const handleEvidenceObjectIdsChange = (updatedMap: TObjectAssociationMap) => {
    setEvidenceObjectTypes(updatedMap)
  }

  const handleUploadedFiles = (evidenceFiles: TUploadedFile[]) => {
    const evidenceFilesFiltered = evidenceFiles?.filter((item) => item.type === 'file')
    evidenceFilesFiltered && form.setValue('evidenceFiles', evidenceFilesFiltered)
  }

  const handleResetEvidenceFiles = () => {
    setResetEvidenceFiles(false)
  }

  const handleResetObjectAssociation = () => {
    setResetObjectAssociation(false)
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
                          <CalendarPopover field={field} defaultToday required />
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

                          <CalendarPopover field={field} defaultAddDays={365} />
                          {field.value !== null && (
                            <p>
                              Don't want to renew this evidence?{' '}
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
            </div>

            <div className="col-span-1">
              <ObjectAssociation onIdChange={handleEvidenceObjectIdsChange} excludeObjectTypes={props?.excludeObjectTypes || []} initialData={preselectedObjectTypes} />
              {/* <EvidenceObjectAssociation
                onEvidenceObjectIdsChange={handleEvidenceObjectIdsChange}
                resetObjectAssociation={resetObjectAssociation}
                setResetObjectAssociation={handleResetObjectAssociation}
                form={props.taskData && form}
                preselectedObjectDisplayIDs={preselectedObjectTypes}
              /> */}
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

'use client'
import { Grid, GridCell, GridRow } from '@repo/ui/grid'
import React, { useState } from 'react'
import { InfoIcon } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import useFormSchema, { CreateEvidenceFormData } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { Input, InputRow } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import MultipleSelector from '@repo/ui/multiple-selector'
import { Button } from '@repo/ui/button'
import { CalendarPopover } from '@repo/ui/calendar-popover'

import { CreateEvidenceInput, useCreateEvidenceMutation } from '@repo/codegen/src/schema'
import { useSession } from 'next-auth/react'
import EvidenceUploadForm from '@/components/pages/protected/evidence/upload/evidence-upload-form'
import EvidenceObjectAssociation from '@/components/pages/protected/evidence/object-association/evidence-object-association'
import { useNotification } from '@/hooks/useNotification'
import { Option } from '@repo/ui/multiple-selector'

const EvidenceCreateForm: React.FC = () => {
  const { form } = useFormSchema()
  const { successNotification, errorNotification } = useNotification()
  const [tagValues, setTagValues] = useState<Option[]>([])
  const [resetEvidenceFiles, setResetEvidenceFiles] = useState(false)
  const [resetObjectAssociation, setResetObjectAssociation] = useState(false)
  const { data: sessionData } = useSession()
  const [result, createEvidence] = useCreateEvidenceMutation()
  const { fetching: isSubmitting } = result

  const onSubmitHandler = async (data: CreateEvidenceFormData) => {
    const controlObjectives = data?.controlObjectiveIDs?.reduce(
      (acc, item) => {
        acc[item.inputName] = item.objectIds
        return acc
      },
      {} as Record<string, string[]>,
    )

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
        ...(data.url ? { url: data.url } : {}),
        ...controlObjectives,
      } as CreateEvidenceInput,
      evidenceFiles: data.evidenceFiles?.map((item) => item.file) || [],
    }

    const response = await createEvidence(formData)

    if (response.error) {
      errorNotification({
        title: 'Error',
        description: 'There was an error creating the evidence. Please try again.',
      })
      return
    }

    successNotification({
      title: 'Evidence Created',
      description: `Evidence has been successfully created`,
    })
    form.reset()
    setTagValues([])
    setResetEvidenceFiles(true)
    setResetObjectAssociation(true)
  }

  const handleEvidenceObjectIdsChange = (evidenceObjectIds: TEvidenceObjectIds[]) => {
    form.setValue('controlObjectiveIDs', evidenceObjectIds)
  }

  const handleUploadedFiles = (evidenceFiles: TUploadedFilesProps[]) => {
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
              <EvidenceObjectAssociation
                onEvidenceObjectIdsChange={handleEvidenceObjectIdsChange}
                resetObjectAssociation={resetObjectAssociation}
                setResetObjectAssociation={handleResetObjectAssociation}
              />
            </div>
          </div>
        </GridCell>
      </GridRow>
      <GridRow columns={1}>
        <GridCell>
          <Button onClick={form.handleSubmit(onSubmitHandler)} loading={isSubmitting} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit for review'}
          </Button>
        </GridCell>
      </GridRow>
    </Grid>
  )
}

export default EvidenceCreateForm

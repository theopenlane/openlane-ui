'use client'
import React, { useCallback, useEffect, useState } from 'react'
import { InfoIcon, X } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import useFormSchema, { type CreateEvidenceFormData } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { Input, InputRow } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { Button } from '@repo/ui/button'
import { type CreateEvidenceInput } from '@repo/codegen/src/schema'
import EvidenceUploadForm from '@/components/pages/protected/evidence/upload/evidence-upload-form'
import { useNotification } from '@/hooks/useNotification'
import { useCreateEvidence } from '@/lib/graphql-hooks/evidence'
import { type TFormEvidenceData } from '@/components/pages/protected/evidence/types/TFormEvidenceData.ts'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { Panel } from '@repo/ui/panel'
import { useQueryClient } from '@tanstack/react-query'
import { type TUploadedFile } from './upload/types/TUploadedFile'
import { useRouter, useSearchParams } from 'next/navigation'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { Sheet, SheetContent, SheetHeader } from '@repo/ui/sheet'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'
import { type CustomEvidenceControl, EVIDENCE_ASSOCIATION_FIELDS } from './evidence-sheet-config'
import { useEvidenceSuggestedControls } from './hooks/use-evidence-suggested-controls'
import Link from 'next/link'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { EvidenceEvidenceStatus } from '@repo/codegen/src/schema'
import { enumToOptions, getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { useIsAuditor } from '@/lib/graphql-hooks/member'
import EvidenceLinkedControlsPanel from './panels/evidence-linked-controls-panel'
import EvidenceAdditionalDetails from './create/evidence-additional-details'
import { EVIDENCE_AUDITOR_REQUEST_MODE, EVIDENCE_CREATE_MODE } from './create/evidence-create-mode'

const statusOptions = enumToOptions(EvidenceEvidenceStatus)

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
  const { isAuditor } = useIsAuditor()
  const mode = isAuditor ? EVIDENCE_AUDITOR_REQUEST_MODE : EVIDENCE_CREATE_MODE
  const { successNotification, errorNotification } = useNotification()
  const [resetEvidenceFiles, setResetEvidenceFiles] = useState(false)
  const [evidenceObjectTypes, setEvidenceObjectTypes] = useState<TObjectAssociationMap>()
  const { mutateAsync: createEvidence, isPending } = useCreateEvidence()
  const searchParams = useSearchParams()
  const programId = searchParams.get('programId')
  const queryClient = useQueryClient()
  const router = useRouter()
  const [associationProgramsRefMap, setAssociationProgramsRefMap] = useState<string[]>([])

  const [evidenceControls, setEvidenceControls] = useState<CustomEvidenceControl[] | null>(null)
  const [evidenceSubcontrols, setEvidenceSubcontrols] = useState<CustomEvidenceControl[] | null>(null)

  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState<boolean>(false)
  const { tagOptions } = useGetTags()

  const { convertToHtml } = usePlateEditor()

  useEffect(() => {
    if (open && mode.defaultStatus && !form.getValues('status')) {
      form.setValue('status', mode.defaultStatus)
    }
  }, [open, mode.defaultStatus, form])

  const buildInput = async (data: CreateEvidenceFormData, status?: EvidenceEvidenceStatus): Promise<CreateEvidenceInput> => {
    const collectionProcedure = data.collectionProcedure && typeof data.collectionProcedure !== 'string' ? await convertToHtml(data.collectionProcedure) : data.collectionProcedure

    return {
      name: data.name,
      description: data.description,
      tags: data.tags,
      creationDate: data.creationDate instanceof Date ? data.creationDate.toISOString() : data.creationDate,
      renewalDate: data.renewalDate instanceof Date ? data.renewalDate.toISOString() : data.renewalDate,
      collectionProcedure,
      source: data.source,
      fileIDs: data.fileIDs,
      taskIDs: data.taskIDs,
      ...evidenceObjectTypes,
      controlIDs: data.controlIDs,
      subcontrolIDs: data.subcontrolIDs,
      programIDs: programId ? [programId] : (data.programIDs ?? []),
      ...(data.url ? { url: data.url } : {}),
      ...(status ? { status } : {}),
      ...(data.reviewFrequency ? { reviewFrequency: data.reviewFrequency } : {}),
    }
  }

  const submitEvidence = async (data: CreateEvidenceFormData, status?: EvidenceEvidenceStatus) => {
    const input = await buildInput(data, status)

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

  const handleSaveAsDraft = form.handleSubmit((data) => {
    form.clearErrors('controlIDs')
    return submitEvidence(data, EvidenceEvidenceStatus.DRAFT)
  })

  const handleSubmit = form.handleSubmit((data) => {
    form.clearErrors('controlIDs')
    if (mode.requireLinkedControls && (data.controlIDs?.length ?? 0) + (data.subcontrolIDs?.length ?? 0) === 0) {
      form.setError('controlIDs', { type: 'manual', message: 'Link at least one control before submitting for review.' })
      return
    }
    return submitEvidence(data, mode.showStatusField ? (data.status ?? undefined) : undefined)
  })

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
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <InputRow className="w-full">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <div className="flex items-center">
                      <FormLabel>
                        Evidence name <span className="text-red-500">*</span>
                      </FormLabel>
                      <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Provide a name for the evidence, generally should include the related Control or Task.</p>} />
                    </div>
                    <FormControl>
                      <Input variant="medium" {...field} className="w-full" placeholder="Enter a descriptive name for this evidence" />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Choose a clear, searchable name so others can easily find it.</p>
                    {form.formState.errors.name && <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>}
                  </FormItem>
                )}
              />
            </InputRow>

            <div>
              <p className="text-sm font-medium mb-2">Linked Control(s) {mode.requireLinkedControls && <span className="text-red-500">*</span>}</p>
              <Panel>
                <EvidenceLinkedControlsPanel
                  form={form}
                  evidenceControls={evidenceControls}
                  setEvidenceControls={setEvidenceControls}
                  evidenceSubcontrols={evidenceSubcontrols}
                  setEvidenceSubcontrols={setEvidenceSubcontrols}
                  suggestedControlsMap={suggestedControlsMap}
                  isLoadingSuggestions={isSuggestionsLoading}
                  showEmptyState
                />
              </Panel>
              {mode.requireLinkedControls &&
                (form.formState.errors.controlIDs ? (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.controlIDs.message}</p>
                ) : (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <InfoIcon size={12} />
                    Required before submitting for review
                  </p>
                ))}
            </div>

            {mode.showFileUpload && (
              <div>
                <p className="text-sm font-medium mb-2">Provide supporting file(s)</p>
                <EvidenceUploadForm evidenceFiles={handleUploadedFiles} resetEvidenceFiles={resetEvidenceFiles} setResetEvidenceFiles={handleResetEvidenceFiles} form={form} />
              </div>
            )}

            <InputRow className="w-full">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <div className="flex items-center">
                      <FormLabel>Description (optional)</FormLabel>
                      <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Provide a short description of what is contained in the files or linked URLs.</p>} />
                    </div>
                    <FormControl>
                      <Textarea id="description" {...field} className="w-full" placeholder="Provide context about this evidence (what it shows, why it's important, etc.)" />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Help reviewers understand the purpose and relevance of this evidence.</p>
                    {form.formState.errors.description && <p className="text-red-500 text-sm">{form.formState.errors.description.message}</p>}
                  </FormItem>
                )}
              />
            </InputRow>

            {mode.showStatusField && (
              <InputRow className="w-full">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <div className="flex items-center">
                        <FormLabel>Status</FormLabel>
                        <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>The status the requested evidence will start in.</p>} />
                      </div>
                      <FormControl>
                        <Select value={field.value ?? undefined} onValueChange={(val) => field.onChange(val)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select status..." />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {getEnumLabel(option.value)}
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
            )}

            <EvidenceAdditionalDetails
              form={form}
              showCollectionProcedure={mode.showCollectionProcedure}
              tagOptions={tagOptions}
              associationProgramsRefMap={associationProgramsRefMap}
              setAssociationProgramsRefMap={setAssociationProgramsRefMap}
              onObjectAssociationChange={handleEvidenceObjectIdsChange}
              allowedObjectTypes={allowedObjectTypes}
              defaultSelectedObject={defaultSelectedObject}
              formData={formData}
            />

            <div className="flex justify-end gap-3">
              {mode.showSaveAsDraft && (
                <Button type="button" variant="secondary" onClick={handleSaveAsDraft} loading={isPending} disabled={isPending}>
                  Save as draft
                </Button>
              )}
              <Button type="submit" loading={isPending} disabled={isPending}>
                {isPending ? 'Submitting...' : mode.submitLabel}
              </Button>
            </div>
          </form>
        </Form>
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

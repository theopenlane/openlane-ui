'use client'

import React, { useEffect, useRef, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Sheet, SheetContent } from '@repo/ui/sheet'
import { useNotification } from '@/hooks/useNotification'
import { Form } from '@repo/ui/form'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog.tsx'
import { useDeleteEvidence, useGetEvidenceById, useUpdateEvidence } from '@/lib/graphql-hooks/evidence.ts'
import { EvidenceEvidenceStatus } from '@repo/codegen/src/schema.ts'
import useFormSchema, { type EditEvidenceFormData } from '@/components/pages/protected/evidence/hooks/use-form-schema.ts'
import { useQueryClient } from '@tanstack/react-query'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useIsAuditor } from '@/lib/graphql-hooks/member'
import EvidenceRequestChangesDialog from './evidence-request-changes-dialog'
import { type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap.ts'
import { getAssociationInput } from '@/components/shared/object-association/utils.ts'
import { canDelete, canEdit } from '@/lib/authz/utils'
import useEscapeKey from '@/hooks/useEscapeKey'
import useClickOutsideWithPortal from '@/hooks/useClickOutsideWithPortal'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { EvidenceDetailsSheetSkeleton } from './skeleton/evidence-details-skeleton'
import EvidenceFiles from './evidence-files'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { EDIT_ASSOCIATIONS_PARAM, type CustomEvidenceControl, type EvidenceEditableField } from './evidence-sheet-config'
import { useEvidenceSuggestedControls } from './hooks/use-evidence-suggested-controls'
import EvidenceCommentsCard from './evidence-comment-card'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { ObjectWorkflowPanel } from '@/components/workflows/object-workflow-panel'
import { useSession } from 'next-auth/react'
import EvidenceDetailHeader from './detail/evidence-detail-header'
import { SlideoutFormFooter } from '@/components/shared/crud-base/slideout-footer'
import EvidenceOverviewSection from './detail/evidence-overview-section'
import EvidenceRelationshipsSection from './detail/evidence-relationships-section'
import EvidenceMetadataSection from './detail/evidence-metadata-section'
import EvidenceDetailSection from './detail/evidence-detail-section'
import { evidenceToFormValues } from './detail/evidence-form-values'
import { useEvidenceAssociations } from './hooks/use-evidence-associations'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { useSmartRouter } from '@/hooks/useSmartRouter'

type TEvidenceDetailsSheet = {
  controlId?: string
  entityId?: string | null
  onClose?: () => void
}

const DATE_POPOVER_FIELDS: EvidenceEditableField[] = ['renewalDate', 'creationDate']
const INLINE_POPOVER_FIELDS: EvidenceEditableField[] = ['tags', 'reviewFrequency', ...DATE_POPOVER_FIELDS]

const EvidenceDetailsSheet: React.FC<TEvidenceDetailsSheet> = ({ controlId, entityId: entityIdProp, onClose: onCloseProp }) => {
  const { convertToHtml, convertToReadOnly } = usePlateEditor()
  const [editRequested, setEditRequested] = useState(false)

  const { data: session } = useSession()

  const queryClient = useQueryClient()
  const [deleteDialogIsOpen, setDeleteDialogIsOpen] = useState(false)

  const searchParams = useSearchParams()
  const controlEvidenceIdParam = searchParams?.get('controlEvidenceId')
  const id = searchParams.get('id')
  const editAssociationsForId = searchParams.get(EDIT_ASSOCIATIONS_PARAM)
  const { replace: replaceSearchParams } = useSmartRouter()
  const { successNotification, errorNotification } = useNotification()
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState<boolean>(false)
  const [associations, setAssociations] = useState<TObjectAssociationMap>({})

  const { mutateAsync: updateEvidence, isPending: isSavingEvidence } = useUpdateEvidence()
  const { mutateAsync: deleteEvidence } = useDeleteEvidence()
  const latestStatusRef = useRef<EvidenceEvidenceStatus | null>(null)
  const { isAuditor } = useIsAuditor()
  const [requestChangesOpen, setRequestChangesOpen] = useState(false)
  const [auditorActionPending, setAuditorActionPending] = useState(false)

  const [associationProgramsRefMap, setAssociationProgramsRefMap] = useState<string[]>([])

  const [evidenceControls, setEvidenceControls] = useState<CustomEvidenceControl[] | null>(null)
  const [evidenceSubcontrols, setEvidenceSubcontrols] = useState<CustomEvidenceControl[] | null>(null)

  const config = useMemo(() => {
    if (entityIdProp !== undefined) {
      return { id: entityIdProp, link: entityIdProp ? `${window.location.origin}${getHrefForObjectType(ObjectAssociationNodeEnum.EVIDENCE, { id: entityIdProp })}` : '' }
    }
    if (controlEvidenceIdParam) {
      return { id: controlEvidenceIdParam, link: `${window.location.origin}${window.location.pathname}?controlEvidenceId=${controlEvidenceIdParam}` }
    }
    return { id, link: `${window.location.origin}${window.location.pathname}?id=${id}` }
  }, [entityIdProp, controlEvidenceIdParam, id])

  const { data, isLoading: fetching } = useGetEvidenceById(config.id)

  const [editField, setEditField] = useState<EvidenceEditableField | null>(null)

  const { data: permission } = useAccountRoles(ObjectTypes.EVIDENCE, data?.evidence.id)

  const editAllowed = canEdit(permission?.roles, session) || isAuditor
  const deleteAllowed = canDelete(permission?.roles)

  const isEditing = editRequested && editAllowed

  const { suggestedControlsMap, isLoading: isSuggestionsLoading } = useEvidenceSuggestedControls({
    evidenceControls,
    evidenceSubcontrols,
    enabled: isEditing,
  })

  const evidence = data?.evidence

  const evidenceName = evidence?.name

  const { form } = useFormSchema(true)
  const { isDirty: isEvidenceDirty } = form.formState

  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const { initialAssociations, controlsAndPrograms, associatedObjectSections } = useEvidenceAssociations(evidence)

  const [prevAssocData, setPrevAssocData] = useState(controlsAndPrograms)
  if (controlsAndPrograms !== prevAssocData) {
    setPrevAssocData(controlsAndPrograms)
    setEvidenceControls(controlsAndPrograms.controls)
    setEvidenceSubcontrols(controlsAndPrograms.subcontrols)
    setAssociationProgramsRefMap(controlsAndPrograms.programDisplayIDs)
  }

  useEffect(() => {
    if (evidence) {
      latestStatusRef.current = null
      form.reset(evidenceToFormValues(evidence, initialAssociations))
    }
  }, [evidence, form, initialAssociations])

  const handleCopyLink = () => {
    if (!config.id) {
      return
    }

    navigator.clipboard
      .writeText(config?.link)
      .then(() => {
        successNotification({
          title: 'Link copied to clipboard',
        })
      })
      .catch(() => {
        errorNotification({
          title: 'Failed to copy link',
        })
      })
  }

  const handleSheetClose = () => {
    if (isEditing && isEvidenceDirty) {
      setIsDiscardDialogOpen(true)
      return
    }
    handleCloseParams()
  }

  const handleCloseParams = () => {
    setEditRequested(false)

    if (onCloseProp) {
      onCloseProp()
      return
    }

    replaceSearchParams({ controlEvidenceId: null, id: null })
  }

  const onSubmit = async (formData: EditEvidenceFormData) => {
    if (!config.id) return

    const controlIDs = form.getValues('controlIDs') || []
    const subcontrolIDs = form.getValues('subcontrolIDs') || []
    const programIDs = form.getValues('programIDs') || []

    const updatedAssociations = {
      ...initialAssociations,
      ...associations,
      controlIDs,
      subcontrolIDs,
      programIDs,
    }

    setAssociations(updatedAssociations)

    const associationInputs = getAssociationInput(initialAssociations, updatedAssociations)

    const { programIDs: _programIDs, controlIDs: _controlIDs, subcontrolIDs: _subcontrolIDs, status: _status, creationDate, renewalDate, ...restFormData } = formData
    const serializedDates = {
      creationDate: creationDate?.toISOString(),
      ...(form.formState.dirtyFields.renewalDate ? { renewalDate: renewalDate?.toISOString() } : {}),
    }
    const cleanFormData = { ...restFormData, ...serializedDates }
    const currentStatus = latestStatusRef.current ?? evidence?.status

    try {
      const collectionProcedure = formData.collectionProcedure && typeof formData.collectionProcedure !== 'string' ? await convertToHtml(formData.collectionProcedure) : formData.collectionProcedure

      await updateEvidence({
        updateEvidenceId: config.id,
        input: {
          ...cleanFormData,
          ...associationInputs,
          collectionProcedure,
          clearURL: formData?.url === undefined,
          ...(currentStatus && currentStatus !== EvidenceEvidenceStatus.MISSING_ARTIFACT ? { status: currentStatus } : {}),
        },
      })

      successNotification({
        title: 'Evidence Updated',
        description: 'The evidence has been successfully updated.',
      })

      setEditRequested(false)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleSave = (e?: React.BaseSyntheticEvent) => form.handleSubmit(onSubmit)(e)

  const handleDelete = async () => {
    if (!config.id) return

    try {
      await deleteEvidence({ deleteEvidenceId: config.id })
      successNotification({ title: `Evidence "${evidence?.name}" deleted successfully` })
      if (controlId) {
        queryClient.invalidateQueries({ queryKey: ['controls', controlId] })
      }

      handleCloseParams()
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleStatusChange = async (status: EvidenceEvidenceStatus) => {
    if (!config.id || status === evidence?.status) return
    try {
      await updateEvidence({
        updateEvidenceId: config.id,
        input: { status },
      })
      latestStatusRef.current = status
      successNotification({ title: 'Status updated successfully' })
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  const handleApprove = async () => {
    if (!config.id) return
    try {
      setAuditorActionPending(true)
      await updateEvidence({
        updateEvidenceId: config.id,
        input: { status: EvidenceEvidenceStatus.AUDITOR_APPROVED },
      })
      latestStatusRef.current = EvidenceEvidenceStatus.AUDITOR_APPROVED
      successNotification({ title: 'Evidence approved', description: 'The evidence has been marked as approved by auditor.' })
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    } finally {
      setAuditorActionPending(false)
    }
  }

  const handleRequestChanges = async (comment: string) => {
    if (!config.id) return
    try {
      setAuditorActionPending(true)
      await updateEvidence({
        updateEvidenceId: config.id,
        input: { status: EvidenceEvidenceStatus.REJECTED, addComment: { text: comment } },
      })
      latestStatusRef.current = EvidenceEvidenceStatus.REJECTED
      queryClient.invalidateQueries({ queryKey: ['evidenceComments', config.id] })
      successNotification({ title: 'Changes requested', description: 'The evidence has been marked as changes requested and your comment was added.' })
      setRequestChangesOpen(false)
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    } finally {
      setAuditorActionPending(false)
    }
  }

  const handleDoubleClick = (field: EvidenceEditableField) => {
    if (isEditing || !editAllowed) return
    setEditField(field)
  }

  const handleUpdateField = async () => {
    if (!editAllowed || !editField || !config.id) return

    const oldValue = evidence?.[editField]
    const newValue = form.getValues(editField)

    const isSame =
      Array.isArray(oldValue) && Array.isArray(newValue)
        ? oldValue.length === newValue.length && oldValue.every((v, i) => v === newValue[i])
        : oldValue instanceof Date && newValue instanceof Date
          ? oldValue.getTime() === newValue.getTime()
          : oldValue === newValue

    if (isSame) {
      setEditField(null)
      return
    }

    const fieldValue = form.getValues(editField)
    const serializedValue = fieldValue instanceof Date ? fieldValue.toISOString() : fieldValue

    await updateEvidence({
      updateEvidenceId: config.id,
      input: {
        [editField]: serializedValue,
      },
    })
    setEditField(null)
    successNotification({
      title: 'Field updated successfully',
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    }
  }

  useEscapeKey(
    () => {
      if (editField) {
        form.setValue(editField, evidence?.[editField] ?? '')
        setEditField(null)
      }
    },
    { enabled: !!editField },
  )

  useClickOutsideWithPortal(
    () => {
      if (editField && DATE_POPOVER_FIELDS.includes(editField)) {
        return setEditField(null)
      }
      if (editField) handleUpdateField()
    },
    {
      refs: { triggerRef, popoverRef },
      enabled: !!editField && INLINE_POPOVER_FIELDS.includes(editField),
    },
  )

  const [prevConfigId, setPrevConfigId] = useState(config.id)
  if (config.id !== prevConfigId) {
    setPrevConfigId(config.id)
    setEditRequested(false)
    setEditField(null)
  }

  useEffect(() => {
    if (entityIdProp !== undefined || !editAssociationsForId) {
      return
    }
    if (editAssociationsForId === config.id) {
      setEditRequested(true)
    }
    replaceSearchParams({ [EDIT_ASSOCIATIONS_PARAM]: null })
  }, [editAssociationsForId, entityIdProp, config.id, replaceSearchParams])

  return (
    <Sheet open={!!config.id} onOpenChange={handleSheetClose}>
      <SheetContent
        onEscapeKeyDown={(e) => {
          if (editField) {
            e.preventDefault()
          } else {
            handleSheetClose()
          }
        }}
        className="flex flex-col"
        minWidth={600}
        header={
          <EvidenceDetailHeader
            evidenceId={evidence?.id}
            status={evidence?.status}
            controlId={controlId}
            isEditing={isEditing}
            isAuditor={isAuditor}
            editAllowed={editAllowed}
            deleteAllowed={deleteAllowed}
            auditorActionPending={auditorActionPending}
            onStatusChange={handleStatusChange}
            onCopyLink={handleCopyLink}
            onEdit={() => setEditRequested(true)}
            onDelete={() => setDeleteDialogIsOpen(true)}
            onApprove={handleApprove}
            onRequestChanges={() => setRequestChangesOpen(true)}
            onClose={handleSheetClose}
          />
        }
        footer={isEditing ? <SlideoutFormFooter onSave={() => handleSave()} onCancel={() => setEditRequested(false)} isPending={isSavingEvidence} /> : undefined}
      >
        {fetching ? (
          <EvidenceDetailsSheetSkeleton />
        ) : (
          <Form {...form}>
            <form onSubmit={handleSave} className="pr-4 flex flex-col gap-6">
              {config.id && <ObjectWorkflowPanel objectId={config.id} objectType="Evidence" objectLabel={evidence?.name} />}

              <EvidenceOverviewSection
                form={form}
                isEditing={isEditing}
                editField={editField}
                editAllowed={editAllowed}
                onEdit={handleDoubleClick}
                onUpdateField={handleUpdateField}
                onKeyDown={handleKeyDown}
                name={evidence?.name}
                description={evidence?.description}
                collectionProcedure={evidence?.collectionProcedure}
                renderCollectionProcedure={convertToReadOnly}
              />

              {config.id && (
                <EvidenceDetailSection title="Supporting files">
                  <EvidenceFiles editAllowed={editAllowed} evidenceID={config.id} />
                </EvidenceDetailSection>
              )}

              <EvidenceRelationshipsSection
                form={form}
                isEditing={isEditing}
                evidenceControls={evidenceControls}
                setEvidenceControls={setEvidenceControls}
                evidenceSubcontrols={evidenceSubcontrols}
                setEvidenceSubcontrols={setEvidenceSubcontrols}
                suggestedControlsMap={suggestedControlsMap}
                isLoadingSuggestions={isSuggestionsLoading}
                associationProgramsRefMap={associationProgramsRefMap}
                setAssociationProgramsRefMap={setAssociationProgramsRefMap}
                initialAssociations={initialAssociations}
                onAssociationsChange={setAssociations}
                associatedObjectSections={associatedObjectSections}
                programNames={controlsAndPrograms.programDisplayIDs}
              />

              {evidence && (
                <EvidenceMetadataSection
                  form={form}
                  evidence={evidence}
                  isEditing={isEditing}
                  editField={editField}
                  editAllowed={editAllowed}
                  onEdit={handleDoubleClick}
                  onUpdateField={handleUpdateField}
                  onKeyDown={handleKeyDown}
                  triggerRef={triggerRef}
                  popoverRef={popoverRef}
                />
              )}

              {!isEditing && config.id && <EvidenceCommentsCard evidenceId={config.id} />}
            </form>
          </Form>
        )}
        <ConfirmationDialog
          open={deleteDialogIsOpen}
          onOpenChange={setDeleteDialogIsOpen}
          onConfirm={handleDelete}
          title={`Delete Evidence`}
          description={
            <>
              This action cannot be undone. This will permanently remove <b>{evidenceName} </b>from the control.
            </>
          }
        />
        <EvidenceRequestChangesDialog
          open={requestChangesOpen}
          onOpenChange={setRequestChangesOpen}
          onConfirm={handleRequestChanges}
          loading={auditorActionPending}
          evidenceName={evidenceName ?? undefined}
        />
        <CancelDialog
          isOpen={isDiscardDialogOpen}
          onConfirm={() => {
            setIsDiscardDialogOpen(false)
            form.reset(evidenceToFormValues(evidence, initialAssociations))
            setEvidenceControls(controlsAndPrograms.controls)
            setEvidenceSubcontrols(controlsAndPrograms.subcontrols)
            setAssociationProgramsRefMap(controlsAndPrograms.programDisplayIDs)
            handleCloseParams()
          }}
          onCancel={() => setIsDiscardDialogOpen(false)}
        />
      </SheetContent>
    </Sheet>
  )
}

export default EvidenceDetailsSheet

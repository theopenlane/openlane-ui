'use client'

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useWatch } from 'react-hook-form'
import { SheetHeader } from '@repo/ui/sheet'
import { Form } from '@repo/ui/form'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { type CreateRemediationInput, type UpdateRemediationInput } from '@repo/codegen/src/schema'
import { useBulkDeleteRemediation, useCreateRemediation, useFilterUnlinkedRemediationFiles, useRemediationContextSubject, useUpdateRemediation } from '@/lib/graphql-hooks/remediation'
import { useObjectPermissionRoles } from '@/components/shared/crud-base/use-object-permission'
import { copyLinkMenuAction, deleteMenuAction, SlideoutHeader } from '@/components/shared/crud-base/slideout-header'
import { SlideoutFormActions } from '@/components/shared/crud-base/slideout-form-actions'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog.tsx'
import { plateToHtmlOrNull } from '@/components/shared/plate/plate-utils'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { canDelete, canEdit } from '@/lib/authz/utils'
import { useDirtyInput } from '@/hooks/useDirtyInput'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage, UserFacingError } from '@/utils/graphQlErrorMatcher'
import { type RemediationFormData } from '../hooks/use-form-schema'
import { REMEDIATION_UPDATE_FIELDS } from '../hooks/remediation-update-fields'
import { buildEditDefaults, useContextAutofill, useRemediationSheetForm } from '../hooks/use-remediation-sheet-form'
import { contextLinkInput, getRemediationContextRef, type TRemediation, type TRemediationContextRef, toRemediationContext } from './remediation-context'
import RemediationContextPanel from './remediation-context-panel'
import RemediationContextSelector from './remediation-context-selector'
import RemediationFieldsPanel from './remediation-fields-panel'
import RemediationReferencesPanel from './remediation-references-panel'
import RemediationDocumentsSection from './remediation-documents-section'
import RemediationMeta from './remediation-meta'
import { RemediationAssociationSection } from '../create/form/fields/association-section'

export type TRemediationCloseGuard = (onConfirmed: () => void) => void

type TRemediationSheetBodyProps = {
  remediation?: TRemediation
  initialContext?: TRemediationContextRef
  initialInstructions?: string
  onClose: () => void
  onBack?: () => void
  onCreated?: (remediationId: string) => void
  closeGuardRef?: React.RefObject<TRemediationCloseGuard | null>
}

const trimmedOrUndefined = (value?: string | null) => value?.trim() || undefined

const RemediationSheetBody: React.FC<TRemediationSheetBodyProps> = ({ remediation, initialContext, initialInstructions, onClose, onBack, onCreated, closeGuardRef }) => {
  const isCreate = !remediation
  const { data: session } = useSession()
  const { successNotification, errorNotification } = useNotification()
  const plateEditorHelper = usePlateEditor()

  const [isEditing, setIsEditing] = useState(isCreate)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [pendingDiscard, setPendingDiscard] = useState<(() => void) | null>(null)
  const isSubmittingRef = useRef(false)
  const formId = useId()

  const { form } = useRemediationSheetForm({ remediation, initialContext, initialInstructions })
  const buildDirtyInput = useDirtyInput(form)
  const { dirtyFields } = form.formState
  const hasUnsavedChanges = isEditing && Object.keys(dirtyFields).length > 0
  const leave = onBack ?? onClose

  const guardLeave = useCallback<TRemediationCloseGuard>((onConfirmed) => (hasUnsavedChanges ? setPendingDiscard(() => onConfirmed) : onConfirmed()), [hasUnsavedChanges])

  useEffect(() => {
    if (!closeGuardRef) {
      return
    }
    closeGuardRef.current = guardLeave
    return () => {
      closeGuardRef.current = null
    }
  }, [closeGuardRef, guardLeave])

  const [watchedType, watchedId] = useWatch({ control: form.control, name: ['contextType', 'contextId'] })
  const contextRef = useMemo<TRemediationContextRef | undefined>(() => {
    if (remediation) {
      return getRemediationContextRef(remediation)
    }
    return watchedType && watchedId ? { type: watchedType, id: watchedId } : undefined
  }, [remediation, watchedType, watchedId])

  const { data: contextData, isFetching: isContextFetching } = useRemediationContextSubject(contextRef?.type, contextRef?.id)
  const context = useMemo(() => (contextRef ? toRemediationContext(contextRef, contextData) : undefined), [contextRef, contextData])
  useContextAutofill(form, context, isCreate)

  const permissionRoles = useObjectPermissionRoles(ObjectTypes.REMEDIATION, remediation?.id)
  const editAllowed = canEdit(permissionRoles, session)
  const deleteAllowed = canDelete(permissionRoles)

  const { mutateAsync: createRemediation } = useCreateRemediation()
  const { mutateAsync: updateRemediation } = useUpdateRemediation()
  const { mutateAsync: deleteRemediations, isPending: isDeleting } = useBulkDeleteRemediation()
  const filterUnlinkedFiles = useFilterUnlinkedRemediationFiles()

  const startEditing = (current: TRemediation) => {
    form.reset(buildEditDefaults(current))
    setIsEditing(true)
  }

  const cancelEditing = () => {
    if (isCreate) {
      guardLeave(leave)
      return
    }
    form.reset()
    setIsEditing(false)
  }

  const createFromForm = async (values: RemediationFormData, ref: TRemediationContextRef) => {
    const [explanation, instructions, intent] = await Promise.all([
      plateToHtmlOrNull(values.explanation, plateEditorHelper),
      plateToHtmlOrNull(values.instructions, plateEditorHelper),
      plateToHtmlOrNull(values.intent, plateEditorHelper),
    ])

    const input: CreateRemediationInput = {
      title: values.title?.trim(),
      status: values.status,
      explanation,
      instructions,
      intent,
      environmentName: values.environmentName || undefined,
      scopeName: values.scopeName || undefined,
      repositoryURI: trimmedOrUndefined(values.repositoryURI),
      pullRequestURI: trimmedOrUndefined(values.pullRequestURI),
      ticketReference: trimmedOrUndefined(values.ticketReference),
      externalURI: trimmedOrUndefined(values.externalURI),
      ...(values.fileIDs?.length ? { fileIDs: values.fileIDs } : {}),
      ...contextLinkInput(ref),
    }

    const result = await createRemediation({ input, remediationFiles: values.uploads?.length ? values.uploads : undefined })
    successNotification({ title: 'Remediation created', description: 'The remediation has been successfully created.' })
    onCreated?.(result.createRemediation.remediation.id)
    leave()
  }

  const updateFromForm = async (values: RemediationFormData, remediationId: string) => {
    const [fileIDs, fieldInput] = await Promise.all([filterUnlinkedFiles(remediationId, values.fileIDs ?? []), buildDirtyInput<UpdateRemediationInput>(values, REMEDIATION_UPDATE_FIELDS)])
    const input: UpdateRemediationInput = { ...fieldInput, ...(fileIDs.length ? { addFileIDs: fileIDs } : {}) }

    if (Object.keys(input).length > 0) {
      await updateRemediation({ updateRemediationId: remediationId, input })
      successNotification({ title: 'Remediation updated', description: 'Your changes have been saved.' })
    }
    form.reset()
    setIsEditing(false)
  }

  const submit = async (values: RemediationFormData) => {
    if (isSubmittingRef.current) {
      return
    }
    isSubmittingRef.current = true
    setIsSubmitting(true)

    try {
      if (remediation) {
        await updateFromForm(values, remediation.id)
      } else if (contextRef) {
        await createFromForm(values, contextRef)
      }
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    } finally {
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!remediation) {
      return
    }

    try {
      const { deleteBulkRemediation } = await deleteRemediations({ ids: [remediation.id] })
      if (deleteBulkRemediation.error || (deleteBulkRemediation.notDeletedIDs?.length ?? 0) > 0) {
        throw new UserFacingError(deleteBulkRemediation.error || 'The remediation could not be deleted.')
      }
      successNotification({ title: 'Remediation deleted' })
      setIsDeleteDialogOpen(false)
      onClose()
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  const handleCopyLink = async () => {
    if (!remediation) {
      return
    }
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${getHrefForObjectType(ObjectAssociationNodeEnum.REMEDIATION, { id: remediation.id })}`)
      successNotification({ title: 'Link copied to clipboard' })
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  const headerTitle = isCreate ? 'Create Remediation' : isEditing ? 'Edit Remediation' : remediation.title || remediation.displayID
  const showViewActions = !isCreate && !isEditing

  return (
    <>
      <SheetHeader className="sticky top-0 z-10 bg-secondary pb-4">
        <SlideoutHeader
          title={headerTitle}
          belowTitle={remediation ? <RemediationMeta remediation={remediation} /> : undefined}
          onBack={onBack ? () => guardLeave(onBack) : undefined}
          onClose={() => guardLeave(onClose)}
          onEdit={remediation && showViewActions && editAllowed ? () => startEditing(remediation) : undefined}
          menuActions={showViewActions ? [copyLinkMenuAction(handleCopyLink), ...(deleteAllowed ? [deleteMenuAction(() => setIsDeleteDialogOpen(true))] : [])] : []}
        />
      </SheetHeader>

      <Form {...form}>
        <form
          id={formId}
          className="flex flex-col gap-4 pr-2"
          onSubmit={(event) => {
            event.stopPropagation()
            form.handleSubmit(submit)(event)
          }}
        >
          {(contextRef || isCreate) && (
            <RemediationContextPanel
              context={context}
              isLoading={!!contextRef && !context && isContextFetching}
              isUnavailable={!!contextRef && !context && !isContextFetching}
              selector={isCreate && !initialContext ? <RemediationContextSelector form={form} selected={context} /> : undefined}
            />
          )}
          <RemediationFieldsPanel
            form={form}
            isEditing={isEditing}
            isCreate={isCreate}
            remediation={remediation}
            contextValues={isCreate ? { environmentName: context?.environmentName, scopeName: context?.scopeName } : undefined}
          />
          <RemediationReferencesPanel form={form} isEditing={isEditing} remediation={remediation} />
        </form>
        <div className="mt-4 flex flex-col gap-4 pr-2 pb-4">
          <RemediationDocumentsSection form={form} isEditing={isEditing} remediationId={remediation?.id} />
          {remediation && !isEditing && <RemediationAssociationSection data={remediation} isEditing={false} isCreate={false} isEditAllowed={editAllowed} />}
          {isEditing && (
            <div className="sticky bottom-0 z-10 flex justify-end gap-2 bg-secondary py-3 pr-10">
              <SlideoutFormActions formId={formId} onCancel={cancelEditing} isPending={isSubmitting} saveLabel={isCreate ? 'Create' : 'Save'} savingLabel={isCreate ? 'Creating...' : 'Saving...'} />
            </div>
          )}
        </div>
      </Form>

      <CancelDialog
        isOpen={!!pendingDiscard}
        onConfirm={() => {
          pendingDiscard?.()
          setPendingDiscard(null)
        }}
        onCancel={() => setPendingDiscard(null)}
      />

      {remediation && (
        <ConfirmationDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleDelete}
          confirmationText="Delete"
          loading={isDeleting}
          title="Delete Remediation"
          description={
            <>
              This action cannot be undone. This will permanently remove <b>{remediation.title || remediation.displayID}</b>.
            </>
          }
        />
      )}
    </>
  )
}

export default RemediationSheetBody

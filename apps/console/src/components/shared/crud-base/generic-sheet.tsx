'use client'

import React, { useEffect, useId, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Sheet, SheetContent } from '@repo/ui/sheet'
import { useNotification } from '@/hooks/useNotification'
import { Form } from '@repo/ui/form'
import { useQueryClient } from '@tanstack/react-query'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog.tsx'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { type UseFormReturn, type FieldValues } from 'react-hook-form'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { canEdit, canDelete } from '@/lib/authz/utils'
import { useObjectPermissionRoles } from './use-object-permission'
import { GenericSheetHeader } from './header'
import { type SlideoutMenuAction } from './slideout-header'
import { SlideoutFormFooter } from './slideout-footer'
import { GenericDetailsSheetSkeleton } from './skeleton/details-sheet-skeleton'
import { pluralizeTypeName } from '@/utils/strings'
import type { BulkDeletePayload } from './types'
import { getBulkActionFailureDescription } from './bulk-action-feedback'
import { useSession } from 'next-auth/react'

export interface InternalEditingType {
  (field: string | null): void
}

export interface RenderFieldsProps<TData, TUpdateInput> {
  isEditing: boolean
  isCreate: boolean
  data?: TData
  isFormInitialized: boolean
  internalEditing: string | null
  setInternalEditing: InternalEditingType
  handleUpdateField: (input: TUpdateInput) => Promise<void>
  isEditAllowed: boolean
}

export interface RenderHeaderProps {
  close: () => void
}

export interface GenericDetailsSheetConfig<TFormData extends FieldValues, TData, TUpdateInput, TUpdateData, TCreateInput, TCreateData> {
  objectType: ObjectTypes
  displayName?: string
  form: UseFormReturn<TFormData>

  createMutation?: {
    mutateAsync: (input: TCreateInput) => Promise<TCreateData>
    isPending: boolean
  }

  updateMutation?: {
    mutateAsync: (params: { id: string; input: TUpdateInput }) => Promise<TUpdateData>
    isPending: boolean
  }

  deleteMutation?: {
    mutateAsync: (params: { ids: string[] }) => Promise<BulkDeletePayload>
    isPending: boolean
  }

  onClose?: () => void

  entityId?: string | null
  isCreateMode?: boolean
  basePath?: string

  data?: TData
  isFetching: boolean
  formId?: string

  buildPayload?: (data: TFormData) => Promise<TUpdateInput | TCreateInput>
  onSaved?: (params: { formData: TFormData; created: TCreateData | null; entityId: string | null }) => Promise<void>
  normalizeData?: (data: TData) => Partial<TFormData>
  getName?: (data: TData) => string | null | undefined

  renderFields?: (props: RenderFieldsProps<TData, TUpdateInput>) => React.ReactNode
  renderHeader?: (props: RenderHeaderProps) => React.ReactNode
  extraContent?: React.ReactNode
  extraMenuActions?: SlideoutMenuAction[]
  overrideContent?: React.ReactNode
  overrideHeader?: React.ReactNode
  overrideFooter?: React.ReactNode
  minWidth?: string | number
  initialWidth?: string | number
}

export function GenericDetailsSheet<TFormData extends FieldValues, TData, TUpdateInput, TUpdateData, TCreateInput, TCreateData>(
  config: GenericDetailsSheetConfig<TFormData, TData, TUpdateInput, TUpdateData, TCreateInput, TCreateData>,
) {
  const [isEditing, setIsEditing] = useState(false)
  const [internalEditing, setInternalEditing] = useState<string | null>(null)
  const [pendingDiscard, setPendingDiscard] = useState<'close' | 'edit' | null>(null)
  const [isFormInitialized, setIsFormInitialized] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const {
    form,
    updateMutation,
    createMutation,
    deleteMutation,
    objectType,
    displayName,
    data,
    isFetching,
    buildPayload,
    onSaved,
    normalizeData,
    formId: formIdOverride,
    renderHeader,
    renderFields,
    extraContent,
    extraMenuActions,
    overrideContent,
    overrideHeader,
    overrideFooter,
    onClose,
    entityId: entityIdOverride,
    isCreateMode,
    basePath,
    minWidth: minWidthOverride,
    initialWidth: initialWidthOverride,
  } = config
  const generatedFormId = useId()
  const formId = formIdOverride ?? generatedFormId

  const { reset } = form
  const { isDirty } = form.formState
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const { successNotification, errorNotification } = useNotification()

  const searchParams = useSearchParams()
  const id = entityIdOverride !== undefined ? entityIdOverride : searchParams.get('id')
  const isCreate = isCreateMode !== undefined ? isCreateMode : searchParams.get('create') === 'true'

  const permissionRoles = useObjectPermissionRoles(objectType, id)
  const isEditAllowed = !!updateMutation && canEdit(permissionRoles, session)
  const isDeleteAllowed = !!deleteMutation && canDelete(permissionRoles)

  const objectTypeName = objectType.charAt(0).toUpperCase() + objectType.slice(1).toLowerCase()
  const createSuccessTitle = `${objectTypeName} Created`
  const createSuccessDescription = `The ${objectTypeName.toLowerCase()} has been successfully created.`
  const updateSuccessTitle = `${objectTypeName} Updated`
  const updateSuccessDescription = `The ${objectTypeName.toLowerCase()} has been successfully updated.`

  const queryKey = [pluralizeTypeName(objectType.toLowerCase())]

  useEffect(() => {
    if (id || isCreate) {
      setIsOpen(true)
      setIsEditing(isCreate)
      setIsFormInitialized(false)

      if (isCreate) {
        reset({} as TFormData, { keepDefaultValues: false })
      } else if (data) {
        const normalizedData = normalizeData ? normalizeData(data) : Object.fromEntries(Object.entries(data ?? {}).map(([key, value]) => [key, value === null ? undefined : value]))
        reset(normalizedData as TFormData, { keepDefaultValues: false, keepDirty: false })
      }

      requestAnimationFrame(() => {
        setIsFormInitialized(true)
      })

      return
    }

    setIsOpen(false)
    setIsFormInitialized(false)
  }, [data, isCreate, id, normalizeData, reset])

  const closeSheet = () => {
    setIsFormInitialized(false)
    setIsOpen(false)
    onClose?.()
  }

  const exitEditMode = () => {
    setIsEditing(false)
    reset()
  }

  const handleSheetClose = () => {
    if (isEditing && isFormInitialized && isDirty) {
      setPendingDiscard('close')
      return
    }

    onClose?.()
  }

  const handleCancelEdit = () => {
    if (isFormInitialized && isDirty) {
      setPendingDiscard(isCreate ? 'close' : 'edit')
      return
    }

    if (isCreate) {
      onClose?.()
    } else {
      exitEditMode()
    }
  }

  const handleConfirmDiscard = () => {
    const intent = pendingDiscard
    setPendingDiscard(null)

    if (intent === 'edit') {
      exitEditMode()
      return
    }

    closeSheet()
  }

  const runPostSave = async (params: { formData: TFormData; created: TCreateData | null; entityId: string | null }): Promise<boolean> => {
    if (!onSaved) return true
    try {
      await onSaved(params)
      return true
    } catch (error) {
      errorNotification({
        title: `${objectTypeName} saved with errors`,
        description: `The ${objectTypeName.toLowerCase()} was saved, but some associations could not be updated: ${parseErrorMessage(error)}`,
      })
      return false
    }
  }

  const onSubmit = async (formData: TFormData) => {
    if (!buildPayload) return
    try {
      const payload = await buildPayload(formData)

      if (isCreate && createMutation) {
        const created = await createMutation.mutateAsync(payload as TCreateInput)

        const postSaveSucceeded = await runPostSave({ formData, created, entityId: null })

        queryClient.invalidateQueries({ queryKey })
        if (postSaveSucceeded) {
          successNotification({
            title: createSuccessTitle,
            description: createSuccessDescription,
          })
        }

        onClose?.()
      } else if (id && updateMutation) {
        await updateMutation.mutateAsync({ id, input: payload as TUpdateInput })

        const postSaveSucceeded = await runPostSave({ formData, created: null, entityId: id })

        queryClient.invalidateQueries({ queryKey })
        if (postSaveSucceeded) {
          successNotification({
            title: updateSuccessTitle,
            description: updateSuccessDescription,
          })
        }

        setIsEditing(false)
      }
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleDelete =
    deleteMutation && isDeleteAllowed
      ? async (id: string) => {
          try {
            const result = await deleteMutation.mutateAsync({ ids: [id] })

            if (result.notDeletedIDs.length > 0 || result.error) {
              errorNotification({
                title: 'Error',
                description: getBulkActionFailureDescription({
                  failedCount: result.notDeletedIDs.length,
                  singular: objectTypeName.toLowerCase(),
                  verb: 'could not be deleted',
                  fallback: result.error ?? `The ${objectTypeName.toLowerCase()} could not be deleted.`,
                }),
              })
              return
            }

            queryClient.invalidateQueries({ queryKey })
            successNotification({
              title: `${objectTypeName} Deleted`,
              description: `The ${objectTypeName.toLowerCase()} has been successfully deleted.`,
            })

            onClose?.()
          } catch (error) {
            const errorMessage = parseErrorMessage(error)
            errorNotification({
              title: 'Error',
              description: errorMessage,
            })
          }
        }
      : undefined

  const isSavePending = (updateMutation?.isPending || createMutation?.isPending) ?? false
  const isContentLoading = isFetching && !isCreate
  const showFormFooter = !overrideContent && !isContentLoading && ((isCreate && !!createMutation) || (isEditing && !!updateMutation))

  const handleUpdateField = async (input: TUpdateInput) => {
    if (!id || isEditing || !updateMutation) {
      return
    }
    try {
      await updateMutation.mutateAsync({ id, input })
      successNotification({
        title: updateSuccessTitle,
        description: updateSuccessDescription,
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  return (
    <>
      <Sheet
        open={isOpen}
        onOpenChange={(open) => {
          if (!open && !pendingDiscard) {
            handleSheetClose()
          }
        }}
      >
        <SheetContent
          key={isCreate ? 'create' : id}
          onEscapeKeyDown={(e) => {
            if (internalEditing || isDirty) {
              e.preventDefault()
              if (isDirty) {
                setPendingDiscard('close')
              }
            } else {
              handleSheetClose()
            }
          }}
          side="right"
          className="flex flex-col "
          minWidth={minWidthOverride ?? '40vw'}
          initialWidth={initialWidthOverride ?? '60vw'}
          footer={
            overrideFooter ? (
              overrideFooter
            ) : showFormFooter ? (
              <SlideoutFormFooter formId={formId} onCancel={handleCancelEdit} isPending={isSavePending} saveLabel={isCreate ? 'Create' : 'Save'} savingLabel={isCreate ? 'Creating...' : 'Saving...'} />
            ) : undefined
          }
          header={
            overrideHeader ? (
              overrideHeader
            ) : renderHeader ? (
              renderHeader({ close: handleSheetClose })
            ) : (
              <GenericSheetHeader
                close={handleSheetClose}
                isEditing={isEditing}
                isCreate={isCreate}
                setIsEditing={setIsEditing}
                entityType={objectType}
                displayName={displayName}
                isEditAllowed={isEditAllowed}
                onDelete={handleDelete}
                entityId={id}
                basePath={basePath}
                extraMenuActions={extraMenuActions}
              />
            )
          }
        >
          {isContentLoading ? (
            <GenericDetailsSheetSkeleton />
          ) : overrideContent ? (
            overrideContent
          ) : (
            <>
              <Form {...form}>
                <form
                  onSubmit={(e) => {
                    e.stopPropagation()
                    form.handleSubmit(onSubmit)(e)
                  }}
                  id={formId}
                  className="space-y-6 mt-4"
                >
                  {renderFields
                    ? renderFields({
                        isEditing,
                        isCreate,
                        data,
                        isFormInitialized,
                        internalEditing,
                        setInternalEditing,
                        handleUpdateField,
                        isEditAllowed,
                      })
                    : null}
                </form>
              </Form>
              {extraContent}
            </>
          )}
        </SheetContent>
      </Sheet>
      <CancelDialog isOpen={!!pendingDiscard} onConfirm={handleConfirmDiscard} onCancel={() => setPendingDiscard(null)} />
    </>
  )
}

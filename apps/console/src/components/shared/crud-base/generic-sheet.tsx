'use client'

import React, { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Sheet, SheetContent } from '@repo/ui/sheet'
import { useNotification } from '@/hooks/useNotification'
import { Form } from '@repo/ui/form'
import { useQueryClient } from '@tanstack/react-query'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog.tsx'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { UseFormReturn, FieldValues } from 'react-hook-form'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { canEdit } from '@/lib/authz/utils'
import { GenericSheetHeader } from './header'
import { GenericDetailsSheetSkeleton } from './skeleton/details-sheet-skeleton'
import { pluralizeTypeName } from '@/utils/strings'

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
  isEditing: boolean
  isPending: boolean
  isCreate: boolean
  setIsEditing: (value: boolean) => void
  name?: string | null
  isEditAllowed: boolean
  handleCancelEdit: () => void
  formId: string
}

export interface GenericDetailsSheetConfig<TFormData extends FieldValues, TData, TUpdateInput, TUpdateData, TCreateInput, TCreateData> {
  objectType: ObjectTypes
  form: UseFormReturn<TFormData>

  createMutation: {
    mutateAsync: (input: TCreateInput) => Promise<TCreateData>
    isPending: boolean
  }

  updateMutation: {
    mutateAsync: (params: { id: string; input: TUpdateInput }) => Promise<TUpdateData>
    isPending: boolean
  }

  deleteMutation?: {
    mutateAsync: (params: { ids: string[] }) => Promise<string[]>
    isPending: boolean
  }

  onClose?: () => void

  data?: TData
  isFetching: boolean
  formId?: string

  buildPayload: (data: TFormData) => Promise<TUpdateInput | TCreateInput>
  normalizeData?: (data: TData) => Partial<TFormData>
  getName?: (data: TData) => string | null | undefined

  renderFields?: (props: RenderFieldsProps<TData, TUpdateInput>) => React.ReactNode
  renderHeader?: (props: RenderHeaderProps) => React.ReactNode
}

export function GenericDetailsSheet<TFormData extends FieldValues, TData, TUpdateInput, TUpdateData, TCreateInput, TCreateData>(
  config: GenericDetailsSheetConfig<TFormData, TData, TUpdateInput, TUpdateData, TCreateInput, TCreateData>,
) {
  const [isEditing, setIsEditing] = useState(false)
  const [internalEditing, setInternalEditing] = useState<string | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [isFormInitialized, setIsFormInitialized] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const { form, updateMutation, createMutation, deleteMutation, objectType, data, isFetching, buildPayload, normalizeData, getName, formId = 'editForm', renderHeader, renderFields, onClose } = config
  const { reset } = form
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()

  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const isCreate = searchParams.get('create') === 'true'

  const { data: permission } = useAccountRoles(objectType, id)
  const isEditAllowed = canEdit(permission?.roles)

  const objectTypeName = objectType.charAt(0).toUpperCase() + objectType.slice(1).toLowerCase()
  const createSuccessTitle = `${objectTypeName} Created`
  const createSuccessDescription = `The ${objectTypeName.toLowerCase()} has been successfully created.`
  const updateSuccessTitle = `${objectTypeName} Updated`
  const updateSuccessDescription = `The ${objectTypeName.toLowerCase()} has been successfully updated.`

  const queryKey = [pluralizeTypeName(objectType.toLowerCase())]

  const [prevDeps, setPrevDeps] = useState({ data, isCreate, id })
  if (data !== prevDeps.data || isCreate !== prevDeps.isCreate || id !== prevDeps.id) {
    setPrevDeps({ data, isCreate, id })
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
    } else {
      setIsOpen(false)
      setIsFormInitialized(false)
    }
  }

  const handleSheetClose = () => {
    if (isEditing && isFormInitialized && form.formState.isDirty) {
      setShowCancelDialog(true)
      return
    }

    onClose?.()
  }

  const handleConfirmClose = () => {
    setIsFormInitialized(false)
    setIsOpen(false)
    setShowCancelDialog(false)

    onClose?.()
  }

  const handleCancelEdit = () => {
    if (isFormInitialized && form.formState.isDirty) {
      setShowCancelDialog(true)

      return
    }

    if (isCreate) {
      onClose?.()
    } else {
      setIsEditing(false)
      reset()
    }
  }

  const onSubmit = async (formData: TFormData) => {
    try {
      const payload = await buildPayload(formData)

      if (isCreate) {
        await createMutation.mutateAsync(payload as TCreateInput)

        queryClient.invalidateQueries({ queryKey })
        successNotification({
          title: createSuccessTitle,
          description: createSuccessDescription,
        })

        onClose?.()
      } else if (id) {
        await updateMutation.mutateAsync({ id, input: payload as TUpdateInput })

        queryClient.invalidateQueries({ queryKey })
        successNotification({
          title: updateSuccessTitle,
          description: updateSuccessDescription,
        })

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

  const handleDelete = async (id: string) => {
    if (!deleteMutation) {
      return
    }

    try {
      await deleteMutation.mutateAsync({ ids: [id] })

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

  const handleUpdateField = async (input: TUpdateInput) => {
    if (!id || isEditing) {
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
          if (!open && !showCancelDialog) {
            handleSheetClose()
          }
        }}
      >
        <SheetContent
          key={isCreate ? 'create' : id}
          onEscapeKeyDown={(e) => {
            if (internalEditing || form.formState.isDirty) {
              e.preventDefault()
              if (form.formState.isDirty) {
                setShowCancelDialog(true)
              }
            } else {
              handleSheetClose()
            }
          }}
          side="right"
          className="flex flex-col "
          minWidth="40vw"
          initialWidth={'60vw'}
          header={
            renderHeader ? (
              renderHeader({
                close: handleSheetClose,
                isEditing,
                isPending: updateMutation.isPending || createMutation.isPending,
                isCreate,
                setIsEditing,
                name: data && getName ? getName(data) : null,
                isEditAllowed,
                handleCancelEdit,
                formId,
              })
            ) : (
              <GenericSheetHeader
                close={handleSheetClose}
                isEditing={isEditing}
                isPending={updateMutation.isPending || createMutation.isPending}
                isCreate={isCreate}
                setIsEditing={setIsEditing}
                entityType={objectType}
                isEditAllowed={isEditAllowed}
                handleCancelEdit={handleCancelEdit}
                formId={formId}
                onDelete={handleDelete}
              />
            )
          }
        >
          {isFetching && !isCreate ? (
            <GenericDetailsSheetSkeleton />
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} id={formId} className="space-y-6 mt-4">
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
          )}
        </SheetContent>
      </Sheet>
      <CancelDialog isOpen={showCancelDialog} onConfirm={handleConfirmClose} onCancel={() => setShowCancelDialog(false)} />
    </>
  )
}

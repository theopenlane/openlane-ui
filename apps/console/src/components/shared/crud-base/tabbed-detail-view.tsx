'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useNotification } from '@/hooks/useNotification'
import { Form } from '@repo/ui/form'
import { useQueryClient } from '@tanstack/react-query'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@repo/ui/tabs'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog.tsx'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { type FieldValues } from 'react-hook-form'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { canEdit } from '@/lib/authz/utils'
import { GenericSheetHeader } from './header'
import { GenericDetailsSheetSkeleton } from './skeleton/details-sheet-skeleton'
import { pluralizeTypeName, toHumanLabel } from '@/utils/strings'
import type { TabConfig } from './types'
import type { RenderFieldsProps, RenderHeaderProps, GenericDetailsSheetConfig } from './generic-sheet'

export interface TabbedDetailViewConfig<TFormData extends FieldValues, TData, TUpdateInput, TUpdateData, TCreateInput, TCreateData> extends Omit<
  GenericDetailsSheetConfig<TFormData, TData, TUpdateInput, TUpdateData, TCreateInput, TCreateData>,
  'renderFields'
> {
  tabs: TabConfig<TData, TUpdateInput>[]
  renderFields?: (props: RenderFieldsProps<TData, TUpdateInput>) => React.ReactNode
}

export function TabbedDetailView<TFormData extends FieldValues, TData, TUpdateInput, TUpdateData, TCreateInput, TCreateData>(
  config: TabbedDetailViewConfig<TFormData, TData, TUpdateInput, TUpdateData, TCreateInput, TCreateData>,
) {
  const [isEditing, setIsEditing] = useState(false)
  const [internalEditing, setInternalEditing] = useState<string | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [isFormInitialized, setIsFormInitialized] = useState(false)

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
    normalizeData,
    getName,
    formId = 'editForm',
    renderHeader,
    renderFields,
    tabs,
    onClose,
  } = config
  const { reset } = form
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()

  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const isCreate = searchParams.get('create') === 'true'

  const { data: permission } = useAccountRoles(objectType, id)
  const isEditAllowed = canEdit(permission?.roles)

  const objectTypeName = displayName ?? toHumanLabel(objectType)
  const queryKey = [pluralizeTypeName(objectType.toLowerCase())]

  useEffect(() => {
    if (id || isCreate) {
      setIsEditing(isCreate)
      setIsFormInitialized(false)

      if (isCreate) {
        reset({} as TFormData, { keepDefaultValues: false })
      } else if (data) {
        const normalizedData = normalizeData ? normalizeData(data) : Object.fromEntries(Object.entries(data ?? {}).map(([key, value]) => [key, value === null ? undefined : value]))
        reset(normalizedData as TFormData, { keepDefaultValues: false, keepDirty: false })
      }

      const rafId = requestAnimationFrame(() => {
        setIsFormInitialized(true)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [data, isCreate, id, normalizeData, reset])

  const handleClose = () => {
    if (isEditing && isFormInitialized && form.formState.isDirty) {
      setShowCancelDialog(true)
      return
    }
    onClose?.()
  }

  const handleConfirmClose = () => {
    setIsFormInitialized(false)
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
      if (!buildPayload) return
      const payload = await buildPayload(formData)

      if (isCreate) {
        if (!createMutation) return
        await createMutation.mutateAsync(payload as TCreateInput)
        queryClient.invalidateQueries({ queryKey })
        successNotification({
          title: `${objectTypeName} Created`,
          description: `The ${objectTypeName.toLowerCase()} has been successfully created.`,
        })
        onClose?.()
      } else if (id) {
        if (!updateMutation) return
        await updateMutation.mutateAsync({ id, input: payload as TUpdateInput })
        queryClient.invalidateQueries({ queryKey })
        successNotification({
          title: `${objectTypeName} Updated`,
          description: `The ${objectTypeName.toLowerCase()} has been successfully updated.`,
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

  const handleDelete = async (entityId: string) => {
    if (!deleteMutation) return

    try {
      await deleteMutation.mutateAsync({ ids: [entityId] })
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
    if (!id || isEditing || !updateMutation) return
    try {
      await updateMutation.mutateAsync({ id, input })
      successNotification({
        title: `${objectTypeName} Updated`,
        description: `The ${objectTypeName.toLowerCase()} has been successfully updated.`,
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const isPending = (updateMutation?.isPending ?? false) || (createMutation?.isPending ?? false)

  const headerProps: RenderHeaderProps = {
    close: handleClose,
    isEditing,
    isPending,
    isCreate,
    setIsEditing,
    name: data && getName ? getName(data) : null,
    isEditAllowed,
    handleCancelEdit,
    formId,
  }

  const fieldProps: RenderFieldsProps<TData, TUpdateInput> = {
    isEditing,
    isCreate,
    data,
    isFormInitialized,
    internalEditing,
    setInternalEditing,
    handleUpdateField,
    isEditAllowed,
  }

  const defaultTab = tabs[0]?.id ?? 'details'

  return (
    <div className="flex flex-col gap-4">
      <div className="border-b pb-4">
        {renderHeader ? (
          renderHeader(headerProps)
        ) : (
          <GenericSheetHeader
            close={handleClose}
            isEditing={isEditing}
            isPending={isPending}
            isCreate={isCreate}
            setIsEditing={setIsEditing}
            entityType={objectType}
            displayName={displayName}
            isEditAllowed={isEditAllowed}
            handleCancelEdit={handleCancelEdit}
            formId={formId}
            onDelete={handleDelete}
          />
        )}
      </div>

      {isFetching && !isCreate ? (
        <GenericDetailsSheetSkeleton />
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id={formId}>
            <Tabs defaultValue={defaultTab} variant="underline">
              <TabsList>
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {tabs.map((tab, index) => (
                <TabsContent key={tab.id} value={tab.id} className="mt-4">
                  {index === 0 && renderFields ? <div className="space-y-6">{renderFields(fieldProps)}</div> : tab.render(fieldProps as RenderFieldsProps<TData, TUpdateInput>)}
                </TabsContent>
              ))}
            </Tabs>
          </form>
        </Form>
      )}

      <CancelDialog isOpen={showCancelDialog} onConfirm={handleConfirmClose} onCancel={() => setShowCancelDialog(false)} />
    </div>
  )
}

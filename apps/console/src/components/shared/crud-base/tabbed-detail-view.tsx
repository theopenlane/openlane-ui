'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useNotification } from '@/hooks/useNotification'
import { Form } from '@repo/ui/form'
import { useQueryClient } from '@tanstack/react-query'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@repo/ui/tabs'
import { SheetFooter } from '@repo/ui/sheet'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog.tsx'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { type FieldValues } from 'react-hook-form'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { canEdit } from '@/lib/authz/utils'
import { GenericSheetHeader } from './header'
import { SlideoutFormFooter } from './slideout-footer'
import { GenericDetailsSheetSkeleton } from './skeleton/details-sheet-skeleton'
import { pluralizeTypeName, toHumanLabel } from '@/utils/strings'
import type { TabConfig } from './types'
import type { RenderFieldsProps, GenericDetailsSheetConfig } from './generic-sheet'
import { getBulkActionFailureDescription } from './bulk-action-feedback'
import { useSession } from 'next-auth/react'

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
  const [pendingDiscard, setPendingDiscard] = useState<'close' | 'edit' | null>(null)
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
    formId = 'editForm',
    renderHeader,
    renderFields,
    tabs,
    onClose,
  } = config
  const { reset } = form
  const { isDirty } = form.formState
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()

  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const isCreate = searchParams.get('create') === 'true'

  const { data: permission } = useAccountRoles(objectType, id)
  const { data: session } = useSession()
  const isEditAllowed = canEdit(permission?.roles, session)

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

  const exitEditMode = () => {
    setIsEditing(false)
    reset()
  }

  const handleClose = () => {
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

    setIsFormInitialized(false)
    onClose?.()
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
      const result = await deleteMutation.mutateAsync({ ids: [entityId] })

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
          renderHeader({ close: handleClose })
        ) : (
          <GenericSheetHeader
            close={handleClose}
            isEditing={isEditing}
            isCreate={isCreate}
            setIsEditing={setIsEditing}
            entityType={objectType}
            displayName={displayName}
            isEditAllowed={isEditAllowed}
            onDelete={handleDelete}
            titleAs="h2"
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

      {((isCreate && !!createMutation) || (isEditing && !!updateMutation)) && !(isFetching && !isCreate) && (
        <SheetFooter>
          <SlideoutFormFooter formId={formId} onCancel={handleCancelEdit} isPending={isPending} saveLabel={isCreate ? 'Create' : 'Save'} savingLabel={isCreate ? 'Creating...' : 'Saving...'} />
        </SheetFooter>
      )}

      <CancelDialog isOpen={!!pendingDiscard} onConfirm={handleConfirmDiscard} onCancel={() => setPendingDiscard(null)} />
    </div>
  )
}

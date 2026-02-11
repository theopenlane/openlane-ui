'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sheet, SheetContent } from '@repo/ui/sheet'
import { useNotification } from '@/hooks/useNotification'
import useFormSchema, { EditAssetFormData } from '@/components/pages/protected/assets/hooks/use-form-schema'
import { Form } from '@repo/ui/form'
import { useQueryClient } from '@tanstack/react-query'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog.tsx'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { canEdit } from '@/lib/authz/utils'
import { buildAssetPayload } from '../utils'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { useAsset, useUpdateAsset } from '@/lib/graphql-hooks/assets'
import { UpdateAssetInput } from '@repo/codegen/src/schema'
import AssetsSheetHeader from '../form/fields/header'
import { AssetsDetailsSheetSkeleton } from '../../skeleton/details-sheet-skeleton'
import NameField from '../form/fields/title-field'
import DescriptionField from '../form/fields/details-field'
import Properties from '../form/fields/properties'

const AssetDetailsSheet = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [internalEditing, setInternalEditing] = useState<keyof EditAssetFormData | null>(null)
  const queryClient = useQueryClient()
  const plateEditorHelper = usePlateEditor()
  const router = useRouter()
  const { successNotification, errorNotification } = useNotification()
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState<boolean>(false)
  const { mutateAsync: updateAsset, isPending } = useUpdateAsset()

  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const { data: permission } = useAccountRoles(ObjectTypes.ASSET, id)
  const isEditAllowed = canEdit(permission?.roles)
  const { data, isLoading: fetching } = useAsset(id as string)
  const assetData = data?.asset
  const { form } = useFormSchema()

  useEffect(() => {
    if (assetData) {
      form.reset({
        name: assetData.name ?? '',
        tags: assetData?.tags ?? [],
      })
    }
  }, [assetData, form])

  const handleSheetClose = () => {
    if (isEditing) {
      setIsDiscardDialogOpen(true)
      return
    }
    handleCloseParams()
  }

  const handleCloseParams = () => {
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.delete('id')
    router.replace(`${window.location.pathname}?${newSearchParams.toString()}`)
    setIsEditing(false)
  }

  const onSubmit = async (data: EditAssetFormData) => {
    if (!id) {
      return
    }

    const formData: UpdateAssetInput = await buildAssetPayload(data, plateEditorHelper)

    try {
      await updateAsset({
        updateAssetId: id as string,
        input: formData,
      })

      queryClient.invalidateQueries({ queryKey: ['assets'] })
      successNotification({
        title: 'Asset Updated',
        description: 'The asset has been successfully updated.',
      })

      setIsEditing(false)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleUpdateField = async (input: UpdateAssetInput) => {
    if (!id || isEditing) {
      return
    }
    try {
      await updateAsset({ updateAssetId: id, input })
      successNotification({
        title: 'Asset updated',
        description: 'The asset has been successfully updated.',
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
    <Sheet open={!!id} onOpenChange={handleSheetClose}>
      <SheetContent
        onEscapeKeyDown={(e) => {
          if (internalEditing) {
            e.preventDefault()
          } else {
            handleSheetClose()
          }
        }}
        side="right"
        className="flex flex-col"
        minWidth={470}
        header={<AssetsSheetHeader close={handleSheetClose} isEditing={isEditing} isPending={isPending} setIsEditing={setIsEditing} name={assetData?.name} isEditAllowed={isEditAllowed} />}
      >
        {fetching ? (
          <AssetsDetailsSheetSkeleton />
        ) : (
          <>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} id="editAsset">
                <NameField
                  isEditing={isEditing}
                  isEditAllowed={isEditAllowed}
                  handleUpdate={handleUpdateField}
                  initialValue={assetData?.name}
                  internalEditing={internalEditing}
                  setInternalEditing={setInternalEditing}
                />
                <DescriptionField isEditing={isEditing} initialValue={assetData?.description} />

                <Properties
                  isEditing={isEditing}
                  data={assetData}
                  internalEditing={internalEditing}
                  setInternalEditing={setInternalEditing}
                  handleUpdate={handleUpdateField}
                  isEditAllowed={isEditAllowed}
                />
              </form>
            </Form>
          </>
        )}
        <CancelDialog
          isOpen={isDiscardDialogOpen}
          onConfirm={() => {
            setIsDiscardDialogOpen(false)
            handleCloseParams()
          }}
          onCancel={() => setIsDiscardDialogOpen(false)}
        />
      </SheetContent>
    </Sheet>
  )
}

export default AssetDetailsSheet

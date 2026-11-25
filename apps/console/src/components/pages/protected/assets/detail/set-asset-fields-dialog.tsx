'use client'

import React, { useRef } from 'react'
import { type FieldErrors, FormProvider } from 'react-hook-form'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { type UpdateAssetInput } from '@repo/codegen/src/schema'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { ResponsibilityField } from '@/components/shared/crud-base/form-fields/responsibility-field'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { useDirtyInput } from '@/hooks/useDirtyInput'
import { useNotification } from '@/hooks/useNotification'
import { useUpdateAsset } from '@/lib/graphql-hooks/asset'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { isOneOf } from '@/utils/type-guards'
import { normalizeAssetData, type AssetDetailNode } from '../asset-display'
import { ASSET_INTERNAL_OWNER, ASSET_UPDATE_FIELDS } from '../hooks/asset-update-fields'
import { useAssetEnumOptions } from '../hooks/use-asset-enum-options'
import useFormSchema, { type AssetFormData } from '../hooks/use-form-schema'

const DIALOG_TITLES = {
  'set-owner': 'Set owner',
  'set-classification': 'Set classification and protection',
  'set-environment-scope': 'Set environment and scope',
} as const

export type TAssetFieldsDialog = keyof typeof DIALOG_TITLES

export const isAssetFieldsDialog = isOneOf<TAssetFieldsDialog>(['set-owner', 'set-classification', 'set-environment-scope'])

type TSetAssetFieldsDialogProps = {
  kind: TAssetFieldsDialog
  asset: AssetDetailNode
  onClose: () => void
}

const ignoreInlineEditing = () => {}

export const SetAssetFieldsDialog: React.FC<TSetAssetFieldsDialogProps> = ({ kind, asset, onClose }) => {
  const { form } = useFormSchema(normalizeAssetData(asset))
  const buildDirtyInput = useDirtyInput(form)
  const { mutateAsync: updateAsset, isPending } = useUpdateAsset()
  const { enumOpts, enumCreateHandlers } = useAssetEnumOptions()
  const { successNotification, errorNotification } = useNotification()
  const isSavingRef = useRef(false)
  const fieldProps = { isEditing: true, isEditAllowed: true, data: asset, internalEditing: null, setInternalEditing: ignoreInlineEditing, labelClassName: 'text-sm' }

  const handleSave = async (values: AssetFormData) => {
    if (isSavingRef.current) return
    isSavingRef.current = true
    try {
      const input = await buildDirtyInput<UpdateAssetInput>(values, ASSET_UPDATE_FIELDS)
      if (Object.keys(input).length > 0) {
        await updateAsset({ updateAssetId: asset.id, input })
        successNotification({ title: 'Asset updated' })
      }
      onClose()
    } catch (error) {
      errorNotification({ title: 'Failed to update asset', description: parseErrorMessage(error) })
    } finally {
      isSavingRef.current = false
    }
  }

  const handleInvalid = (errors: FieldErrors<AssetFormData>) =>
    errorNotification({ title: 'Asset not saved', description: Object.values(errors)[0]?.message?.toString() ?? 'Fix the asset fields and try again.' })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{DIALOG_TITLES[kind]}</DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form
            onSubmit={(event) => {
              event.stopPropagation()
              form.handleSubmit(handleSave, handleInvalid)(event)
            }}
            className="min-w-0 space-y-4"
          >
            {kind === 'set-owner' && <ResponsibilityField name="internalOwner" fieldBaseName={ASSET_INTERNAL_OWNER.fieldBaseName} label="Owner" {...fieldProps} />}
            {kind === 'set-classification' && (
              <>
                <SelectField
                  name="assetDataClassificationName"
                  label="Data classification"
                  options={enumOpts.assetDataClassificationOptions}
                  onCreateOption={enumCreateHandlers.assetDataClassificationName}
                  {...fieldProps}
                />
                <SelectField name="securityTierName" label="Security tier" options={enumOpts.securityTierOptions} onCreateOption={enumCreateHandlers.securityTierName} {...fieldProps} />
                <SelectField
                  name="encryptionStatusName"
                  label="Encryption status"
                  options={enumOpts.encryptionStatusOptions}
                  onCreateOption={enumCreateHandlers.encryptionStatusName}
                  {...fieldProps}
                />
                <SelectField name="accessModelName" label="Access model" options={enumOpts.accessModelOptions} onCreateOption={enumCreateHandlers.accessModelName} {...fieldProps} />
              </>
            )}
            {kind === 'set-environment-scope' && (
              <>
                <SelectField name="environmentName" label="Environment" options={enumOpts.environmentOptions} onCreateOption={enumCreateHandlers.environmentName} {...fieldProps} />
                <SelectField name="scopeName" label="Scope" options={enumOpts.scopeOptions} onCreateOption={enumCreateHandlers.scopeName} {...fieldProps} />
              </>
            )}
            <DialogFooter>
              <SaveButton disabled={isPending} isSaving={isPending} />
              <CancelButton disabled={isPending} onClick={onClose} />
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}

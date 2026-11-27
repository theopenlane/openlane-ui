'use client'

import { useMemo, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import AddAssociationPlusBtn from '@/components/shared/object-association/add-association-plus-btn.tsx'
import type { AssociationsData, AssociationsRoot } from '@/components/shared/object-association/association-section'
import { type ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { AssociateObjectsDialog } from '@/components/shared/object-association/picker/associate-objects-dialog'
import { type TAssociationUpdateInput } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { buildInitialAssociationIds } from '@/components/shared/object-association/utils'
import { useControllableOpen } from '@/hooks/useControllableOpen'
import { getObjectDisplayName } from '@/utils/object-display-name'

export type SetAssociationDialogConfig<TRootField extends string = string, TSectionKey extends string = string, TFieldKey extends string = string> = {
  dataRootField: TRootField
  sourceType: ObjectTypeObjects
  invalidateQueryKey: string
  successMessage: string
  allowedObjectTypes: readonly ObjectTypeObjects[]
  initialDataKeys: Record<TFieldKey, TSectionKey>
  relatedInvalidateQueryKeys?: readonly (readonly unknown[])[]
}

type SetAssociationDialogProps<TRootField extends string, TSectionKey extends string, TFieldKey extends string> = {
  config: SetAssociationDialogConfig<TRootField, TSectionKey, TFieldKey>
  associationsData: AssociationsData<TRootField, TSectionKey> | undefined
  onUpdate: (input: TAssociationUpdateInput<TFieldKey>) => Promise<void>
  objectName?: string
  trigger?: ReactNode
  defaultSelectedObject?: ObjectTypeObjects
  allowedObjectTypes?: readonly ObjectTypeObjects[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function SetAssociationDialog<TRootField extends string, TSectionKey extends string, TFieldKey extends string>({
  config,
  associationsData,
  onUpdate,
  objectName,
  trigger,
  defaultSelectedObject,
  allowedObjectTypes,
  open: controlledOpen,
  onOpenChange: onControlledOpenChange,
}: SetAssociationDialogProps<TRootField, TSectionKey, TFieldKey>) {
  const queryClient = useQueryClient()
  const [open, setOpen, isControlled] = useControllableOpen({ open: controlledOpen, onOpenChange: onControlledOpenChange })
  const root: AssociationsRoot<TSectionKey> | undefined = associationsData?.[config.dataRootField]

  const initialData = useMemo(() => (root ? buildInitialAssociationIds<TRootField, TFieldKey>(config, associationsData) : undefined), [config, associationsData, root])

  const handleSave = async (input: TAssociationUpdateInput<TFieldKey>) => {
    await onUpdate(input)

    queryClient.invalidateQueries({ queryKey: [config.invalidateQueryKey] }, { cancelRefetch: false })
    for (const relatedKey of config.relatedInvalidateQueryKeys ?? []) {
      queryClient.invalidateQueries({ queryKey: relatedKey }, { cancelRefetch: false })
    }
  }

  return (
    <AssociateObjectsDialog
      sourceType={config.sourceType}
      sourceName={objectName || getObjectDisplayName(root)}
      initialData={initialData}
      allowedObjectTypes={allowedObjectTypes ?? config.allowedObjectTypes}
      defaultSelectedObject={defaultSelectedObject}
      successMessage={config.successMessage}
      onSave={handleSave}
      trigger={isControlled ? undefined : (trigger ?? <AddAssociationPlusBtn />)}
      open={open}
      onOpenChange={setOpen}
    />
  )
}

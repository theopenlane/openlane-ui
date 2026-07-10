'use client'

import ObjectAssociation from '@/components/shared/object-association/object-association'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { type ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { type TAssociationUpdateInput, type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useQueryClient } from '@tanstack/react-query'
import AddAssociationPlusBtn from '@/components/shared/object-association/add-association-plus-btn.tsx'
import { buildInitialAssociationIds, getAssociationInput } from '@/components/shared/object-association/utils'
import type { AssociationsData } from '@/components/shared/object-association/association-section'

export type SetAssociationDialogConfig<TRootField extends string = string, TSectionKey extends string = string, TFieldKey extends string = string> = {
  dataRootField: TRootField
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
  trigger,
  defaultSelectedObject,
  allowedObjectTypes,
  open: controlledOpen,
  onOpenChange,
}: SetAssociationDialogProps<TRootField, TSectionKey, TFieldKey>) {
  const queryClient = useQueryClient()

  const [associations, setAssociations] = useState<TObjectAssociationMap<TFieldKey>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [objectAssociationKey, setObjectAssociationKey] = useState(0)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen

  const { errorNotification, successNotification } = useNotification()

  const initialData: TObjectAssociationMap<TFieldKey> = useMemo(() => buildInitialAssociationIds<TRootField, TFieldKey>(config, associationsData), [config, associationsData])

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange],
  )

  const wasOpenRef = useRef(false)
  const initialDataAppliedRef = useRef(false)
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setObjectAssociationKey((prev) => prev + 1)
      setAssociations(initialData)
      initialDataAppliedRef.current = Object.keys(initialData).length > 0
    } else if (!open && wasOpenRef.current) {
      setAssociations({})
      initialDataAppliedRef.current = false
    } else if (open && !initialDataAppliedRef.current && Object.keys(initialData).length > 0) {
      setAssociations(initialData)
      initialDataAppliedRef.current = true
    }
    wasOpenRef.current = open
  }, [open, initialData])

  const onSave = async () => {
    setIsSaving(true)
    try {
      const associationInputs = getAssociationInput(initialData, associations)
      if (Object.keys(associationInputs).length === 0) {
        handleOpenChange(false)
        return
      }
      await onUpdate(associationInputs)

      queryClient.invalidateQueries({ queryKey: [config.invalidateQueryKey] })
      for (const relatedKey of config.relatedInvalidateQueryKeys ?? []) {
        queryClient.invalidateQueries({ queryKey: relatedKey })
      }
      successNotification({ title: config.successMessage })
      handleOpenChange(false)
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isControlled && <DialogTrigger asChild>{trigger ?? <AddAssociationPlusBtn />}</DialogTrigger>}
      <DialogContent className="max-w-2xl p-6 space-y-4">
        <DialogHeader>
          <DialogTitle>Associate Related Objects</DialogTitle>
        </DialogHeader>
        <ObjectAssociation
          key={`${objectAssociationKey}-${defaultSelectedObject ?? 'none'}`}
          onIdChange={(updatedMap) => setAssociations(updatedMap as TObjectAssociationMap<TFieldKey>)}
          initialData={initialData}
          defaultSelectedObject={defaultSelectedObject}
          allowedObjectTypes={allowedObjectTypes ?? config.allowedObjectTypes}
        />
        <DialogFooter>
          <SaveButton onClick={onSave} isSaving={isSaving} />
          <CancelButton onClick={() => handleOpenChange(false)} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

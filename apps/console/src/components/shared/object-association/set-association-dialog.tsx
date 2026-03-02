'use client'

import ObjectAssociation from '@/components/shared/object-association/object-association'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { useMemo, useState } from 'react'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { TAssociationUpdateInput, TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useQueryClient } from '@tanstack/react-query'
import AddAssociationPlusBtn from '@/components/shared/object-association/add-association-plus-btn.tsx'
import { getAssociationInput } from '@/components/shared/object-association/utils'
import type { AssociationsData } from '@/components/shared/object-association/association-section'

export type SetAssociationDialogConfig<TRootField extends string = string, TSectionKey extends string = string, TFieldKey extends string = string> = {
  dataRootField: TRootField
  invalidateQueryKey: string
  successMessage: string
  allowedObjectTypes: readonly ObjectTypeObjects[]
  initialDataKeys: Record<TFieldKey, TSectionKey>
}

type SetAssociationDialogProps<TRootField extends string, TSectionKey extends string, TFieldKey extends string> = {
  config: SetAssociationDialogConfig<TRootField, TSectionKey, TFieldKey>
  associationsData: AssociationsData<TRootField, TSectionKey> | undefined
  onUpdate: (input: TAssociationUpdateInput<TFieldKey>) => Promise<void>
}

export function SetAssociationDialog<TRootField extends string, TSectionKey extends string, TFieldKey extends string>({
  config,
  associationsData,
  onUpdate,
}: SetAssociationDialogProps<TRootField, TSectionKey, TFieldKey>) {
  const queryClient = useQueryClient()

  const [associations, setAssociations] = useState<TObjectAssociationMap<TFieldKey>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [objectAssociationKey, setObjectAssociationKey] = useState(0)

  const { errorNotification, successNotification } = useNotification()

  const initialData: TObjectAssociationMap<TFieldKey> = useMemo(() => {
    if (!associationsData) return {}
    const root = associationsData[config.dataRootField as TRootField]
    if (!root) return {}

    const result: TObjectAssociationMap<TFieldKey> = {}
    for (const [inputName, edgesField] of Object.entries(config.initialDataKeys) as [TFieldKey, TSectionKey][]) {
      const connection = root[edgesField]
      result[inputName] =
        connection?.edges?.flatMap((edge) => {
          const id = edge?.node?.id
          return id ? [id] : []
        }) ?? []
    }
    return result
  }, [associationsData, config.dataRootField, config.initialDataKeys])

  const onSave = async () => {
    setIsSaving(true)
    try {
      const associationInputs = getAssociationInput(initialData, associations)
      await onUpdate(associationInputs)

      queryClient.invalidateQueries({ queryKey: [config.invalidateQueryKey] })
      successNotification({ title: config.successMessage })
      setOpen(false)
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDialogChange = (isOpen: boolean) => {
    if (isOpen) {
      setObjectAssociationKey((prev) => prev + 1)
      setAssociations(initialData)
    }
    if (!isOpen) {
      setAssociations({})
    }
    setOpen(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <AddAssociationPlusBtn />
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-6 space-y-4">
        <DialogHeader>
          <DialogTitle>Associate Related Objects</DialogTitle>
        </DialogHeader>
        <ObjectAssociation
          key={objectAssociationKey}
          onIdChange={(updatedMap) => setAssociations(updatedMap as TObjectAssociationMap<TFieldKey>)}
          initialData={initialData}
          allowedObjectTypes={config.allowedObjectTypes}
        />
        <DialogFooter>
          <SaveButton onClick={onSave} isSaving={isSaving} />
          <CancelButton onClick={() => setOpen(false)} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

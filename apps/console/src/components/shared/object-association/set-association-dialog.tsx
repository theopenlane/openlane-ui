'use client'

import ObjectAssociation from '@/components/shared/object-association/object-association'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import React, { useMemo, useState } from 'react'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useQueryClient } from '@tanstack/react-query'
import AddAssociationPlusBtn from '@/components/shared/object-association/add-association-plus-btn.tsx'
import { getAssociationInput } from '@/components/shared/object-association/utils'
import type { AssociationsData } from '@/components/shared/object-association/association-section'

export type SetAssociationDialogConfig = {
  dataRootField: string
  invalidateQueryKey: string
  successMessage: string
  allowedObjectTypes: ObjectTypeObjects[]
  initialDataKeys: Record<string, string>
}

type SetAssociationDialogProps = {
  config: SetAssociationDialogConfig
  associationsData: AssociationsData | undefined
  onUpdate: (input: Record<string, unknown>) => Promise<void>
}

export function SetAssociationDialog({ config, associationsData, onUpdate }: SetAssociationDialogProps) {
  const queryClient = useQueryClient()

  const [associations, setAssociations] = useState<TObjectAssociationMap>({})
  const [isSaving, setIsSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [objectAssociationKey, setObjectAssociationKey] = useState(0)

  const { errorNotification, successNotification } = useNotification()

  const initialData: TObjectAssociationMap = useMemo(() => {
    if (!associationsData) return {}
    const root = associationsData[config.dataRootField]
    if (!root) return {}

    const result: TObjectAssociationMap = {}
    for (const [inputName, edgesField] of Object.entries(config.initialDataKeys)) {
      const connection = root[edgesField]
      result[inputName] = (connection?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? []
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
        <ObjectAssociation key={objectAssociationKey} onIdChange={(updatedMap) => setAssociations(updatedMap)} initialData={initialData} allowedObjectTypes={config.allowedObjectTypes} />
        <DialogFooter>
          <SaveButton onClick={onSave} isSaving={isSaving} />
          <CancelButton onClick={() => setOpen(false)} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

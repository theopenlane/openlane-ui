'use client'

import ObjectAssociation from '@/components/shared/objectAssociation/object-association'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap'
import { useUpdateControlImplementation } from '@/lib/graphql-hooks/control-implementations'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { SaveButton } from '@/components/shared/save-button/save-button'

interface Props {
  initialData: TObjectAssociationMap
  updateControlImplementationId: string
}

export function LinkControlsModal({ initialData, updateControlImplementationId }: Props) {
  const { subcontrolId } = useParams<{ id: string; subcontrolId: string }>()
  const isSubcontrol = !!subcontrolId

  const [open, setOpen] = useState(false)
  const [saveEnabled, setSaveEnabled] = useState(false)
  const [associations, setAssociations] = useState(initialData)
  const [isSaving, setIsSaving] = useState(false)

  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: update } = useUpdateControlImplementation()

  const getAssociationDiffs = (initial: TObjectAssociationMap, current: TObjectAssociationMap): { added: TObjectAssociationMap; removed: TObjectAssociationMap } => {
    const added: TObjectAssociationMap = {}
    const removed: TObjectAssociationMap = {}

    const allKeys = new Set([...Object.keys(initial), ...Object.keys(current)])

    for (const key of allKeys) {
      const initialSet = new Set(initial[key] ?? [])
      const currentSet = new Set(current[key] ?? [])

      const addedItems = [...currentSet].filter((id) => !initialSet.has(id))
      const removedItems = [...initialSet].filter((id) => !currentSet.has(id))

      if (addedItems.length > 0) added[key] = addedItems
      if (removedItems.length > 0) removed[key] = removedItems
    }

    return { added, removed }
  }

  const buildMutationKey = (prefix: string, key: string) => `${prefix}${key.charAt(0).toUpperCase()}${key.slice(1)}`

  const onSave = async () => {
    setIsSaving(true)
    try {
      const { added, removed } = getAssociationDiffs(initialData, associations)

      const associationInputs = {
        ...Object.entries(added).reduce(
          (acc, [key, ids]) => {
            if (ids && ids.length > 0) acc[buildMutationKey('add', key)] = ids
            return acc
          },
          {} as Record<string, string[]>,
        ),

        ...Object.entries(removed).reduce(
          (acc, [key, ids]) => {
            if (ids && ids.length > 0) acc[buildMutationKey('remove', key)] = ids
            return acc
          },
          {} as Record<string, string[]>,
        ),
      }

      await update({
        updateControlImplementationId,
        input: associationInputs,
      })

      successNotification({ title: 'Associations updated successfully.' })
      setOpen(false)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
      setAssociations(initialData)
      setSaveEnabled(false)
    }
    setOpen(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button className="h-8 px-2!">Set Association</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-6 space-y-4">
        <DialogHeader>
          <DialogTitle>Associate Related Objects</DialogTitle>
        </DialogHeader>

        <ObjectAssociation
          defaultSelectedObject={isSubcontrol ? ObjectTypeObjects.SUB_CONTROL : ObjectTypeObjects.CONTROL}
          onIdChange={(updatedMap) => {
            setAssociations(updatedMap)
            setSaveEnabled(true)
          }}
          initialData={initialData}
          excludeObjectTypes={[
            ObjectTypeObjects.EVIDENCE,
            ObjectTypeObjects.GROUP,
            ObjectTypeObjects.CONTROL_OBJECTIVE,
            ObjectTypeObjects.PROGRAM,
            ObjectTypeObjects.INTERNAL_POLICY,
            ObjectTypeObjects.PROCEDURE,
            ObjectTypeObjects.RISK,
            ObjectTypeObjects.TASK,
          ]}
        />
        <DialogFooter>
          <SaveButton disabled={!saveEnabled || isSaving} onClick={onSave} isSaving={isSaving} />
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import ObjectAssociation from '@/components/shared/objectAssociation/object-association'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { useMemo, useState } from 'react'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap'
import { useNotification } from '@/hooks/useNotification'
import { useUpdateControlObjective } from '@/lib/graphql-hooks/control-objectives'
import { ControlObjectiveFieldsFragment, ControlObjectiveObjectiveStatus } from '@repo/codegen/src/schema'
import { useParams } from 'next/navigation'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { SaveButton } from '@/components/shared/save-button/save-button'

export function LinkControlsModal({ controlObjectiveData }: { controlObjectiveData: ControlObjectiveFieldsFragment }) {
  const params = useParams()
  const isSubcontrol: string | undefined = params.subcontrolId as string

  const { mutateAsync: updateControlObjective } = useUpdateControlObjective()

  const [associations, setAssociations] = useState<TObjectAssociationMap>({})
  const [isSaving, setIsSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [saveEnabled, setSaveEnabled] = useState(false)

  const { errorNotification, successNotification } = useNotification()

  const initialData: TObjectAssociationMap = useMemo(
    () => ({
      controlIDs: controlObjectiveData.controls?.edges?.flatMap((edge) => edge?.node?.id || []),
      subcontrolIDs: controlObjectiveData.subcontrols?.edges?.flatMap((edge) => edge?.node?.id || []),
    }),
    [controlObjectiveData],
  )
  function getAssociationDiffs(initial: TObjectAssociationMap, current: TObjectAssociationMap): { added: TObjectAssociationMap; removed: TObjectAssociationMap } {
    const added: TObjectAssociationMap = {}
    const removed: TObjectAssociationMap = {}

    const allKeys = new Set([...Object.keys(initial), ...Object.keys(current)])

    for (const key of allKeys) {
      const initialSet = new Set(initial[key] ?? [])
      const currentSet = new Set(current[key] ?? [])

      const addedItems = [...currentSet].filter((id) => !initialSet.has(id))
      const removedItems = [...initialSet].filter((id) => !currentSet.has(id))

      if (addedItems.length > 0) {
        added[key] = addedItems
      }
      if (removedItems.length > 0) {
        removed[key] = removedItems
      }
    }

    return { added, removed }
  }

  const onSave = async () => {
    setIsSaving(true)
    try {
      const { added, removed } = getAssociationDiffs(initialData, associations)

      const buildMutationKey = (prefix: string, key: string) => `${prefix}${key.charAt(0).toUpperCase()}${key.slice(1)}`

      const associationInputs = {
        ...Object.entries(added).reduce(
          (acc, [key, ids]) => {
            if (ids && ids.length > 0) {
              acc[buildMutationKey('add', key)] = ids
            }
            return acc
          },
          {} as Record<string, string[]>,
        ),

        ...Object.entries(removed).reduce(
          (acc, [key, ids]) => {
            if (ids && ids.length > 0) {
              acc[buildMutationKey('remove', key)] = ids
            }
            return acc
          },
          {} as Record<string, string[]>,
        ),
      }

      await updateControlObjective({
        updateControlObjectiveId: controlObjectiveData.id!,
        input: associationInputs,
      })

      successNotification({ title: 'Control Objective updated' })
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
      setAssociations({})
    }
    setOpen(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button disabled={controlObjectiveData.status === ControlObjectiveObjectiveStatus.ARCHIVED} className="h-8">
          Link Controls
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-6 space-y-4">
        <DialogHeader>
          <DialogTitle>Associate Related Objects</DialogTitle>
        </DialogHeader>

        <ObjectAssociation
          defaultSelectedObject={isSubcontrol ? ObjectTypeObjects.SUB_CONTROL : ObjectTypeObjects.CONTROL}
          onIdChange={(updatedMap) => {
            setSaveEnabled(saveEnabled)
            setAssociations(updatedMap)
          }}
          initialData={initialData}
          excludeObjectTypes={[
            ObjectTypeObjects.PROGRAM,
            ObjectTypeObjects.TASK,
            ObjectTypeObjects.INTERNAL_POLICY,
            ObjectTypeObjects.PROCEDURE,
            ObjectTypeObjects.RISK,
            ObjectTypeObjects.EVIDENCE,
            ObjectTypeObjects.CONTROL_OBJECTIVE,
            ObjectTypeObjects.GROUP,
          ]}
        />
        <DialogFooter>
          <SaveButton onClick={onSave} disabled={isSaving || saveEnabled} isSaving={isSaving} />
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

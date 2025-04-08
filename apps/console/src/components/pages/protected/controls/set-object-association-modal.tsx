'use client'

import { useGetControlById, useUpdateControl } from '@/lib/graphql-hooks/controls'
import ObjectAssociation from '@/components/shared/objectAssociation/object-association'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap'
import { useNotification } from '@/hooks/useNotification'

export function SetObjectAssociationDialog() {
  const { id } = useParams<{ id: string }>()
  const { mutateAsync: updateControl } = useUpdateControl()
  const { data: controlData } = useGetControlById(id)
  const [associations, setAssociations] = useState<TObjectAssociationMap>({})
  const [isSaving, setIsSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [saveEnabled, setSaveEnabled] = useState(false)

  const { errorNotification, successNotification } = useNotification()

  const initialData: TObjectAssociationMap = useMemo(() => {
    return {
      programIDs: (controlData?.control?.programs?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      taskIDs: (controlData?.control?.tasks?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      riskIDs: (controlData?.control?.risks?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      procedureIDs: (controlData?.control?.procedures?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      internalPolicyIDs: (controlData?.control?.internalPolicies?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
    }
  }, [controlData])

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

      await updateControl({
        updateControlId: id!,
        input: associationInputs,
      })

      successNotification({ title: 'Control updated' })
      setOpen(false)
    } catch (error) {
      errorNotification({ title: 'Could not update Control, please try again later' })
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
        <Button className="h-8 !px-2">Set Association</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-6 space-y-4">
        <DialogHeader>
          <DialogTitle>Associate Related Objects</DialogTitle>
        </DialogHeader>

        <ObjectAssociation
          onIdChange={(updatedMap) => {
            setSaveEnabled(saveEnabled)
            setAssociations(updatedMap)
          }}
          initialData={initialData}
          excludeObjectTypes={[ObjectTypeObjects.EVIDENCE, ObjectTypeObjects.SUB_CONTROL, ObjectTypeObjects.CONTROL, ObjectTypeObjects.CONTROL_OBJECTIVE, ObjectTypeObjects.GROUP]}
        />
        <DialogFooter>
          <Button onClick={onSave} disabled={isSaving || saveEnabled}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

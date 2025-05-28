'use client'

import { useGetControlById, useUpdateControl } from '@/lib/graphql-hooks/controls'
import ObjectAssociation from '@/components/shared/objectAssociation/object-association'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import React, { useState } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap'

interface Props {
  associations: TObjectAssociationMap
  setAssociations: (arg: TObjectAssociationMap) => void
  initialData: TObjectAssociationMap
}

export function SetObjectAssociationDialog({ associations, setAssociations, initialData }: Props) {
  const { subcontrolId } = useParams<{ id: string; subcontrolId: string }>()
  const isSubcontrol = !!subcontrolId
  const [open, setOpen] = useState(false)
  const [saveEnabled, setSaveEnabled] = useState(false)
  console.log('associations', associations)
  //   const { data: controlData } = useGetControlById(isControl ? id : null)
  //   const { data: subcontrolData } = useGetSubcontrolById(isSubcontrol ? id : null)
  //   const { mutateAsync: updateControl } = useUpdateControl()
  //   const { mutateAsync: updateSubcontrol } = useUpdateSubcontrol()

  //   const [isSaving, setIsSaving] = useState(false)

  //   const { errorNotification, successNotification } = useNotification()

  //   const initialData: TObjectAssociationMap = useMemo(() => {
  //     if (isControl && controlData?.control) {
  //       return {
  //         programIDs: [],
  //         taskIDs: (controlData.control.tasks?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
  //         riskIDs: (controlData.control.risks?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
  //         procedureIDs: (controlData.control.procedures?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
  //         internalPolicyIDs: (controlData.control.internalPolicies?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
  //       }
  //     }

  //     if (!isControl && subcontrolData?.subcontrol) {
  //       return {
  //         taskIDs: (subcontrolData.subcontrol.tasks?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
  //         riskIDs: (subcontrolData.subcontrol.risks?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
  //         procedureIDs: (subcontrolData.subcontrol.procedures?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
  //         internalPolicyIDs: (subcontrolData.subcontrol.internalPolicies?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
  //       }
  //     }

  //     return {}
  //   }, [isControl, controlData, subcontrolData])

  //   function getAssociationDiffs(initial: TObjectAssociationMap, current: TObjectAssociationMap): { added: TObjectAssociationMap; removed: TObjectAssociationMap } {
  //     const added: TObjectAssociationMap = {}
  //     const removed: TObjectAssociationMap = {}

  //     const allKeys = new Set([...Object.keys(initial), ...Object.keys(current)])

  //     for (const key of allKeys) {
  //       const initialSet = new Set(initial[key] ?? [])
  //       const currentSet = new Set(current[key] ?? [])

  //       const addedItems = [...currentSet].filter((id) => !initialSet.has(id))
  //       const removedItems = [...initialSet].filter((id) => !currentSet.has(id))

  //       if (addedItems.length > 0) {
  //         added[key] = addedItems
  //       }
  //       if (removedItems.length > 0) {
  //         removed[key] = removedItems
  //       }
  //     }

  //     return { added, removed }
  //   }

  const onSave = async () => {}

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
          defaultSelectedObject={isSubcontrol ? ObjectTypeObjects.SUB_CONTROL : ObjectTypeObjects.CONTROL}
          onIdChange={(updatedMap) => {
            setSaveEnabled(saveEnabled)
            setAssociations(updatedMap)
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
          <Button onClick={onSave} disabled={saveEnabled}>
            Save
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

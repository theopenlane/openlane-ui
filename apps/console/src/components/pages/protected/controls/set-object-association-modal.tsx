'use client'

import { useGetControlById, useUpdateControl } from '@/lib/graphql-hooks/controls'
import ObjectAssociation from '@/components/shared/objectAssociation/object-association'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config'

export function SetObjectAssociationDialog() {
  const { id } = useParams<{ id: string }>()
  const { mutateAsync: updateControl } = useUpdateControl()
  const { data: controlData } = useGetControlById(id)

  const initialData = {
    programIDs: controlData?.control?.programs?.edges?.map((e) => e?.node?.id) ?? [],
    taskIDs: controlData?.control?.tasks?.edges?.map((e) => e?.node?.id) ?? [],
    riskIDs: controlData?.control?.risks?.edges?.map((e) => e?.node?.id) ?? [],
    procedureIDs: controlData?.control?.procedures?.edges?.map((e) => e?.node?.id) ?? [],
    internalPolicyIDs: controlData?.control?.internalPolicies?.edges?.map((e) => e?.node?.id) ?? [],
  }

  const [associations, setAssociations] = useState<{ inputName: string; objectIds: string[] }[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [open, setOpen] = useState(false)

  const onSave = async () => {
    setIsSaving(true)
    try {
      const associationInputs = associations.reduce(
        (acc, curr) => {
          const key = `add${curr.inputName.charAt(0).toUpperCase()}${curr.inputName.slice(1)}`
          acc[key] = curr.objectIds
          return acc
        },
        {} as Record<string, string[]>,
      )

      await updateControl({
        updateControlId: id!,
        input: {
          ...associationInputs,
        },
      })

      console.log('Associations updated successfully.')
      setOpen(false)
    } catch (error) {
      console.error('Failed to update associations:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
      setAssociations([])
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
          onIdChange={(objectsWithIds) => {
            console.log('Selected associations:', objectsWithIds)
            setAssociations(objectsWithIds)
          }}
          initialData={initialData}
          excludeObjectTypes={[ObjectTypeObjects.EVIDENCE, ObjectTypeObjects.SUB_CONTROL, ObjectTypeObjects.CONTROL, ObjectTypeObjects.CONTROL_OBJECTIVE, ObjectTypeObjects.GROUP]}
        />
        <DialogFooter>
          <Button onClick={onSave} disabled={isSaving}>
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

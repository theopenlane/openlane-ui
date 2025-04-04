'use client'

import { useUpdateControl } from '@/lib/graphql-hooks/controls'
import ObjectAssociation from '@/components/shared/objectAssociation/object-association'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { useState } from 'react'
import { useParams } from 'next/navigation'

export function SetObjectAssociationDialog() {
  const { id } = useParams<{ id: string }>()
  const { mutateAsync: updateControl } = useUpdateControl()

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
      setOpen(false) // close modal after save
    } catch (error) {
      console.error('Failed to update associations:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset state when dialog closes
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

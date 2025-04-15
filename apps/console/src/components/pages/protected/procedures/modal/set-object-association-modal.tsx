'use client'

import ObjectAssociation from '@/components/shared/objectAssociation/object-association'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { useState } from 'react'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap'
import { useProcedure } from '@/components/pages/protected/procedures/create/hooks/use-procedure.tsx'

type TSetObjectAssociationDialog = {
  isEditable: boolean
}

const SetObjectAssociationDialog: React.FC<TSetObjectAssociationDialog> = ({ isEditable }) => {
  const procedureState = useProcedure()
  const associationsState = useProcedure((state) => state.associations)
  const refCodeAssociationsState = useProcedure((state) => state.associationRefCodes)
  const [associations, setAssociations] = useState<{
    associations: TObjectAssociationMap
    refCodes: TObjectAssociationMap
  }>({
    associations: {},
    refCodes: {},
  })
  const [open, setOpen] = useState(false)

  const handleSave = () => {
    procedureState.setAssociations(associations.associations)
    procedureState.setAssociationRefCodes(associations.refCodes)
    setOpen(false)
  }

  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
      setAssociations({
        associations: {},
        refCodes: {},
      })
    }
    setOpen(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button className="h-8 !px-2" disabled={!isEditable}>
          Set object association
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-6 space-y-4">
        <DialogHeader>
          <DialogTitle>Set object association</DialogTitle>
        </DialogHeader>

        <ObjectAssociation
          onIdChange={(updatedMap, refCodes) => {
            setAssociations({ associations: updatedMap, refCodes: refCodes })
          }}
          initialData={associationsState}
          refCodeInitialData={refCodeAssociationsState}
          excludeObjectTypes={[ObjectTypeObjects.EVIDENCE, ObjectTypeObjects.SUB_CONTROL, ObjectTypeObjects.GROUP, ObjectTypeObjects.CONTROL_OBJECTIVE, ObjectTypeObjects.PROCEDURE]}
        />
        <DialogFooter>
          <Button onClick={handleSave}>Save</Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SetObjectAssociationDialog

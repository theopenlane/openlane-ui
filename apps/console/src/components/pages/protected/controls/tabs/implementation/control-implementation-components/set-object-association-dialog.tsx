'use client'

import ObjectAssociation from '@/components/shared/object-association/object-association'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

interface Props {
  setAssociations: (arg: TObjectAssociationMap) => void
  initialData: TObjectAssociationMap
}

export function SetObjectAssociationDialog({ setAssociations, initialData }: Props) {
  const { subcontrolId } = useParams<{ id: string; subcontrolId: string }>()
  const isSubcontrol = !!subcontrolId
  const [open, setOpen] = useState(false)
  const [saveEnabled, setSaveEnabled] = useState(false)
  const [associationsLocal, setAssociationsLocal] = useState<TObjectAssociationMap>({})

  const onSave = async () => {
    setAssociations(associationsLocal)
    setOpen(false)
  }

  const handleClose = () => {
    setOpen(false)
    setAssociationsLocal(initialData)
    setAssociations(initialData)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" className="h-8">
          Set Association
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-6 space-y-4">
        <DialogHeader>
          <DialogTitle>Associate Related Objects</DialogTitle>
        </DialogHeader>

        <ObjectAssociation
          defaultSelectedObject={isSubcontrol ? ObjectTypeObjects.SUB_CONTROL : ObjectTypeObjects.CONTROL}
          onIdChange={(updatedMap) => {
            setSaveEnabled(true)
            setAssociationsLocal(updatedMap)
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
          <SaveButton onClick={onSave} disabled={!saveEnabled} />
          <CancelButton onClick={handleClose}></CancelButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

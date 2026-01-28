'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { PlusCircle } from 'lucide-react'
import React, { useState } from 'react'
import { Button } from '@repo/ui/button'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config'
import CreateForm from '../form/create-form'

interface Props {
  defaultSelectedObject?: ObjectTypeObjects
  initialData?: TObjectAssociationMap
  objectAssociationsDisplayIDs?: string[]
  trigger?: React.ReactElement
  className?: string
}

const CreateDialog = ({ defaultSelectedObject, initialData, objectAssociationsDisplayIDs, trigger, className }: Props) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const handleSuccess = () => {
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger ? (
        <DialogTrigger className={className ?? ''} asChild>
          {trigger}
        </DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button className={className ?? 'h-8 px-2!'} icon={<PlusCircle />} iconPosition="left" onClick={() => setIsOpen(true)}>
            Create
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new asset</DialogTitle>
        </DialogHeader>
        <CreateForm
          defaultSelectedObject={defaultSelectedObject}
          excludeObjectTypes={[ObjectTypeObjects.GROUP, ObjectTypeObjects.EVIDENCE]}
          initialData={initialData}
          objectAssociationsDisplayIDs={objectAssociationsDisplayIDs}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}

export { CreateDialog }

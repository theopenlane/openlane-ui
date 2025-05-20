'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { PlusCircle } from 'lucide-react'
import CreateTaskForm from '@/components/pages/protected/tasks/create-task/form/create-task-form'
import React, { useState } from 'react'
import { Button } from '@repo/ui/button'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config'

interface Props {
  defaultSelectedObject?: ObjectTypeObjects
  excludeObjectTypes?: ObjectTypeObjects[]
  initialData?: TObjectAssociationMap
  objectAssociationsDisplayIDs?: string[]
}

const CreateTaskDialog = ({ defaultSelectedObject, excludeObjectTypes, initialData, objectAssociationsDisplayIDs }: Props) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const handleSuccess = () => {
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="h-8 !px-2" icon={<PlusCircle />} iconPosition="left" onClick={() => setIsOpen(true)}>
          Create Task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new Task</DialogTitle>
        </DialogHeader>
        <CreateTaskForm
          defaultSelectedObject={defaultSelectedObject}
          excludeObjectTypes={excludeObjectTypes}
          initialData={initialData}
          objectAssociationsDisplayIDs={objectAssociationsDisplayIDs}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}

export { CreateTaskDialog }

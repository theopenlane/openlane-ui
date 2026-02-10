'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { PlusCircle } from 'lucide-react'
import CreateTaskForm from '@/components/pages/protected/tasks/create-task/form/create-task-form'
import type { CreateTaskFormData } from '@/components/pages/protected/tasks/hooks/use-form-schema'
import React, { useState } from 'react'
import { Button } from '@repo/ui/button'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config'

interface Props {
  defaultSelectedObject?: ObjectTypeObjects
  initialData?: TObjectAssociationMap
  objectAssociationsDisplayIDs?: string[]
  initialValues?: Partial<CreateTaskFormData>
  hideObjectAssociation?: boolean
  trigger?: React.ReactElement
  className?: string
}

const CreateTaskDialog = ({ defaultSelectedObject, initialData, objectAssociationsDisplayIDs, initialValues, hideObjectAssociation, trigger, className }: Props) => {
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
      <DialogContent className={hideObjectAssociation ? 'max-w-4xl' : ''}>
        <DialogHeader>
          <DialogTitle>Create a new Task</DialogTitle>
        </DialogHeader>
        <CreateTaskForm
          defaultSelectedObject={defaultSelectedObject}
          excludeObjectTypes={[ObjectTypeObjects.GROUP, ObjectTypeObjects.EVIDENCE]}
          initialData={initialData}
          objectAssociationsDisplayIDs={objectAssociationsDisplayIDs}
          initialValues={initialValues}
          hideObjectAssociation={hideObjectAssociation}
          isOpen={isOpen}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}

export { CreateTaskDialog }

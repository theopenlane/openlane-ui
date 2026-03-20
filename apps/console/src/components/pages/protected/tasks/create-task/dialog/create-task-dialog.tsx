'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { PlusCircle } from 'lucide-react'
import CreateTaskForm from '@/components/pages/protected/tasks/create-task/form/create-task-form'
import type { CreateTaskFormData } from '@/components/pages/protected/tasks/hooks/use-form-schema'
import React, { useState } from 'react'
import { Button } from '@repo/ui/button'
import { type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'

interface Props {
  defaultSelectedObject?: ObjectTypeObjects
  initialData?: TObjectAssociationMap
  objectAssociationsDisplayIDs?: string[]
  initialValues?: Partial<CreateTaskFormData>
  hideObjectAssociation?: boolean
  trigger?: React.ReactElement
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccessWithId?: (id: string) => void
}

const CreateTaskDialog = ({
  defaultSelectedObject,
  initialData,
  objectAssociationsDisplayIDs,
  initialValues,
  hideObjectAssociation,
  trigger,
  className,
  open: controlledOpen,
  onOpenChange,
  onSuccessWithId,
}: Props) => {
  const [internalOpen, setInternalOpen] = useState<boolean>(false)

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setIsOpen = (val: boolean) => {
    setInternalOpen(val)
    onOpenChange?.(val)
  }

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
          allowedObjectTypes={[
            ObjectTypeObjects.CONTROL,
            ObjectTypeObjects.SUB_CONTROL,
            ObjectTypeObjects.CONTROL_OBJECTIVE,
            ObjectTypeObjects.PROGRAM,
            ObjectTypeObjects.TASK,
            ObjectTypeObjects.INTERNAL_POLICY,
            ObjectTypeObjects.PROCEDURE,
            ObjectTypeObjects.RISK,
            ObjectTypeObjects.SCAN,
            ObjectTypeObjects.CAMPAIGN,
            ObjectTypeObjects.ASSET,
            ObjectTypeObjects.ENTITY,
            ObjectTypeObjects.IDENTITY_HOLDER,
            ObjectTypeObjects.FINDING,
            ObjectTypeObjects.VULNERABILITY,
          ]}
          initialData={initialData}
          objectAssociationsDisplayIDs={objectAssociationsDisplayIDs}
          initialValues={initialValues}
          hideObjectAssociation={hideObjectAssociation}
          isOpen={isOpen}
          onSuccess={handleSuccess}
          onSuccessWithId={onSuccessWithId}
        />
      </DialogContent>
    </Dialog>
  )
}

export { CreateTaskDialog }

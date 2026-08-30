'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { PlusCircle } from 'lucide-react'
import CreateTaskForm, { type TCreateTaskFormHandle } from '@/components/pages/protected/tasks/create-task/form/create-task-form'
import type { CreateTaskFormData } from '@/components/pages/protected/tasks/hooks/use-form-schema'
import React, { useRef, useState } from 'react'
import { Button } from '@repo/ui/button'
import { type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { type TAssociationItem } from '@/components/shared/object-association/association-items'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'

interface Props {
  defaultSelectedObject?: ObjectTypeObjects
  initialData?: TObjectAssociationMap
  objectAssociationItems?: TAssociationItem[]
  initialValues?: Partial<CreateTaskFormData>
  hideObjectAssociation?: boolean
  fromTemplate?: boolean
  trigger?: React.ReactElement
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccessWithId?: (id: string) => void
}

const CreateTaskDialog = ({
  defaultSelectedObject,
  initialData,
  objectAssociationItems,
  initialValues,
  hideObjectAssociation,
  fromTemplate,
  trigger,
  className,
  open: controlledOpen,
  onOpenChange,
  onSuccessWithId,
}: Props) => {
  const [internalOpen, setInternalOpen] = useState<boolean>(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const formRef = useRef<TCreateTaskFormHandle>(null)

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setIsOpen = (val: boolean) => {
    setInternalOpen(val)
    onOpenChange?.(val)
  }

  const handleOpenChange = (val: boolean) => {
    if (!val && formRef.current?.hasUnsavedChanges()) {
      setShowCancelDialog(true)
      return
    }
    setIsOpen(val)
  }

  const handleDiscard = () => {
    formRef.current?.discardDraft()
    setShowCancelDialog(false)
    setIsOpen(false)
  }

  const handleSuccess = () => {
    setIsOpen(false)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        {controlledOpen === undefined &&
          (trigger ? (
            <DialogTrigger className={className ?? ''} asChild>
              {trigger}
            </DialogTrigger>
          ) : (
            <DialogTrigger asChild>
              <Button className={className ?? 'h-8 px-2!'} icon={<PlusCircle />} iconPosition="left" onClick={() => setIsOpen(true)}>
                Create
              </Button>
            </DialogTrigger>
          ))}
        <DialogContent
          className={hideObjectAssociation ? 'max-w-4xl' : ''}
          onInteractOutside={(e) => {
            if (formRef.current?.hasUnsavedChanges()) {
              e.preventDefault()
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{fromTemplate ? 'Create a task from template' : 'Create a new Task'}</DialogTitle>
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
            objectAssociationItems={objectAssociationItems}
            initialValues={initialValues}
            hideObjectAssociation={hideObjectAssociation}
            fromTemplate={fromTemplate}
            isOpen={isOpen}
            ref={formRef}
            onSuccess={handleSuccess}
            onSuccessWithId={onSuccessWithId}
          />
        </DialogContent>
      </Dialog>
      <CancelDialog isOpen={showCancelDialog} onConfirm={handleDiscard} onCancel={() => setShowCancelDialog(false)} />
    </>
  )
}

export { CreateTaskDialog }

'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sheet, SheetContent } from '@repo/ui/sheet'
import { TaskTaskStatus, UpdateTaskInput } from '@repo/codegen/src/schema'
import { useNotification } from '@/hooks/useNotification'
import useFormSchema, { EditTaskFormData } from '@/components/pages/protected/tasks/hooks/use-form-schema'
import { Loading } from '@/components/shared/loading/loading'
import { Form } from '@repo/ui/form'
import { TaskTypes } from '@/components/pages/protected/tasks/util/task'
import { useTask, useUpdateTask } from '@/lib/graphql-hooks/tasks'
import { useQueryClient } from '@tanstack/react-query'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import EvidenceCreateFormDialog from '../../../evidence/evidence-create-form-dialog'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog.tsx'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config.ts'
import ObjectAssociation from '@/components/shared/objectAssociation/object-association'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap'
import { useAccountRole } from '@/lib/authz/access-api'
import { ObjectEnum } from '@/lib/authz/enums/object-enum'
import { useSession } from 'next-auth/react'
import { canEdit } from '@/lib/authz/utils'
import TitleField from '../form/fields/title-field'
import DetailsField from '../form/fields/details-field'
import Properties from '../form/fields/properties'
import Conversation from '../form/fields/conversation'
import TasksSheetHeader from '../form/fields/header'
import { buildTaskPayload, generateEvidenceFormData } from '../utils'
import MarkAsComplete from '../form/fields/mark-as-complete'

const TaskDetailsSheet = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [internalEditing, setInternalEditing] = useState<keyof EditTaskFormData | null>(null)
  const queryClient = useQueryClient()
  const plateEditorHelper = usePlateEditor()
  const router = useRouter()
  const { successNotification, errorNotification } = useNotification()
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState<boolean>(false)
  const [associations, setAssociations] = useState<TObjectAssociationMap>({})
  const { mutateAsync: updateTask, isPending } = useUpdateTask()
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const { data: permission } = useAccountRole(session, ObjectEnum.TASK, id)
  const isEditAllowed = canEdit(permission?.roles)
  const { data, isLoading: fetching } = useTask(id as string)
  const taskData = data?.task
  const { form } = useFormSchema()
  const evidenceFormData = useMemo(() => generateEvidenceFormData(taskData), [taskData])

  const initialAssociations = useMemo(
    () => ({
      programIDs: (taskData?.programs?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      procedureIDs: (taskData?.procedures?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      internalPolicyIDs: (taskData?.internalPolicies?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      controlObjectiveIDs: (taskData?.controlObjectives?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      groupIDs: (taskData?.groups?.edges?.map((item) => item?.node?.id).filter(Boolean) as string[]) ?? [],
      subcontrolIDs: (taskData?.subcontrols?.edges?.map((item) => item?.node?.id).filter(Boolean) as string[]) ?? [],
      controlIDs: (taskData?.controls?.edges?.map((item) => item?.node?.id).filter(Boolean) as string[]) ?? [],
      riskIDs: (taskData?.risks?.edges?.map((item) => item?.node?.id).filter(Boolean) as string[]) ?? [],
    }),
    [taskData],
  )

  useEffect(() => {
    if (taskData) {
      form.reset({
        title: taskData.title ?? '',
        details: taskData.details ?? '',
        due: taskData.due ? new Date(taskData.due as string) : undefined,
        assigneeID: taskData.assignee?.id,
        category: taskData?.category ? Object.values(TaskTypes).find((type) => type === taskData?.category) : undefined,
        status: taskData?.status ? Object.values(TaskTaskStatus).find((type) => type === taskData?.status) : undefined,
        tags: taskData?.tags ?? [],
      })
    }
  }, [taskData, form])

  const handleSheetClose = () => {
    if (isEditing) {
      setIsDiscardDialogOpen(true)
      return
    }
    handleCloseParams()
  }

  const handleCloseParams = () => {
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.delete('id')
    router.replace(`${window.location.pathname}?${newSearchParams.toString()}`)
    setIsEditing(false)
  }

  const onSubmit = async (data: EditTaskFormData) => {
    if (!id) {
      return
    }

    const formData: UpdateTaskInput = await buildTaskPayload(data, plateEditorHelper, initialAssociations, associations)

    try {
      await updateTask({
        updateTaskId: id as string,
        input: formData,
      })

      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      successNotification({
        title: 'Task Updated',
        description: 'The task has been successfully updated.',
      })

      setIsEditing(false)
    } catch {
      errorNotification({
        title: 'Error',
        description: 'There was an unexpected error. Please try again later.',
      })
    }
  }

  const handleUpdateField = async (input: UpdateTaskInput) => {
    if (!id) {
      return
    }
    try {
      await updateTask({ updateTaskId: id, input })
      successNotification({
        title: 'Task updated',
        description: 'The task has been successfully updated.',
      })
    } catch {
      errorNotification({
        description: 'There was an unexpected error. Please try again later.',
      })
    }
  }

  return (
    <Sheet open={!!id} onOpenChange={handleSheetClose}>
      <SheetContent
        onEscapeKeyDown={(e) => {
          if (internalEditing) {
            e.preventDefault()
          } else {
            handleSheetClose()
          }
        }}
        side="right"
        className="bg-card flex flex-col"
        minWidth={470}
        header={<TasksSheetHeader close={handleSheetClose} isEditing={isEditing} isPending={isPending} setIsEditing={setIsEditing} displayID={taskData?.displayID} isEditAllowed={isEditAllowed} />}
      >
        {fetching ? (
          <Loading />
        ) : (
          <>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} id="editTask">
                <TitleField
                  isEditing={isEditing}
                  isEditAllowed={isEditAllowed}
                  handleUpdate={handleUpdateField}
                  initialValue={taskData?.title}
                  internalEditing={internalEditing}
                  setInternalEditing={setInternalEditing}
                />
                <DetailsField isEditing={isEditing} initialValue={taskData?.details} />
                {isEditAllowed && !isEditing && (
                  <div className="flex gap-4 pb-4 pt-2">
                    {taskData && (
                      <EvidenceCreateFormDialog
                        formData={evidenceFormData}
                        excludeObjectTypes={[ObjectTypeObjects.EVIDENCE, ObjectTypeObjects.RISK, ObjectTypeObjects.PROCEDURE, ObjectTypeObjects.GROUP, ObjectTypeObjects.INTERNAL_POLICY]}
                      />
                    )}
                    <MarkAsComplete taskData={taskData} />
                  </div>
                )}
                <Properties
                  isEditing={isEditing}
                  taskData={taskData}
                  internalEditing={internalEditing}
                  setInternalEditing={setInternalEditing}
                  handleUpdate={handleUpdateField}
                  isEditAllowed={isEditAllowed}
                />
                {isEditing && (
                  <Panel className="mt-20">
                    <PanelHeader heading="Object association" noBorder />
                    <p>Associating objects will allow users with access to the object to see the created task.</p>
                    <ObjectAssociation
                      initialData={initialAssociations}
                      onIdChange={(updatedMap) => setAssociations(updatedMap)}
                      excludeObjectTypes={[ObjectTypeObjects.EVIDENCE, ObjectTypeObjects.TASK]}
                    />
                  </Panel>
                )}
              </form>
            </Form>
          </>
        )}

        <Conversation isEditing={isEditing} taskData={taskData} />
        <CancelDialog
          isOpen={isDiscardDialogOpen}
          onConfirm={() => {
            setIsDiscardDialogOpen(false)
            handleCloseParams()
          }}
          onCancel={() => setIsDiscardDialogOpen(false)}
        />
      </SheetContent>
    </Sheet>
  )
}

export default TaskDetailsSheet

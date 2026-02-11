'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sheet, SheetContent } from '@repo/ui/sheet'
import { TaskTaskStatus, UpdateTaskInput } from '@repo/codegen/src/schema'
import { useNotification } from '@/hooks/useNotification'
import useFormSchema, { EditTaskFormData } from '@/components/pages/protected/tasks/hooks/use-form-schema'
import { Form } from '@repo/ui/form'
import { useTask, useTaskAssociations, useUpdateTask } from '@/lib/graphql-hooks/tasks'
import { useQueryClient } from '@tanstack/react-query'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog.tsx'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config.ts'
import ObjectAssociation from '@/components/shared/object-association/object-association'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { canEdit } from '@/lib/authz/utils'
import TitleField from '../form/fields/title-field'
import DetailsField from '../form/fields/details-field'
import Properties from '../form/fields/properties'
import Conversation from '../form/fields/conversation'
import TasksSheetHeader from '../form/fields/header'
import { buildTaskPayload, generateEvidenceFormData } from '../utils'
import MarkAsComplete from '../form/fields/mark-as-complete'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { TasksDetailsSheetSkeleton } from '../../skeleton/tasks-details-sheet-skeleton'
import EvidenceCreateSheet from '../../../evidence/evidence-create-sheet'
import { CreateButton } from '@/components/shared/create-button/create-button'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { CustomEvidenceControl } from '../../../evidence/evidence-sheet-config'
import { ObjectTypes } from '@repo/codegen/src/type-names'

type TaskDetailsSheetProps = {
  queryParamKey?: string
}

const TaskDetailsSheet: React.FC<TaskDetailsSheetProps> = ({ queryParamKey = 'id' }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [internalEditing, setInternalEditing] = useState<keyof EditTaskFormData | null>(null)
  const queryClient = useQueryClient()
  const plateEditorHelper = usePlateEditor()
  const router = useRouter()
  const { successNotification, errorNotification } = useNotification()
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState<boolean>(false)
  const [associations, setAssociations] = useState<TObjectAssociationMap>({})
  const { mutateAsync: updateTask, isPending } = useUpdateTask()

  const searchParams = useSearchParams()
  const id = searchParams.get(queryParamKey)
  const { data: permission } = useAccountRoles(ObjectTypes.TASK, id)
  const isEditAllowed = canEdit(permission?.roles)
  const { data, isLoading: fetching } = useTask(id as string)
  const taskData = data?.task
  const { form } = useFormSchema()
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const { data: associationsData } = useTaskAssociations()
  const evidenceFormData = useMemo(() => generateEvidenceFormData(taskData, associationsData), [taskData, associationsData])

  const initialAssociations = useMemo(
    () => ({
      programIDs: (associationsData?.task?.programs?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      procedureIDs: (associationsData?.task?.procedures?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      internalPolicyIDs: (associationsData?.task?.internalPolicies?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      controlObjectiveIDs: (associationsData?.task?.controlObjectives?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      groupIDs: (associationsData?.task?.groups?.edges?.map((item) => item?.node?.id).filter(Boolean) as string[]) ?? [],
      subcontrolIDs: (associationsData?.task?.subcontrols?.edges?.map((item) => item?.node?.id).filter(Boolean) as string[]) ?? [],
      controlIDs: (associationsData?.task?.controls?.edges?.map((item) => item?.node?.id).filter(Boolean) as string[]) ?? [],
      riskIDs: (associationsData?.task?.risks?.edges?.map((item) => item?.node?.id).filter(Boolean) as string[]) ?? [],
      taskIDs: (taskData?.tasks?.map((item) => item?.id).filter(Boolean) as string[]) ?? [],
    }),
    [associationsData?.task, taskData],
  )

  useEffect(() => {
    if (taskData) {
      form.reset({
        title: taskData.title ?? '',
        details: taskData.details ?? '',
        due: taskData.due ? new Date(taskData.due as string) : undefined,
        assigneeID: taskData.assignee?.id,
        taskKindName: taskData?.taskKindName ?? undefined,
        status: taskData?.status ? Object.values(TaskTaskStatus).find((type) => type === taskData?.status) : undefined,
        tags: taskData?.tags ?? [],
      })
    }
  }, [taskData, form])

  const controlParams: CustomEvidenceControl[] = [
    ...(associationsData?.task?.controls?.edges?.map((edge) => edge?.node).filter(Boolean) ?? []),
    ...(associationsData?.task?.subcontrols?.edges?.map((edge) => edge?.node).filter(Boolean) ?? []),
  ]
    .filter((control): control is NonNullable<typeof control> => control != null)
    .map((control) => {
      const isSubcontrol = associationsData?.task?.subcontrols?.edges?.some((e) => e?.node?.id === control.id)
      return {
        id: control.id,
        referenceFramework: control.referenceFramework,
        refCode: control.refCode ?? '',
        __typename: isSubcontrol ? ObjectTypes.SUBCONTROL : ObjectTypes.CONTROL,
      }
    })

  const handleSheetClose = () => {
    if (isEditing) {
      setIsDiscardDialogOpen(true)
      return
    }
    handleCloseParams()
  }

  const isCreateButtonVisible = !!((associationsData?.task?.controls.edges?.length ?? 0) > 0 || (associationsData?.task?.subcontrols.edges?.length ?? 0) > 0 || taskData?.taskKindName === 'Evidence')

  const handleCloseParams = () => {
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.delete(queryParamKey)
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
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleUpdateField = async (input: UpdateTaskInput) => {
    if (!id || isEditing) {
      return
    }
    try {
      await updateTask({ updateTaskId: id, input })
      successNotification({
        title: 'Task updated',
        description: 'The task has been successfully updated.',
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
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
        className="flex flex-col"
        minWidth={470}
        header={<TasksSheetHeader close={handleSheetClose} isEditing={isEditing} isPending={isPending} setIsEditing={setIsEditing} title={taskData?.title} isEditAllowed={isEditAllowed} />}
      >
        {fetching ? (
          <TasksDetailsSheetSkeleton />
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
                    <>
                      {isCreateButtonVisible && <CreateButton title={'Create Evidence'} type="evidence" onClick={() => setIsSheetOpen(true)} />}
                      {taskData && (
                        <>
                          <EvidenceCreateSheet
                            open={isSheetOpen}
                            onOpenChange={setIsSheetOpen}
                            formData={evidenceFormData}
                            controlParam={controlParams}
                            excludeObjectTypes={[
                              ObjectTypeObjects.EVIDENCE,
                              ObjectTypeObjects.RISK,
                              ObjectTypeObjects.PROCEDURE,
                              ObjectTypeObjects.GROUP,
                              ObjectTypeObjects.INTERNAL_POLICY,
                              ObjectTypeObjects.CONTROL,
                              ObjectTypeObjects.SUB_CONTROL,
                              ObjectTypeObjects.PROGRAM,
                            ]}
                            defaultSelectedObject={ObjectTypeObjects.TASK}
                          />
                        </>
                      )}
                    </>
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
                      excludeObjectTypes={[ObjectTypeObjects.EVIDENCE, ObjectTypeObjects.GROUP]}
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

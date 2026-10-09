'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { Sheet, SheetContent } from '@repo/ui/sheet'
import { TaskTaskStatus, type TaskQuery, type UpdateTaskInput } from '@repo/codegen/src/schema'
import { useNotification } from '@/hooks/useNotification'
import useFormSchema, { type EditTaskFormData } from '@/components/pages/protected/tasks/hooks/use-form-schema'
import { Form } from '@repo/ui/form'
import { useTask, useTaskAssociations, useUpdateTask } from '@/lib/graphql-hooks/task'
import { CreateTaskDialog } from '../dialog/create-task-dialog'
import { useQueryClient } from '@tanstack/react-query'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog.tsx'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config.ts'
import ObjectAssociation from '@/components/shared/object-association/object-association'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { canEdit } from '@/lib/authz/utils'
import TitleField from '../form/fields/title-field'
import DetailsField from '../form/fields/details-field'
import Properties from '../form/fields/properties'
import Conversation from '../form/fields/conversation'
import TasksSheetHeader from '../form/fields/header'
import { SlideoutFormActions } from '@/components/shared/crud-base/slideout-form-actions'
import { buildTaskAssociations, generateEvidenceFormData, type TTaskCopyMode } from '../utils'
import { getAssociationInput } from '@/components/shared/object-association/utils'
import { dateOrClear, orClear, richTextOrClear, useDirtyInput, type TFieldMappers, passthrough } from '@/hooks/useDirtyInput'
import { useTaskCopyPrefill } from '../../hooks/use-task-copy-prefill'
import MarkAsComplete from '../form/fields/mark-as-complete'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { TasksDetailsSheetSkeleton } from '../../skeleton/tasks-details-sheet-skeleton'
import EvidenceCreateSheet from '../../../evidence/evidence-create-sheet'
import { CreateButton } from '@/components/shared/create-button/create-button'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { type CustomEvidenceControl } from '../../../evidence/evidence-sheet-config'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { useSession } from 'next-auth/react'
import { useGetSingleOrganizationMembers } from '@/lib/graphql-hooks/organization'
import { type TOrgMembers, useTaskStore } from '../../hooks/useTaskStore'
import { useOpenObjectSheet } from '@/providers/sheet-navigation-provider'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { type TPersistOptions } from '@/components/shared/crud-base/persist-form-field'

type TaskDetailsSheetProps = {
  queryParamKey?: string
  entityId?: string | null
  onClose?: () => void
}

const TASK_UPDATE_FIELDS = {
  taskKindName: orClear('clearTaskKindName'),
  details: richTextOrClear('clearDetails'),
  assigneeID: orClear('clearAssignee'),
  due: dateOrClear('clearDue'),
  tags: orClear('clearTags'),
  isTemplate: passthrough,
  status: passthrough,
  title: passthrough,
} satisfies TFieldMappers<EditTaskFormData, UpdateTaskInput>

const toTaskFormValues = (task: NonNullable<TaskQuery['task']>) => ({
  title: task.title ?? '',
  details: task.details ?? '',
  due: task.due ? new Date(task.due as string) : null,
  assigneeID: task.assignee?.id,
  taskKindName: task.taskKindName ?? undefined,
  status: task.status ? Object.values(TaskTaskStatus).find((type) => type === task.status) : undefined,
  tags: task.tags ?? [],
  isTemplate: task.isTemplate ?? false,
})

const TaskDetailsSheet: React.FC<TaskDetailsSheetProps> = ({ queryParamKey = 'id', entityId: entityIdProp, onClose: onCloseProp }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [internalEditing, setInternalEditing] = useState<keyof EditTaskFormData | null>(null)
  const queryClient = useQueryClient()
  const smartRouter = useSmartRouter()
  const { successNotification, errorNotification } = useNotification()
  const openObjectSheet = useOpenObjectSheet()
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState<boolean>(false)
  const [associations, setAssociations] = useState<TObjectAssociationMap>({})
  const { mutateAsync: updateTask, isPending } = useUpdateTask()
  const { orgMembers, setOrgMembers } = useTaskStore()
  const { data: session } = useSession()
  const { data: membersData } = useGetSingleOrganizationMembers({ organizationId: orgMembers === undefined ? session?.user.activeOrganizationId : undefined })

  const searchParams = useSearchParams()
  const pathname = usePathname()
  const id = entityIdProp !== undefined ? entityIdProp : searchParams.get(queryParamKey)
  const sharePath = !id ? '' : entityIdProp !== undefined ? getHrefForObjectType(ObjectAssociationNodeEnum.TASK, { id }) : `${pathname}?${queryParamKey}=${id}`
  const { data: permission } = useAccountRoles(ObjectTypes.TASK, id)
  const isEditAllowed = canEdit(permission?.roles, session)
  const { data, isLoading: fetching } = useTask(id as string)
  const taskData = data?.task
  const { form } = useFormSchema(undefined, { isCreate: false })
  const { isDirty: isTaskDirty } = form.formState
  const buildDirtyInput = useDirtyInput(form)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const { data: associationsData, isLoading: associationsLoading } = useTaskAssociations(id as string)
  const isTemplate = !!taskData?.isTemplate
  const evidenceFormData = useMemo(() => generateEvidenceFormData(taskData, associationsData), [taskData, associationsData])
  const [createFromTaskMode, setCreateFromTaskMode] = useState<TTaskCopyMode | null>(null)

  const { initialValues: copyValues, initialData: copyAssociations, objectAssociationItems: copyAssociationItems } = useTaskCopyPrefill(taskData, associationsData, createFromTaskMode)

  const initialAssociations = useMemo(() => buildTaskAssociations(associationsData, taskData), [associationsData, taskData])

  useEffect(() => {
    setAssociations(initialAssociations)
  }, [initialAssociations])

  useEffect(() => {
    if (!membersData) return
    const members = membersData.organization?.members?.edges?.map(
      (member) =>
        ({
          value: member?.node?.user?.id,
          label: `${member?.node?.user?.displayName}`,
          membershipId: member?.node?.user?.id,
        }) as TOrgMembers,
    )
    setOrgMembers(members)
  }, [membersData, setOrgMembers])

  const isEditingRef = useRef(isEditing)

  useEffect(() => {
    isEditingRef.current = isEditing
  }, [isEditing])

  useEffect(() => {
    if (taskData && !isEditingRef.current) {
      form.reset(toTaskFormValues(taskData))
    }
  }, [taskData, form])

  const discardEdits = useCallback(() => {
    if (taskData) {
      form.reset(toTaskFormValues(taskData))
    } else {
      form.reset()
    }
    setAssociations(initialAssociations)
    setIsEditing(false)
  }, [taskData, form, initialAssociations])

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
    if (isEditing && isTaskDirty) {
      setIsDiscardDialogOpen(true)
      return
    }
    handleCloseParams()
  }

  const isCreateButtonVisible = !!((associationsData?.task?.controls.edges?.length ?? 0) > 0 || (associationsData?.task?.subcontrols.edges?.length ?? 0) > 0 || taskData?.taskKindName === 'Evidence')

  const handleCloseParams = () => {
    if (onCloseProp) {
      onCloseProp()
      discardEdits()
      return
    }
    smartRouter.replace({ [queryParamKey]: null })
    discardEdits()
  }

  const handleTaskCreatedFromTask = (newId: string) => {
    setIsEditing(false)

    if (onCloseProp) {
      onCloseProp()
      openObjectSheet(newId, ObjectAssociationNodeEnum.TASK)
      return
    }

    smartRouter.replace({ [queryParamKey]: newId })
  }

  const onSubmit = async (data: EditTaskFormData) => {
    if (!id) {
      return
    }

    const changedFields = await buildDirtyInput<UpdateTaskInput>(data, TASK_UPDATE_FIELDS)

    const input: UpdateTaskInput = { ...changedFields, ...getAssociationInput(initialAssociations, associations) }

    if (Object.keys(input).length === 0) {
      form.reset()
      setIsEditing(false)
      return
    }

    try {
      await updateTask({
        updateTaskId: id as string,
        input,
      })

      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      form.reset(data)
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

  const handleUpdateField = async (input: UpdateTaskInput, options?: TPersistOptions) => {
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
      if (options?.throwOnError) {
        throw error
      }
    }
  }

  return (
    <>
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
          header={
            <TasksSheetHeader
              close={handleSheetClose}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              title={taskData?.title}
              isEditAllowed={isEditAllowed}
              id={id}
              onDuplicate={() => setCreateFromTaskMode('duplicate')}
              canDuplicate={!!taskData && !fetching && !associationsLoading}
              sharePath={sharePath}
              onDeleted={handleCloseParams}
              isTemplate={isTemplate}
              onTemplateChange={(nextIsTemplate) => handleUpdateField({ isTemplate: nextIsTemplate })}
              onUseTemplate={() => setCreateFromTaskMode('template')}
              formActions={isEditing ? <SlideoutFormActions formId="editTask" onCancel={discardEdits} isPending={isPending} /> : undefined}
            />
          }
        >
          {fetching ? (
            <TasksDetailsSheetSkeleton />
          ) : (
            <>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} id="editTask">
                  {isEditing && <TitleField />}
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
                              allowedObjectTypes={[ObjectTypeObjects.CONTROL_IMPLEMENTATION, ObjectTypeObjects.CONTROL_OBJECTIVE, ObjectTypeObjects.SCAN, ObjectTypeObjects.TASK]}
                              defaultSelectedObject={ObjectTypeObjects.TASK}
                            />
                          </>
                        )}
                      </>
                      {!isTemplate && <MarkAsComplete taskData={taskData} />}
                    </div>
                  )}
                  <Properties
                    isEditing={isEditing}
                    taskData={taskData}
                    internalEditing={internalEditing}
                    setInternalEditing={setInternalEditing}
                    handleUpdate={handleUpdateField}
                    isEditAllowed={isEditAllowed}
                    isTemplate={isTemplate}
                  />
                  {isEditing && (
                    <Panel className="mt-20">
                      <PanelHeader heading="Object association" noBorder />
                      <p>Associating objects will allow users with access to the object to see the created task.</p>
                      <ObjectAssociation
                        initialData={initialAssociations}
                        onIdChange={(updatedMap) => setAssociations(updatedMap)}
                        allowedObjectTypes={[
                          ObjectTypeObjects.CONTROL,
                          ObjectTypeObjects.CONTROL_OBJECTIVE,
                          ObjectTypeObjects.IDENTITY_HOLDER,
                          ObjectTypeObjects.INTERNAL_POLICY,
                          ObjectTypeObjects.PROCEDURE,
                          ObjectTypeObjects.PROGRAM,
                          ObjectTypeObjects.RISK,
                          ObjectTypeObjects.SCAN,
                          ObjectTypeObjects.SUB_CONTROL,
                          ObjectTypeObjects.TASK,
                        ]}
                      />
                    </Panel>
                  )}
                </form>
              </Form>
            </>
          )}
          <Conversation isEditing={isEditing} taskData={taskData} id={id} />
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
      {copyValues && (
        <CreateTaskDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setCreateFromTaskMode(null)
            }
          }}
          initialValues={copyValues}
          initialData={copyAssociations}
          objectAssociationItems={copyAssociationItems}
          fromTemplate={createFromTaskMode === 'template'}
          onSuccessWithId={handleTaskCreatedFromTask}
        />
      )}
    </>
  )
}

export default TaskDetailsSheet

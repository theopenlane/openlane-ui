'use client'

import React, { Fragment, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { ArrowDownUp, ArrowUpDown, ArrowRight, BookText, CalendarCheck2, Check, Circle, CircleUser, Folder, InfoIcon, Link, Pencil, Tag, UserRoundPen } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { CreateNoteInput, TaskTaskStatus } from '@repo/codegen/src/schema'
import { Input } from '@repo/ui/input'
import { useNotification } from '@/hooks/useNotification'
import { useTaskStore } from '@/components/pages/protected/tasks/hooks/useTaskStore'
import useFormSchema, { EditTaskFormData } from '@/components/pages/protected/tasks/hooks/use-form-schema'
import { Loading } from '@/components/shared/loading/loading'
import { Controller } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { format } from 'date-fns'
import { Badge } from '@repo/ui/badge'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { TaskStatusMapper, TaskTypes } from '@/components/pages/protected/tasks/util/task'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import ControlObjectTaskForm from '@/components/pages/protected/tasks/create-task/form/control-object-task-form'
import DeleteTaskDialog from '@/components/pages/protected/tasks/create-task/dialog/delete-task-dialog'
import { useTask, useUpdateTask } from '@/lib/graphql-hooks/tasks'
import { useQueryClient } from '@tanstack/react-query'
import { useGetUsers } from '@/lib/graphql-hooks/user'
import { TCommentData } from '@/components/shared/comments/types/TCommentData'
import { TComments } from '@/components/shared/comments/types/TComments'
import CommentList from '@/components/shared/comments/CommentList'
import AddComment from '@/components/shared/comments/AddComment'
import PlateEditor from '@/components/shared/plate/plate-editor'
import { Value } from '@udecode/plate-common'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import EvidenceCreateFormDialog from '../../../evidence/evidence-create-form-dialog'
import MultipleSelector, { Option } from '@repo/ui/multiple-selector'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog.tsx'
import { TaskStatusIconMapper } from '../../table/columns'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config.ts'

const TaskDetailsSheet = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [commentSortIsAsc, setCommentSortIsAsc] = useState<boolean>(true)
  const [tagValues, setTagValues] = useState<Option[]>([])
  const queryClient = useQueryClient()
  const plateEditorHelper = usePlateEditor()
  const taskTypeOptions = Object.values(TaskTypes)
  const statusOptions = Object.values(TaskTaskStatus)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { selectedTask, setSelectedTask, orgMembers } = useTaskStore()
  const { successNotification, errorNotification } = useNotification()
  const [comments, setComments] = useState<TCommentData[]>([])
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState<boolean>(false)

  const { mutateAsync: updateTask } = useUpdateTask()
  const { data, isLoading: fetching } = useTask(selectedTask as string)

  const taskData = data?.task
  const { form } = useFormSchema()
  const where = taskData?.comments ? { idIn: taskData?.comments?.edges?.map((item) => item?.node?.createdBy!) } : undefined
  const { data: userData } = useGetUsers(where)

  useEffect(() => {
    if (taskData) {
      form.reset({
        title: taskData.title ?? '',
        details: taskData.details ?? '',
        due: taskData.due ? new Date(taskData.due as string) : undefined,
        assigneeID: taskData.assignee?.id,
        category: taskData?.category ? Object.values(TaskTypes).find((type) => type === taskData?.category) : undefined,
        controlObjectiveIDs: taskData?.controlObjectives?.edges?.map((item) => item?.node?.id) || [],
        subcontrolIDs: taskData?.subcontrols?.edges?.map((item) => item?.node?.id) || [],
        programIDs: taskData?.programs?.edges?.map((item) => item?.node?.id) || [],
        procedureIDs: taskData?.procedures?.edges?.map((item) => item?.node?.id) || [],
        internalPolicyIDs: taskData?.internalPolicies?.edges?.map((item) => item?.node?.id) || [],
        evidenceIDs: taskData?.evidence?.edges?.map((item) => item?.node?.id) || [],
        groupIDs: taskData?.groups?.edges?.map((item) => item?.node?.id) || [],
        status: taskData?.status ? Object.values(TaskTaskStatus).find((type) => type === taskData?.status) : undefined,
        tags: taskData?.tags ?? [],
      })

      if (taskData?.tags) {
        const tags = taskData.tags.map((item) => {
          return {
            value: item,
            label: item,
          } as Option
        })
        setTagValues(tags)
      }
    }

    if (taskData && userData && userData?.users?.edges?.length) {
      const comments = (taskData?.comments || [])?.edges?.map((item) => {
        const user = userData.users!.edges!.find((user) => user!.node!.id === item?.node?.createdBy)?.node!
        const avatarUrl = user!.avatarFile?.presignedURL || user.avatarRemoteURL
        return {
          comment: item?.node?.text,
          avatarUrl: avatarUrl,
          createdAt: item?.node?.createdAt,
          userName: user?.firstName ? `${user.firstName} ${user?.lastName}` : user.displayName,
        } as TCommentData
      })
      const sortedComments = comments?.sort((a, b) => new Date(!commentSortIsAsc ? b.createdAt : a.createdAt).getTime() - new Date(!commentSortIsAsc ? a.createdAt : b.createdAt).getTime())
      setComments(sortedComments || [])
    }
  }, [taskData, form])

  const handleCopyLink = () => {
    if (!selectedTask) {
      return
    }

    const url = `${window.location.origin}${window.location.pathname}?taskId=${selectedTask}`
    navigator.clipboard
      .writeText(url)
      .then(() => {
        successNotification({
          title: 'Link copied to clipboard',
        })
      })
      .catch(() => {
        errorNotification({
          title: 'Failed to copy link',
        })
      })
  }

  const handleSheetClose = () => {
    if (isEditing) {
      setIsDiscardDialogOpen(true)
      return
    }

    handleCloseParams()
  }

  const handleCloseParams = () => {
    setSelectedTask(null)
    setIsEditing(false)

    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.delete('taskId')
    router.replace(`${window.location.pathname}?${newSearchParams.toString()}`)
  }

  const onSubmit = async (data: EditTaskFormData) => {
    if (!selectedTask) {
      return
    }

    let detailsField = data?.details

    if (detailsField) {
      detailsField = await plateEditorHelper.convertToHtml(detailsField as Value)
    }

    const taskObjects = data?.taskObjects?.reduce(
      (acc, item) => {
        acc[item.inputName] = item.objectIds
        return acc
      },
      {} as Record<string, string[]>,
    )

    const generatePayload = (existing: Record<string, string[]>, newValues: Record<string, string[]>) => {
      const payload: Record<string, string[]> = {}

      Object.keys(newValues).forEach((key) => {
        const newIds = newValues[key] || []
        const existingIds = existing[key] || []

        const addIds = newIds.filter((id) => !existingIds.includes(id))

        const removeIds = existingIds.filter((id) => !newIds.includes(id))

        if (addIds.length > 0) payload[`add${capitalizeFirstLetter(key)}`] = addIds
        if (removeIds.length > 0) payload[`remove${capitalizeFirstLetter(key)}`] = removeIds
      })

      return payload
    }

    const capitalizeFirstLetter = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

    const existingTaskObjectsData = [
      ...[{ inputName: 'controlObjectiveIDs', objectIds: data.controlObjectiveIDs ?? [] }],
      ...[{ inputName: 'subcontrolIDs', objectIds: data.subcontrolIDs ?? [] }],
      ...[{ inputName: 'programIDs', objectIds: data.programIDs ?? [] }],
      ...[{ inputName: 'procedureIDs', objectIds: data.procedureIDs ?? [] }],
      ...[{ inputName: 'internalPolicyIDs', objectIds: data.internalPolicyIDs ?? [] }],
      ...[{ inputName: 'evidenceIDs', objectIds: data.evidenceIDs ?? [] }],
      ...[{ inputName: 'groupIDs', objectIds: data.groupIDs ?? [] }],
    ]

    const existingTaskObjects = existingTaskObjectsData?.reduce(
      (acc, item) => {
        acc[item.inputName] = item.objectIds
        return acc
      },
      {} as Record<string, string[]>,
    )

    const taskObjectPayload = generatePayload(existingTaskObjects, taskObjects ?? {})

    const formData = {
      category: data?.category,
      due: data?.due ? data.due.toISOString() : undefined,
      title: data?.title,
      details: detailsField,
      assigneeID: data?.assigneeID,
      status: data?.status,
      clearAssignee: !data?.assigneeID,
      ...taskObjectPayload,
    }

    try {
      await updateTask({
        updateTaskId: selectedTask as string,
        input: formData,
      })

      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      successNotification({
        title: 'Task Updated',
        description: 'The task has been successfully updated.',
      })

      setIsEditing(false)
    } catch (error) {
      errorNotification({
        title: 'Error',
        description: 'There was an unexpected error. Please try again later.',
      })
    }
  }

  const handleMarkAsComplete = async () => {
    try {
      await updateTask({
        updateTaskId: selectedTask as string,
        input: {
          status: TaskTaskStatus.COMPLETED,
        },
      })

      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      successNotification({
        title: 'Task Updated',
        description: 'The task has been successfully marked as complete.',
      })

      setIsEditing(false)
    } catch (error) {
      errorNotification({
        title: 'Error',
        description: 'There was an unexpected error. Please try again later.',
      })
    }
  }

  const handleRelatedObjects = () => {
    const items = [
      ...(taskData?.controlObjectives?.edges?.map((item) => item?.node?.displayID) || []),
      ...(taskData?.subcontrols?.edges?.map((item) => item?.node?.refCode) || []),
      ...(taskData?.programs?.edges?.map((item) => item?.node?.displayID) || []),
      ...(taskData?.procedures?.edges?.map((item) => item?.node?.displayID) || []),
      ...(taskData?.internalPolicies?.edges?.map((item) => item?.node?.displayID) || []),
      ...(taskData?.evidence?.edges?.map((item) => item?.node?.displayID) || []),
      ...(taskData?.groups?.edges?.map((item) => item?.node?.displayID) || []),
    ]

    return <div className="flex flex-wrap gap-2">{items?.map((item: string | undefined, index: number) => <Fragment key={index}>{item && <Badge variant="outline">{item}</Badge>}</Fragment>)}</div>
  }

  const handleTags = () => {
    return (
      <div className="flex flex-wrap gap-2">{taskData?.tags?.map((item: string | undefined, index: number) => <Fragment key={index}>{item && <Badge variant="outline">{item}</Badge>}</Fragment>)}</div>
    )
  }

  const handleSendComment = async (data: TComments) => {
    try {
      const comment = await plateEditorHelper.convertToHtml(data.comment)

      await updateTask({
        updateTaskId: selectedTask as string,
        input: {
          addComment: {
            text: comment,
          } as CreateNoteInput,
        },
      })

      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    } catch (error) {
      errorNotification({
        title: 'Error',
        description: 'There was an unexpected error. Please try again later.',
      })
    }
  }

  const handleCommentSort = () => {
    const sortedComments = comments.sort((a, b) => new Date(commentSortIsAsc ? b.createdAt : a.createdAt).getTime() - new Date(commentSortIsAsc ? a.createdAt : b.createdAt).getTime())
    setCommentSortIsAsc((usePrev) => !usePrev)

    setComments(sortedComments)
  }

  const handleDetailsChange = (value: Value) => {
    form.setValue('details', value)
  }

  return (
    <Sheet open={!!selectedTask} onOpenChange={handleSheetClose}>
      <SheetContent className="bg-card flex flex-col">
        {fetching ? (
          <Loading />
        ) : (
          <>
            <SheetHeader>
              <div className="flex items-center justify-between">
                <ArrowRight size={16} className="cursor-pointer" onClick={handleSheetClose} />
                <div className="flex justify-end gap-2">
                  <Button icon={<Link />} iconPosition="left" variant="outline" onClick={handleCopyLink}>
                    Copy link
                  </Button>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button onClick={form.handleSubmit(onSubmit)} icon={<Check />} iconPosition="left">
                        Save
                      </Button>
                    </div>
                  ) : (
                    <Button icon={<Pencil />} iconPosition="left" variant="outline" onClick={() => setIsEditing(true)}>
                      Edit
                    </Button>
                  )}
                  {taskData?.displayID && <DeleteTaskDialog taskName={taskData.displayID} />}
                </div>
              </div>
            </SheetHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <SheetTitle>
                  {isEditing ? (
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem className="w-1/3">
                          <div className="flex items-center">
                            <FormLabel>Title</FormLabel>
                            <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Provide a brief, descriptive title to help easily identify the task later.</p>} />
                          </div>
                          <FormControl>
                            <Input variant="medium" {...field} className="w-full" />
                          </FormControl>
                          {form.formState.errors.title && <p className="text-red-500 text-sm">{form.formState.errors.title.message}</p>}
                        </FormItem>
                      )}
                    />
                  ) : (
                    taskData?.title
                  )}
                </SheetTitle>
                {isEditing ? (
                  <FormField
                    control={form.control}
                    name="details"
                    render={({ field }) => (
                      <FormItem className="w-full pt-4">
                        <div className="flex items-center">
                          <FormLabel>Details</FormLabel>
                          <SystemTooltip
                            icon={<InfoIcon size={14} className="mx-1 mt-1" />}
                            content={<p>Outline the task requirements and specific instructions for the assignee to ensure successful completion.</p>}
                          />
                        </div>
                        <FormControl>
                          <PlateEditor onChange={handleDetailsChange} initialValue={taskData?.details ?? undefined} variant="basic" placeholder="Write your task details" />
                        </FormControl>
                        {form.formState.errors.details && <p className="text-red-500 text-sm">{form.formState.errors.details.message}</p>}
                      </FormItem>
                    )}
                  />
                ) : (
                  <>{!!taskData?.details && <div>{plateEditorHelper.convertToReadOnly(taskData.details)}</div>}</>
                )}
              </form>
            </Form>

            {!isEditing && (
              <div className="flex gap-4">
                {taskData && (
                  <EvidenceCreateFormDialog
                    formData={{
                      displayID: taskData!.displayID,
                      tags: taskData!.tags ?? undefined,
                      objectAssociations: {
                        controlObjectiveIDs: taskData?.controlObjectives?.edges?.map((item) => item?.node?.id!) || [],
                        subcontrolIDs: taskData?.subcontrols?.edges?.map((item) => item?.node?.id!) || [],
                        programIDs: taskData?.programs?.edges?.map((item) => item?.node?.id!) || [],
                        taskIDs: [taskData.id],
                      },
                      objectAssociationsDisplayIDs: [
                        ...(taskData?.controlObjectives?.edges?.map((item) => item?.node?.displayID!) || []),
                        ...(taskData?.subcontrols?.edges?.map((item) => item?.node?.refCode!) || []),
                        ...(taskData?.programs?.edges?.map((item) => item?.node?.displayID!) || []),
                        ...[taskData.displayID],
                      ],
                    }}
                    excludeObjectTypes={[ObjectTypeObjects.EVIDENCE, ObjectTypeObjects.RISK, ObjectTypeObjects.PROCEDURE, ObjectTypeObjects.GROUP, ObjectTypeObjects.INTERNAL_POLICY]}
                  />
                )}
                <Button disabled={taskData?.status === TaskTaskStatus.COMPLETED} icon={<Check />} iconPosition="left" variant="outline" onClick={() => handleMarkAsComplete()}>
                  Mark as complete
                </Button>
              </div>
            )}

            <div>
              <div className="flex flex-col gap-4 mt-5">
                <div className="flex items-center gap-4">
                  <CircleUser height={16} width={16} className="text-accent-secondary" />
                  <p className="text-sm w-[120px]">Assigner</p>
                  <p className="capitalize text-sm">{taskData?.assigner?.displayName}</p>
                </div>

                <div className="flex items-center gap-4">
                  <UserRoundPen height={16} width={16} className="text-accent-secondary" />
                  <p className="text-sm w-[120px]">Assignee</p>
                  {isEditing ? (
                    <Controller
                      name="assigneeID"
                      control={form.control}
                      render={({ field }) => (
                        <>
                          <Select
                            value={field.value || 'unassigned'}
                            onValueChange={(value) => {
                              field.onChange(value === 'unassigned' ? null : value || undefined)
                            }}
                          >
                            <SelectTrigger className="w-1/3">{(orgMembers || []).find((member) => member.value === field.value)?.label || 'Select'}</SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">Not Assigned</SelectItem>
                              {orgMembers &&
                                orgMembers.length > 0 &&
                                orgMembers.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          {form.formState.errors.assigneeID && <p className="text-red-500 text-sm">{form.formState.errors.assigneeID.message}</p>}
                        </>
                      )}
                    />
                  ) : (
                    <p className="capitalize text-sm">{taskData?.assignee?.displayName}</p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <CalendarCheck2 height={16} width={16} className="text-accent-secondary" />
                  <p className="text-sm w-[120px]">Due Date</p>
                  {isEditing ? (
                    <Controller
                      name="due"
                      control={form.control}
                      render={({ field }) => (
                        <>
                          <CalendarPopover field={field} disabledFrom={new Date()} buttonClassName="w-1/3 flex justify-between items-center" />
                          {form.formState.errors.due && <p className="text-red-500 text-sm">{form.formState.errors.due.message}</p>}
                        </>
                      )}
                    />
                  ) : (
                    <p className="text-sm">{taskData?.due ? format(new Date(taskData.due as string), 'MMMM d, yyyy') : ''}</p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <Circle height={16} width={16} className="text-accent-secondary" />
                  <p className="text-sm w-[120px]">Status</p>
                  {isEditing ? (
                    <Controller
                      name="status"
                      control={form.control}
                      render={({ field }) => {
                        return (
                          <>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="w-1/3">{TaskStatusMapper[field.value as TaskTaskStatus] || 'Select'}</SelectTrigger>
                              <SelectContent>
                                {statusOptions.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {TaskStatusMapper[option as TaskTaskStatus]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {form.formState.errors.status && <p className="text-red-500 text-sm">{form.formState.errors.status.message}</p>}
                          </>
                        )
                      }}
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      {taskData?.status && TaskStatusIconMapper[TaskStatusMapper[taskData?.status as TaskTaskStatus]]}
                      <p className="text-sm">{TaskStatusMapper[taskData?.status as TaskTaskStatus]}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <Folder height={16} width={16} className="text-accent-secondary" />
                  <p className="text-sm w-[120px]">Task type</p>
                  {isEditing ? (
                    <Controller
                      name="category"
                      control={form.control}
                      render={({ field }) => {
                        return (
                          <>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="w-1/3">{field.value || 'Select'}</SelectTrigger>
                              <SelectContent>
                                {taskTypeOptions.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {form.formState.errors.category && <p className="text-red-500 text-sm">{form.formState.errors.category.message}</p>}
                          </>
                        )
                      }}
                    />
                  ) : (
                    <p className="text-sm">{taskData?.category}</p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <Tag height={16} width={16} className="text-accent-secondary" />
                  <p className="text-sm w-[120px]">Tags</p>
                  {isEditing ? (
                    <Controller
                      name="tags"
                      control={form.control}
                      render={({ field }) => {
                        return (
                          <>
                            <MultipleSelector
                              placeholder="Add tag..."
                              creatable
                              commandProps={{
                                className: 'w-1/3',
                              }}
                              value={tagValues}
                              onChange={(selectedOptions) => {
                                const options = selectedOptions.map((option) => option.value)
                                field.onChange(options)
                                setTagValues(
                                  selectedOptions.map((item) => {
                                    return {
                                      value: item.value,
                                      label: item.label,
                                    }
                                  }),
                                )
                              }}
                            />
                            {form.formState.errors.tags && <p className="text-red-500 text-sm">{form.formState.errors.tags.message}</p>}
                          </>
                        )
                      }}
                    />
                  ) : (
                    <>{handleTags()}</>
                  )}
                </div>

                {!isEditing && (
                  <div className="flex items-center gap-4">
                    <BookText height={16} width={16} className="text-accent-secondary" />
                    <p className="text-sm w-[120px]">Related Objects</p>
                    {handleRelatedObjects()}
                  </div>
                )}
              </div>
            </div>

            {isEditing && <ControlObjectTaskForm form={form} />}
          </>
        )}
        {!isEditing && (
          <>
            <div className="p-2 w-full">
              <div className="flex justify-between items-end">
                <p className="text-lg">Conversation</p>
                <div className="flex items-center gap-1 text-right cursor-pointer" onClick={handleCommentSort}>
                  {commentSortIsAsc && <ArrowDownUp height={16} width={16} />}
                  {!commentSortIsAsc && <ArrowUpDown height={16} width={16} className="text-accent-secondary" />}
                  <p className="text-sm ">Newest at bottom</p>
                </div>
              </div>
            </div>
            <CommentList comments={comments} />
            <AddComment onSuccess={handleSendComment} />
          </>
        )}
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

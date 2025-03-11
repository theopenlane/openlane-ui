'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { Link, Pencil, Check, FilePlus, SquareArrowRight, CircleUser, UserRoundPen, CalendarCheck2, Circle, Folder, BookText, InfoIcon, ArrowDownUp, ArrowUpDown } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { CreateNoteInput, TaskTaskStatus } from '@repo/codegen/src/schema'
import { Textarea } from '@repo/ui/textarea'
import { Input } from '@repo/ui/input'
import { useNotification } from '@/hooks/useNotification'
import { useTaskStore } from '@/components/pages/protected/tasks/hooks/useTaskStore'
import useFormSchema, { EditTaskFormData } from '@/components/pages/protected/tasks/hooks/use-form-schema'
import { Loading } from '@/components/shared/loading/loading'
import { Controller } from 'react-hook-form'
import { Select, SelectContent, SelectTrigger, SelectItem } from '@repo/ui/select'
import { format } from 'date-fns'
import { Badge } from '@repo/ui/badge'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { TaskStatusMapper, TaskTypes } from '@/components/pages/protected/tasks/util/task'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import ControlObjectTaskForm from '@/components/pages/protected/tasks/create-task/form/control-object-task-form'
import { TaskStatusIconMapper } from '@/components/pages/protected/tasks/util/columns'
import DeleteTaskDialog from '@/components/pages/protected/tasks/create-task/dialog/delete-task-dialog'
import { useTask, useUpdateTask } from '@/lib/graphql-hooks/tasks'
import { useQueryClient } from '@tanstack/react-query'
import { useGetUsers } from '@/lib/graphql-hooks/user'
import { TCommentData } from '@/components/shared/comments/types/TCommentData'
import { TComments } from '@/components/shared/comments/types/TComments'
import CommentList from '@/components/shared/comments/CommentList'
import AddComment from '@/components/shared/comments/AddComment'

const TaskDetailsSheet = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [commentSortIsAsc, setCommentSortIsAsc] = useState<boolean>(true)
  const queryClient = useQueryClient()
  const taskTypeOptions = Object.values(TaskTypes)
  const statusOptions = Object.values(TaskTaskStatus)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { selectedTask, setSelectedTask, orgMembers } = useTaskStore()
  const { successNotification, errorNotification } = useNotification()
  const [comments, setComments] = useState<TCommentData[]>([])

  const { mutateAsync: updateTask } = useUpdateTask()
  const { data, isLoading: fetching } = useTask(selectedTask as string)

  const taskData = data?.task
  const { form } = useFormSchema()
  const where = taskData?.comments ? { idIn: taskData.comments.map((item) => item.createdBy!) } : undefined
  const { data: userData } = useGetUsers(where)

  useEffect(() => {
    if (taskData) {
      form.reset({
        title: taskData.title ?? '',
        details: taskData.details ?? '',
        due: new Date(taskData.due as string),
        assigneeID: taskData.assignee?.id,
        category: taskData?.category ? Object.values(TaskTypes).find((type) => type === taskData?.category) : undefined,
        controlObjectiveIDs: taskData?.controlObjective?.map((item) => item.id) || [],
        subcontrolIDs: taskData?.subcontrol?.map((item) => item.id) || [],
        programIDs: taskData?.program?.map((item) => item.id) || [],
        procedureIDs: taskData?.procedure?.map((item) => item.id) || [],
        internalPolicyIDs: taskData?.internalPolicy?.map((item) => item.id) || [],
        evidenceIDs: taskData?.evidence?.map((item) => item.id) || [],
        groupIDs: taskData?.group?.map((item) => item.id) || [],
        status: taskData?.status ? Object.values(TaskTaskStatus).find((type) => type === taskData?.status) : undefined,
      })
    }

    if (taskData && userData && userData?.users?.edges?.length) {
      const comments = (taskData?.comments || []).map((item) => {
        const user = userData.users!.edges!.find((user) => user!.node!.id === item.createdBy)?.node!
        const avatarUrl = user!.avatarFile?.presignedURL || user.avatarRemoteURL
        return {
          comment: item.text,
          avatarUrl: avatarUrl,
          createdAt: item.createdAt,
          userName: user?.firstName ? `${user.firstName} ${user?.lastName}` : user.displayName,
        } as TCommentData
      })
      const sortedComments = comments.sort((a, b) => new Date(!commentSortIsAsc ? b.createdAt : a.createdAt).getTime() - new Date(!commentSortIsAsc ? a.createdAt : b.createdAt).getTime())
      setComments(sortedComments)
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
      const confirmClose = window.confirm('You have unsaved changes. Do you want to discard them?')
      if (!confirmClose) return
    }

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

    const taskObjectPayload = generatePayload(existingTaskObjects, taskObjects)

    const formData = {
      category: data?.category,
      due: data?.due,
      title: data?.title,
      details: data?.details,
      assigneeID: data?.assigneeID,
      status: data?.status,
      ...taskObjectPayload,
    }

    try {
      await updateTask({
        updateTaskId: selectedTask as string,
        input: formData,
      })

      queryClient.invalidateQueries({ queryKey: ['task'] })
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

      queryClient.invalidateQueries({ queryKey: ['task'] })
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
      ...(taskData?.controlObjective?.map((item) => item.displayID) || []),
      ...(taskData?.subcontrol?.map((item) => item.displayID) || []),
      ...(taskData?.program?.map((item) => item.displayID) || []),
      ...(taskData?.procedure?.map((item) => item.displayID) || []),
      ...(taskData?.internalPolicy?.map((item) => item.displayID) || []),
      ...(taskData?.evidence?.map((item) => item.displayID) || []),
      ...(taskData?.group?.map((item) => item.displayID) || []),
    ]

    return (
      <div className="flex flex-wrap gap-2">
        {items?.map((item: string, index: number) => (
          <Badge key={index} variant="outline">
            {item}
          </Badge>
        ))}
      </div>
    )
  }

  const handleReassignComingSoon = () => {
    alert('Reassign feature coming soon!')
  }

  const handleSendComment = async (data: TComments) => {
    try {
      await updateTask({
        updateTaskId: selectedTask as string,
        input: {
          addComment: {
            text: data.comment,
          } as CreateNoteInput,
        },
      })

      queryClient.invalidateQueries({ queryKey: ['task'] })
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

  return (
    <Sheet open={!!selectedTask} onOpenChange={handleSheetClose}>
      <SheetContent className="bg-card flex flex-col">
        {fetching ? (
          <Loading />
        ) : (
          <>
            <SheetHeader>
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
            </SheetHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                {!isEditing && (
                  <SheetDescription>
                    {taskData?.displayID} - {taskData?.category}
                  </SheetDescription>
                )}
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
                <div className="pt-4">
                  {isEditing ? (
                    <FormField
                      control={form.control}
                      name="details"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <div className="flex items-center">
                            <FormLabel>Details</FormLabel>
                            <SystemTooltip
                              icon={<InfoIcon size={14} className="mx-1 mt-1" />}
                              content={<p>Outline the task requirements and specific instructions for the assignee to ensure successful completion.</p>}
                            />
                          </div>
                          <FormControl>
                            <Textarea rows={7} id="details" {...field} className="w-full" />
                          </FormControl>
                          {form.formState.errors.details && <p className="text-red-500 text-sm">{form.formState.errors.details.message}</p>}
                        </FormItem>
                      )}
                    />
                  ) : (
                    taskData?.details
                  )}
                </div>
              </form>
            </Form>

            {!isEditing && (
              <div className="mt-9 flex gap-4">
                <Button icon={<FilePlus />} iconPosition="left">
                  Upload File
                </Button>
                <Button disabled={taskData?.status === TaskTaskStatus.COMPLETED} icon={<Check />} iconPosition="left" variant="outline" onClick={() => handleMarkAsComplete()}>
                  Mark as complete
                </Button>
                <Button icon={<SquareArrowRight />} iconPosition="left" variant="outline" onClick={handleReassignComingSoon}>
                  Reassign
                </Button>
              </div>
            )}

            <div className="pb-8">
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
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="w-1/3">{(orgMembers || []).find((member) => member.value === field.value)?.label || 'Select'}</SelectTrigger>
                            <SelectContent>
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
                          <CalendarPopover field={field} buttonClassName="w-1/3 flex justify-between items-center" />
                          {form.formState.errors.due && <p className="text-red-500 text-sm">{form.formState.errors.due.message}</p>}
                        </>
                      )}
                    />
                  ) : (
                    <p className="text-sm">{taskData?.due ? format(new Date(taskData.due as string), 'd MMM, yyyy') : ''}</p>
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
            <div className="mt-4 p-2 w-full">
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
      </SheetContent>
    </Sheet>
  )
}

export default TaskDetailsSheet

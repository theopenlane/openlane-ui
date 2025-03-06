'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { Link, Pencil, Check, Trash2, FilePlus, SquareArrowRight, CircleUser, UserRoundPen, CalendarCheck2, Circle, Folder, BookText, InfoIcon } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { useTaskQuery, useGetSingleOrganizationMembersQuery, GetSingleOrganizationMembersQueryVariables, UpdateTaskInput, useUpdateTaskMutation } from '@repo/codegen/src/schema'
import { Textarea } from '@repo/ui/textarea'
import { Input } from '@repo/ui/input'
import { useSession } from 'next-auth/react'
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
import { TaskTypes } from '@/components/pages/protected/tasks/util/task'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import ControlObjectTaskForm from '@/components/pages/protected/tasks/create-task/form/control-object-task-form'

const TaskDetailsSheet = () => {
  const { data: session } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const taskTypeOptions = Object.values(TaskTypes)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { selectedTask, setSelectedTask } = useTaskStore()
  const { successNotification, errorNotification } = useNotification()
  const variables: GetSingleOrganizationMembersQueryVariables = {
    organizationId: session?.user.activeOrganizationId ?? '',
  }
  const [{ data: membersData }] = useGetSingleOrganizationMembersQuery({ variables })

  const membersOptions = membersData?.organization?.members
    ?.filter((member) => member.user.id != session?.user.userId)
    .map((member) => ({
      value: member.user.id,
      label: `${member.user.firstName} ${member.user.lastName}`,
      membershipId: member.id,
    }))

  const [{}, updateTask] = useUpdateTaskMutation()
  const [{ data, fetching }] = useTaskQuery({
    variables: { taskId: (selectedTask as string) || '' },
    pause: !selectedTask,
  })

  const taskData = data?.task
  const { form } = useFormSchema()

  useEffect(() => {
    if (taskData) {
      form.reset({
        title: taskData.title ?? '',
        description: taskData.description ?? '',
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
      })
    }
  }, [taskData, form])

  const handleCopyLink = () => {
    if (!selectedTask) {
      return
    }

    const url = `${window.location.origin}${window.location.pathname}?groupid=${selectedTask}`
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
      description: data?.description,
      assigneeID: data?.assigneeID,
      ...taskObjectPayload,
    }

    try {
      const response = await updateTask({
        updateTaskId: selectedTask as string,
        input: formData,
      })

      if (response.error) {
        errorNotification({
          title: 'Error',
          description: 'There was an error updating the task. Please try again.',
        })
        return
      }

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

  useEffect(() => {
    const taskId = searchParams.get('taskId')
    if (taskId) {
      setSelectedTask(taskId)
    }
  }, [searchParams, setSelectedTask])

  return (
    <Sheet open={!!selectedTask} onOpenChange={handleSheetClose}>
      <SheetContent className="bg-card">
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
                <Button icon={<Trash2 />} iconPosition="left" variant="outline">
                  Delete
                </Button>
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
                            <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Test1</p>} />
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
                <SheetDescription>
                  {isEditing ? (
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <div className="flex items-center">
                            <FormLabel>Description</FormLabel>
                            <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Test3</p>} />
                          </div>
                          <FormControl>
                            <Textarea id="description" {...field} className="w-full" />
                          </FormControl>
                          {form.formState.errors.description && <p className="text-red-500 text-sm">{form.formState.errors.description.message}</p>}
                        </FormItem>
                      )}
                    />
                  ) : (
                    taskData?.description
                  )}
                </SheetDescription>
              </form>
            </Form>

            {!isEditing && (
              <div className="mt-9 flex gap-4">
                <Button icon={<FilePlus />} iconPosition="left">
                  Upload File
                </Button>
                <Button icon={<Check />} iconPosition="left" variant="outline">
                  Mark as complete
                </Button>
                <Button icon={<SquareArrowRight />} iconPosition="left" variant="outline">
                  Reassign
                </Button>
              </div>
            )}

            <div className="pb-8">
              <div className="flex flex-col gap-4 mt-5">
                <div className="flex items-center gap-4">
                  <CircleUser height={16} width={16} color="#2CCBAB" />
                  <p className="text-sm w-[120px]">Assigner:</p>
                  <p className="capitalize text-sm">{taskData?.assigner?.displayName}</p>
                </div>

                <div className="flex items-center gap-4">
                  <UserRoundPen height={16} width={16} color="#2CCBAB" />
                  <p className="text-sm w-[120px]">Assignee:</p>
                  {isEditing ? (
                    <Controller
                      name="assigneeID"
                      control={form.control}
                      render={({ field }) => (
                        <>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="w-1/3">{(membersOptions || []).find((member) => member.value === field.value)?.label || 'Select'}</SelectTrigger>
                            <SelectContent>
                              {membersOptions &&
                                membersOptions.length > 0 &&
                                membersOptions.map((option) => (
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
                  <CalendarCheck2 height={16} width={16} color="#2CCBAB" />
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
                  <Circle height={16} width={16} color="#2CCBAB" />
                  <p className="text-sm w-[120px]">Status</p>
                  <p className="text-sm">{taskData?.status}</p>
                </div>

                <div className="flex items-center gap-4">
                  <Folder height={16} width={16} color="#2CCBAB" />
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
                    <BookText height={16} width={16} color="#2CCBAB" />
                    <p className="text-sm w-[120px]">Related Objects</p>
                    {handleRelatedObjects()}
                  </div>
                )}
              </div>
            </div>

            {isEditing && <ControlObjectTaskForm form={form} />}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default TaskDetailsSheet

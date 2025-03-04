'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { Link, Pencil, Check, Trash2, FilePlus, SquareArrowRight, GlobeIcon, User, CircleUser, UserRoundPen, CalendarCheck2, Circle, Folder, BookText } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { useUpdateGroupMutation, useTaskQuery, useGetSingleOrganizationMembersQuery, GetSingleOrganizationMembersQueryVariables } from '@repo/codegen/src/schema'
import { Textarea } from '@repo/ui/textarea'
import { Input } from '@repo/ui/input'
import { useSession } from 'next-auth/react'
import { useNotification } from '@/hooks/useNotification'
import { useTaskStore } from '@/components/pages/protected/tasks/hooks/useTaskStore'
import useFormSchema, { EditTaskFormData } from '@/components/pages/protected/tasks/hooks/use-form-schema'
import { Loading } from '@/components/shared/loading/loading'
import { Controller } from 'react-hook-form'
import { Select, SelectContent, SelectTrigger } from '@repo/ui/select'
import { SelectItem } from '@nextui-org/react'
import { format } from 'date-fns'
import { Badge } from '@repo/ui/badge'

const TaskDetailsSheet = () => {
  const { form } = useFormSchema()
  const { data: session } = useSession()
  const [isEditing, setIsEditing] = useState(false)
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

  const [{ data, fetching }] = useTaskQuery({
    variables: { taskId: (selectedTask as string) || '' },
    pause: !selectedTask,
  })

  const taskData = data?.task
  const [{}, updateGroup] = useUpdateGroupMutation()

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
  }

  const handleRelatedObjects = () => {
    const items = [
      ...(taskData?.controlObjective?.map((item) => `display${item.displayID}`) || []),
      ...(taskData?.subcontrol?.map((item) => `display${item.displayID}`) || []),
      ...(taskData?.program?.map((item) => `display${item.displayID}`) || []),
      ...(taskData?.procedure?.map((item) => `display${item.displayID}`) || []),
      ...(taskData?.internalPolicy?.map((item) => `display${item.displayID}`) || []),
      ...(taskData?.evidence?.map((item) => `display${item.displayID}`) || []),
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
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <SheetDescription>
                {taskData?.displayID} - {taskData?.category}
              </SheetDescription>
              <SheetTitle>{isEditing ? <Controller name="title" control={form.control} render={({ field }) => <Input {...field} placeholder="Group name" />} /> : taskData?.title}</SheetTitle>
              <SheetDescription>
                {isEditing ? <Controller name="description" control={form.control} render={({ field }) => <Textarea {...field} placeholder="Add a description" />} /> : taskData?.description}
              </SheetDescription>
            </form>

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

            <div>
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
                            <SelectTrigger className=" w-full">{field.value || 'Select'}</SelectTrigger>
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
                  <p className="text-sm">{taskData?.due ? format(new Date(taskData.due as string), 'd MMM, yyyy') : ''}</p>
                </div>

                <div className="flex items-center gap-4">
                  <Circle height={16} width={16} color="#2CCBAB" />
                  <p className="text-sm w-[120px]">Status</p>
                  <p className="text-sm">{taskData?.status}</p>
                </div>

                <div className="flex items-center gap-4">
                  <Folder height={16} width={16} color="#2CCBAB" />
                  <p className="text-sm w-[120px]">Task type</p>
                  <p className="text-sm">{taskData?.category}</p>
                </div>

                <div className="flex items-center gap-4">
                  <BookText height={16} width={16} color="#2CCBAB" />
                  <p className="text-sm w-[120px]">Related Objects</p>
                  <p className="text-sm">{handleRelatedObjects()}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default TaskDetailsSheet

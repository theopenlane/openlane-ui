'use client'

import React, { Fragment, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { ArrowDownUp, ArrowUpDown, ArrowRight, BookText, CalendarCheck2, Check, Circle, CircleUser, Folder, InfoIcon, LinkIcon, Pencil, Tag, UserRoundPen } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { CreateNoteInput, TaskTaskStatus, UserWhereInput } from '@repo/codegen/src/schema'
import { Input } from '@repo/ui/input'
import { useNotification } from '@/hooks/useNotification'
import { useTaskStore } from '@/components/pages/protected/tasks/hooks/useTaskStore'
import useFormSchema, { EditTaskFormData } from '@/components/pages/protected/tasks/hooks/use-form-schema'
import { Loading } from '@/components/shared/loading/loading'
import { Controller } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { Badge } from '@repo/ui/badge'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { TaskStatusMapper, TaskTypes } from '@/components/pages/protected/tasks/util/task'
import { CalendarPopover } from '@repo/ui/calendar-popover'
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
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config.ts'
import { formatDate } from '@/utils/date'
import { TaskStatusIconMapper } from '@/components/shared/icon-enum/task-enum.tsx'
import ObjectAssociation from '@/components/shared/objectAssociation/object-association'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import Link from 'next/link'

const TaskDetailsSheet = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [commentSortIsAsc, setCommentSortIsAsc] = useState<boolean>(true)
  const [tagValues, setTagValues] = useState<Option[]>([])
  const queryClient = useQueryClient()
  const plateEditorHelper = usePlateEditor()
  const taskTypeOptions = Object.values(TaskTypes)
  const statusOptions = Object.values(TaskTaskStatus)
  const router = useRouter()
  const { orgMembers } = useTaskStore()
  const { successNotification, errorNotification } = useNotification()
  const [comments, setComments] = useState<TCommentData[]>([])
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState<boolean>(false)
  const [associations, setAssociations] = useState<TObjectAssociationMap>({})
  const { mutateAsync: updateTask, isPending } = useUpdateTask()

  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  const { data, isLoading: fetching } = useTask(id as string)

  const taskData = data?.task
  const { form } = useFormSchema()
  const where: UserWhereInput | undefined = taskData?.comments
    ? {
        idIn: taskData.comments.edges?.map((item) => item?.node?.createdBy).filter((id): id is string => typeof id === 'string'),
      }
    : undefined
  const { data: userData } = useGetUsers(where)

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
        const user = userData.users!.edges!.find((user) => user!.node!.id === item?.node?.createdBy)?.node
        const avatarUrl = user!.avatarFile?.presignedURL || user?.avatarRemoteURL
        return {
          comment: item?.node?.text,
          avatarUrl: avatarUrl,
          createdAt: item?.node?.createdAt,
          userName: user?.displayName,
        } as TCommentData
      })
      const sortedComments = comments?.sort((a, b) => new Date(!commentSortIsAsc ? b.createdAt : a.createdAt).getTime() - new Date(!commentSortIsAsc ? a.createdAt : b.createdAt).getTime())
      setComments(sortedComments || [])
    }
  }, [taskData, form, commentSortIsAsc, userData])

  const handleCopyLink = () => {
    if (!id) {
      return
    }

    const url = `${window.location.origin}${window.location.pathname}?id=${id}`
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
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.delete('id')
    router.replace(`${window.location.pathname}?${newSearchParams.toString()}`)
    setIsEditing(false)
  }

  const onSubmit = async (data: EditTaskFormData) => {
    if (!id) {
      return
    }

    let detailsField = data?.details

    if (detailsField) {
      detailsField = await plateEditorHelper.convertToHtml(detailsField as Value)
    }

    const associationPayload = generateAssociationPayload(initialAssociations, associations)

    // 2. Build main payload
    const formData = {
      category: data?.category,
      due: data?.due ? data.due.toISOString() : undefined,
      title: data?.title,
      details: detailsField,
      assigneeID: data?.assigneeID,
      status: data?.status,
      clearAssignee: !data?.assigneeID,
      clearDue: !data?.due,
      ...associationPayload,
    }

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

  const handleMarkAsComplete = async () => {
    try {
      await updateTask({
        updateTaskId: id as string,
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
    } catch {
      errorNotification({
        title: 'Error',
        description: 'There was an unexpected error. Please try again later.',
      })
    }
  }

  const handleRelatedObjects = () => {
    const itemsDictionary: Record<string, { id: string; value: string; controlId?: string }> = {
      ...taskData?.controlObjectives?.edges?.reduce(
        (acc, item) => {
          const key = item?.node?.displayID
          const id = item?.node?.id
          if (key && id) acc[key] = { id, value: 'controlObjectives' }
          return acc
        },
        {} as Record<string, { id: string; value: string }>,
      ),

      ...taskData?.controls?.edges?.reduce(
        (acc, item) => {
          const key = item?.node?.refCode
          const id = item?.node?.id
          if (key && id) acc[key] = { id, value: 'controls' }
          return acc
        },
        {} as Record<string, { id: string; value: string }>,
      ),

      ...taskData?.subcontrols?.edges?.reduce(
        (acc: Record<string, { id: string; value: string; controlId?: string }>, item) => {
          const key = item?.node?.refCode
          const id = item?.node?.id
          const controlId = item?.node?.controlID
          if (key && id) {
            acc[key] = { id, value: 'subcontrols', controlId }
          }
          return acc
        },
        {} as Record<string, { id: string; value: string; controlId?: string }>,
      ),

      ...taskData?.programs?.edges?.reduce(
        (acc, item) => {
          const key = item?.node?.displayID
          const id = item?.node?.id
          if (key && id) acc[key] = { id, value: 'programs' }
          return acc
        },
        {} as Record<string, { id: string; value: string }>,
      ),

      ...taskData?.procedures?.edges?.reduce(
        (acc, item) => {
          const key = item?.node?.displayID
          const id = item?.node?.id
          if (key && id) acc[key] = { id, value: 'procedures' }
          return acc
        },
        {} as Record<string, { id: string; value: string }>,
      ),

      ...taskData?.internalPolicies?.edges?.reduce(
        (acc, item) => {
          const key = item?.node?.displayID
          const id = item?.node?.id
          if (key && id) acc[key] = { id, value: 'policies' }
          return acc
        },
        {} as Record<string, { id: string; value: string }>,
      ),

      ...taskData?.evidence?.edges?.reduce(
        (acc, item) => {
          const key = item?.node?.displayID
          const id = item?.node?.id
          if (key && id) acc[key] = { id, value: 'evidence' }
          return acc
        },
        {} as Record<string, { id: string; value: string }>,
      ),

      ...taskData?.groups?.edges?.reduce(
        (acc, item) => {
          const key = item?.node?.displayID
          const id = item?.node?.id
          if (key && id) acc[key] = { id, value: 'groups' }
          return acc
        },
        {} as Record<string, { id: string; value: string }>,
      ),

      ...taskData?.risks?.edges?.reduce(
        (acc, item) => {
          const key = item?.node?.name
          const id = item?.node?.id
          if (key && id) acc[key] = { id, value: 'risks' }
          return acc
        },
        {} as Record<string, { id: string; value: string }>,
      ),
    }

    return (
      <div className="flex flex-wrap gap-2">
        {Object.entries(itemsDictionary).map(([key, { id, value, controlId }]) => {
          const href = getHrefForObjectType(value, {
            id,
            control: controlId ? { id: controlId } : undefined,
          })

          const linkClass = !href ? 'pointer-events-none' : ''

          return (
            <Link className={linkClass} href={href} key={key}>
              <Badge variant="outline">{key}</Badge>
            </Link>
          )
        })}
      </div>
    )
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
        updateTaskId: id as string,
        input: {
          addComment: {
            text: comment,
          } as CreateNoteInput,
        },
      })

      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    } catch {
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
    <Sheet open={!!id} onOpenChange={handleSheetClose}>
      <SheetContent className="bg-card flex flex-col">
        {fetching ? (
          <Loading />
        ) : (
          <>
            <SheetHeader>
              <div className="flex items-center justify-between">
                <ArrowRight size={16} className="cursor-pointer" onClick={handleSheetClose} />
                <div className="flex justify-end gap-2">
                  <Button icon={<LinkIcon />} iconPosition="left" variant="outline" onClick={handleCopyLink}>
                    Copy link
                  </Button>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Button disabled={isPending} type="button" variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button loading={isPending} disabled={isPending} onClick={form.handleSubmit(onSubmit)} icon={<Check />} iconPosition="left">
                        {isPending ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  ) : (
                    <Button icon={<Pencil />} iconPosition="left" variant="outline" onClick={() => setIsEditing(true)}>
                      Edit
                    </Button>
                  )}
                  {taskData?.displayID && id && <DeleteTaskDialog taskName={taskData.displayID} taskId={id} />}
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
                    render={() => (
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
                  <>{!!taskData?.details && <div>{plateEditorHelper.convertToReadOnly(taskData.details, 0, { paddingTop: 16, paddingRight: 16, paddingBottom: 16, paddingLeft: 0 })}</div>}</>
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
                        controlObjectiveIDs: taskData?.controlObjectives?.edges?.map((item) => item?.node?.id).filter((id): id is string => !!id) || [],
                        subcontrolIDs: taskData?.subcontrols?.edges?.map((item) => item?.node?.id).filter((id): id is string => !!id) || [],
                        programIDs: taskData?.programs?.edges?.map((item) => item?.node?.id).filter((id): id is string => !!id) || [],
                      },
                      objectAssociationsDisplayIDs: [
                        ...(taskData?.controlObjectives?.edges?.map((item) => item?.node?.displayID).filter((id): id is string => !!id) || []),
                        ...(taskData?.subcontrols?.edges?.map((item) => item?.node?.refCode).filter((id): id is string => !!id) || []),
                        ...(taskData?.programs?.edges?.map((item) => item?.node?.displayID).filter((id): id is string => !!id) || []),
                        taskData.displayID,
                      ],
                    }}
                    excludeObjectTypes={[ObjectTypeObjects.EVIDENCE, ObjectTypeObjects.RISK, ObjectTypeObjects.PROCEDURE, ObjectTypeObjects.GROUP, ObjectTypeObjects.INTERNAL_POLICY]}
                  />
                )}
                <Button className="h-8 !px-2" disabled={taskData?.status === TaskTaskStatus.COMPLETED} icon={<Check />} iconPosition="left" variant="outline" onClick={() => handleMarkAsComplete()}>
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
                          {form.formState.errors.due && <p className="text-red-500 text-sm">{form.formState.errors.due.message as string}</p>}
                        </>
                      )}
                    />
                  ) : (
                    <p className="text-sm">{formatDate(taskData?.due)}</p>
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
                      {taskData?.status && TaskStatusIconMapper[taskData.status]}
                      {taskData?.status && <p className="text-sm">{TaskStatusMapper[taskData.status]}</p>}
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

            {isEditing && (
              <Panel>
                <PanelHeader heading="Object association" noBorder />
                <p>Associating objects will allow users with access to the object to see the created task.</p>
                <ObjectAssociation
                  initialData={initialAssociations}
                  onIdChange={(updatedMap) => setAssociations(updatedMap)}
                  excludeObjectTypes={[ObjectTypeObjects.EVIDENCE, ObjectTypeObjects.TASK]}
                />
              </Panel>
            )}
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

const capitalizeFirstLetter = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

const generateAssociationPayload = (original: TObjectAssociationMap, updated: TObjectAssociationMap) => {
  const payload: Record<string, string[]> = {}

  const allKeys = new Set([...Object.keys(original), ...Object.keys(updated)])

  allKeys.forEach((key) => {
    const prev = original[key] ?? []
    const next = updated[key] ?? []

    const add = next.filter((id) => !prev.includes(id))
    const remove = prev.filter((id) => !next.includes(id))

    if (add.length > 0) payload[`add${capitalizeFirstLetter(key)}`] = add
    if (remove.length > 0) payload[`remove${capitalizeFirstLetter(key)}`] = remove
  })

  return payload
}

'use client'

import React, { Fragment, useEffect, useState } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { CalendarCheck2, Circle, CircleUser, Folder, Tag, UserRoundPen, BookText } from 'lucide-react'
import { Select, SelectTrigger, SelectContent, SelectItem } from '@repo/ui/select'

import { EditTaskFormData } from '../../../hooks/use-form-schema'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import MultipleSelector, { Option } from '@repo/ui/multiple-selector'
import { TaskStatusMapper, TaskTypes } from '@/components/pages/protected/tasks/util/task'
import { formatDate } from '@/utils/date'
import { TaskStatusIconMapper, TaskStatusOptions } from '@/components/shared/enum-mapper/task-enum'
import { TaskQuery, TaskTaskStatus } from '@repo/codegen/src/schema'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import Link from 'next/link'
import { Badge } from '@repo/ui/badge'
import { useTaskStore } from '../../../hooks/useTaskStore'

type PropertiesProps = {
  isEditing: boolean
  taskData: TaskQuery['task'] | undefined
}

const Properties: React.FC<PropertiesProps> = ({ isEditing, taskData }) => {
  const { control, formState } = useFormContext<EditTaskFormData>()
  const [tagValues, setTagValues] = useState<Option[]>([])

  const statusOptions = TaskStatusOptions
  const { orgMembers } = useTaskStore()
  const taskTypeOptions = Object.values(TaskTypes)

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

  useEffect(() => {
    if (taskData?.tags) {
      const tags = taskData.tags.map((item) => {
        return {
          value: item,
          label: item,
        } as Option
      })
      setTagValues(tags)
    }
  }, [taskData?.tags])

  return (
    <div className="flex flex-col gap-4">
      {/* Assigner */}
      <div className="flex items-center gap-4">
        <CircleUser height={16} width={16} className="text-accent-secondary" />
        <p className="text-sm w-[120px]">Assigner</p>
        <p className="capitalize text-sm">{taskData?.assigner?.displayName}</p>
      </div>

      {/* Assignee */}
      <div className="flex items-center gap-4">
        <UserRoundPen height={16} width={16} className="text-accent-secondary" />
        <p className="text-sm w-[120px]">Assignee</p>
        {isEditing ? (
          <Controller
            name="assigneeID"
            control={control}
            render={({ field }) => (
              <>
                <Select
                  value={field.value || 'unassigned'}
                  onValueChange={(value) => {
                    field.onChange(value === 'unassigned' ? null : value)
                  }}
                >
                  <SelectTrigger className="w-1/3">{orgMembers?.find((m) => m.value === field.value)?.label || 'Select'}</SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Not Assigned</SelectItem>
                    {orgMembers?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formState.errors.assigneeID && <p className="text-red-500 text-sm">{formState.errors.assigneeID.message}</p>}
              </>
            )}
          />
        ) : (
          <p className="capitalize text-sm">{taskData?.assignee?.displayName}</p>
        )}
      </div>

      {/* Due Date */}
      <div className="flex items-center gap-4">
        <CalendarCheck2 height={16} width={16} className="text-accent-secondary" />
        <p className="text-sm w-[120px]">Due Date</p>
        {isEditing ? (
          <Controller
            name="due"
            control={control}
            render={({ field }) => (
              <>
                <CalendarPopover field={field} disabledFrom={new Date()} buttonClassName="w-1/3 flex justify-between items-center" />
                {formState.errors.due && <p className="text-red-500 text-sm">{formState.errors.due.message as string}</p>}
              </>
            )}
          />
        ) : (
          <p className="text-sm">{formatDate(taskData?.due)}</p>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center gap-4">
        <Circle height={16} width={16} className="text-accent-secondary" />
        <p className="text-sm w-[120px]">Status</p>
        {isEditing ? (
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-1/3">{TaskStatusMapper[field.value as TaskTaskStatus]}</SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {TaskStatusMapper[option.value as TaskTaskStatus]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formState.errors.status && <p className="text-red-500 text-sm">{formState.errors.status.message}</p>}
              </>
            )}
          />
        ) : (
          <div className="flex items-center space-x-2">
            {taskData?.status && TaskStatusIconMapper[taskData.status]}
            {taskData?.status && <p className="text-sm">{TaskStatusMapper[taskData.status]}</p>}
          </div>
        )}
      </div>

      {/* Task Type */}
      <div className="flex items-center gap-4">
        <Folder height={16} width={16} className="text-accent-secondary" />
        <p className="text-sm w-[120px]">Task Type</p>
        {isEditing ? (
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
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
                {formState.errors.category && <p className="text-red-500 text-sm">{formState.errors.category.message}</p>}
              </>
            )}
          />
        ) : (
          <p className="text-sm">{taskData?.category}</p>
        )}
      </div>

      {/* Tags */}
      <div className="flex items-center gap-4">
        <Tag height={16} width={16} className="text-accent-secondary" />
        <p className="text-sm w-[120px]">Tags</p>
        {isEditing ? (
          <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <>
                <MultipleSelector
                  placeholder="Add tag..."
                  creatable
                  commandProps={{ className: 'w-1/3' }}
                  value={tagValues}
                  onChange={(selectedOptions) => {
                    const values = selectedOptions.map((item) => item.value)
                    field.onChange(values)
                    setTagValues(selectedOptions)
                  }}
                />
                {formState.errors.tags && <p className="text-red-500 text-sm">{formState.errors.tags.message}</p>}
              </>
            )}
          />
        ) : (
          <>{handleTags()}</>
        )}
      </div>

      {/* Related Objects */}
      {!isEditing && (
        <div className="flex items-center gap-4">
          <BookText height={16} width={16} className="text-accent-secondary" />
          <p className="text-sm w-[120px]">Related Objects</p>
          {handleRelatedObjects()}
        </div>
      )}
    </div>
  )
}

export default Properties

'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { CalendarCheck2, Circle, CircleUser, Folder, Tag, UserRoundPen } from 'lucide-react'

import { Select, SelectTrigger, SelectContent, SelectItem } from '@repo/ui/select'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import MultipleSelector, { Option } from '@repo/ui/multiple-selector'
import { TaskStatusMapper, TaskTypes } from '@/components/pages/protected/tasks/util/task'
import { formatDate } from '@/utils/date'
import { TaskQuery, TaskTaskStatus, UpdateTaskInput } from '@repo/codegen/src/schema'
import { Badge } from '@repo/ui/badge'
import { useTaskStore } from '../../../hooks/useTaskStore'
import { EditTaskFormData } from '../../../hooks/use-form-schema'
import { TaskStatusOptions } from '@/components/shared/enum-mapper/task-enum'
import RelatedObjects from './related-objects'
import useClickOutsideWithPortal from '@/hooks/useClickOutsideWithPortal'

type PropertiesProps = {
  isEditing: boolean
  taskData: TaskQuery['task'] | undefined
  internalEditing: keyof EditTaskFormData | null
  setInternalEditing: (field: keyof EditTaskFormData | null) => void
  handleUpdate?: (val: UpdateTaskInput) => void
  isEditAllowed: boolean
}

const Properties: React.FC<PropertiesProps> = ({ isEditing, taskData, internalEditing, setInternalEditing, handleUpdate, isEditAllowed }) => {
  const { control, formState } = useFormContext<EditTaskFormData>()
  const [tagValues, setTagValues] = useState<Option[]>([])
  const { orgMembers } = useTaskStore()

  const statusOptions = TaskStatusOptions
  const taskTypeOptions = Object.values(TaskTypes)

  useEffect(() => {
    if (taskData?.tags) {
      const tags = taskData.tags.map((item) => ({
        value: item,
        label: item,
      }))
      setTagValues(tags)
    }
  }, [taskData?.tags])

  const renderTags = () => {
    const hasTags = taskData?.tags && taskData.tags.length > 0

    return (
      <div className={`${isEditAllowed ? 'cursor-pointer' : 'cursor-not-allowed'} flex flex-wrap gap-2`}>
        {hasTags ? (
          taskData?.tags?.map(
            (item, index) =>
              item && (
                <Badge key={index} variant="outline">
                  {item}
                </Badge>
              ),
          )
        ) : (
          <span className="text-muted-foreground text-sm italic">No tags</span>
        )}
      </div>
    )
  }

  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  useClickOutsideWithPortal(
    () => {
      setInternalEditing(null)
    },
    {
      refs: { triggerRef, popoverRef },
      enabled: !!internalEditing && ['assigneeID', 'due', 'status', 'category', 'tags'].includes(internalEditing),
    },
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Assigner */}
      <div className="flex items-center gap-4">
        <CircleUser className="text-accent-secondary" size={16} />
        <p className="text-sm w-[120px]">Assigner</p>
        <p className="capitalize text-sm">{taskData?.assigner?.displayName}</p>
      </div>

      {/* Assignee */}
      <div className="flex items-center gap-4" onDoubleClick={() => isEditAllowed && !isEditing && setInternalEditing('assigneeID')}>
        <UserRoundPen className="text-accent-secondary" size={16} />
        <p className="text-sm w-[120px] shrink-0">Assignee</p>
        {isEditing || internalEditing === 'assigneeID' ? (
          <Controller
            name="assigneeID"
            control={control}
            render={({ field }) => (
              <div className="w-[250px]" ref={triggerRef}>
                <Select
                  required
                  value={field.value || 'unassigned'}
                  onValueChange={(value) => {
                    const newValue = value === 'unassigned' ? null : value
                    handleUpdate?.({ assigneeID: newValue })
                    field.onChange(newValue)
                    setInternalEditing(null)
                  }}
                >
                  <SelectTrigger className="w-full">{orgMembers?.find((m) => m.value === field.value)?.label || 'Select'}</SelectTrigger>
                  <SelectContent ref={popoverRef}>
                    <SelectItem value="unassigned">Not Assigned</SelectItem>
                    {orgMembers?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formState.errors.assigneeID && <p className="text-red-500 text-sm">{formState.errors.assigneeID.message}</p>}
              </div>
            )}
          />
        ) : (
          <p className={`${isEditAllowed ? 'cursor-pointer' : 'cursor-not-allowed'} capitalize text-sm`}>{taskData?.assignee?.displayName}</p>
        )}
      </div>

      {/* Due Date */}
      <div className="flex items-center gap-4" onDoubleClick={() => isEditAllowed && !isEditing && setInternalEditing('due')}>
        <CalendarCheck2 className="text-accent-secondary" size={16} />
        <p className="text-sm w-[120px]">Due Date</p>
        {isEditing || internalEditing === 'due' ? (
          <Controller
            name="due"
            control={control}
            render={({ field }) => (
              <div className="w-[250px]" ref={triggerRef}>
                <CalendarPopover
                  field={{
                    ...field,
                    onChange: (newDate) => {
                      field.onChange(newDate)
                      handleUpdate?.({ due: newDate })
                      setInternalEditing(null)
                    },
                  }}
                  disabledFrom={new Date()}
                  buttonClassName="w-full flex justify-between items-center"
                />
                {formState.errors.due && <p className="text-red-500 text-sm">{formState.errors.due.message as string}</p>}
              </div>
            )}
          />
        ) : (
          <p className={`${isEditAllowed ? 'cursor-pointer' : 'cursor-not-allowed'} text-sm`}>{formatDate(taskData?.due)}</p>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center gap-4" onDoubleClick={() => isEditAllowed && !isEditing && setInternalEditing('status')}>
        <Circle className="text-accent-secondary" size={16} />
        <p className="text-sm w-[120px]">Status</p>
        {isEditing || internalEditing === 'status' ? (
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <div className="w-[250px]" ref={triggerRef}>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    handleUpdate?.({ status: value as TaskTaskStatus })
                    field.onChange(value)
                    setInternalEditing(null)
                  }}
                >
                  <SelectTrigger className="w-full">{TaskStatusMapper[field.value as TaskTaskStatus]}</SelectTrigger>
                  <SelectContent ref={popoverRef}>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {TaskStatusMapper[option.value as TaskTaskStatus]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formState.errors.status && <p className="text-red-500 text-sm">{formState.errors.status.message}</p>}
              </div>
            )}
          />
        ) : (
          <div className={`${isEditAllowed ? 'cursor-pointer' : 'cursor-not-allowed'} flex items-center space-x-2`}>{taskData?.status && TaskStatusMapper[taskData.status]}</div>
        )}
      </div>

      {/* Task Type */}
      <div className="flex items-center gap-4" onDoubleClick={() => isEditAllowed && !isEditing && setInternalEditing('category')}>
        <Folder className="text-accent-secondary" size={16} />
        <p className="text-sm w-[120px]">Task Type</p>
        {isEditing || internalEditing === 'category' ? (
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <div className="w-[250px]" ref={triggerRef}>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    handleUpdate?.({ category: value })
                    field.onChange(value)
                    setInternalEditing(null)
                  }}
                >
                  <SelectTrigger className="w-fill">{field.value || 'Select'}</SelectTrigger>
                  <SelectContent ref={popoverRef}>
                    {taskTypeOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formState.errors.category && <p className="text-red-500 text-sm">{formState.errors.category.message}</p>}
              </div>
            )}
          />
        ) : (
          <p className={`${isEditAllowed ? 'cursor-pointer' : 'cursor-not-allowed'} text-sm`}>{taskData?.category}</p>
        )}
      </div>

      {/* Tags */}
      <div className="flex items-center gap-4" onDoubleClick={() => isEditAllowed && !isEditing && setInternalEditing('tags')}>
        <Tag className="text-accent-secondary" size={16} />
        <p className="text-sm w-[120px]">Tags</p>
        {isEditing || internalEditing === 'tags' ? (
          <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <div className="w-[250px]" ref={triggerRef}>
                <MultipleSelector
                  hideClearAllButton
                  placeholder="Add tag..."
                  creatable
                  commandProps={{ className: 'w-full' }}
                  value={tagValues}
                  onChange={(selectedOptions) => {
                    const values = selectedOptions.map((item) => item.value)
                    field.onChange(values)
                    handleUpdate?.({ tags: values })
                    setTagValues(selectedOptions)
                    setInternalEditing(null)
                  }}
                />
                {formState.errors.tags && <p className="text-red-500 text-sm">{formState.errors.tags.message}</p>}
              </div>
            )}
          />
        ) : (
          renderTags()
        )}
      </div>

      {/* Related Objects */}
      {!isEditing && <RelatedObjects taskData={taskData} />}
    </div>
  )
}

export default Properties

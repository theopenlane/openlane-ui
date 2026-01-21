'use client'

import React, { useMemo, useRef } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { BookText, CalendarCheck2, Circle, CircleUser, Folder, Tag, UserRoundPen } from 'lucide-react'

import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@repo/ui/select'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import MultipleSelector, { Option } from '@repo/ui/multiple-selector'
import { TaskStatusMapper } from '@/components/pages/protected/tasks/util/task'
import { formatDate } from '@/utils/date'
import { TaskQuery, TaskTaskStatus, UpdateTaskInput } from '@repo/codegen/src/schema'
import { useTaskStore } from '../../../hooks/useTaskStore'
import { EditTaskFormData } from '../../../hooks/use-form-schema'
import { TaskStatusOptions } from '@/components/shared/enum-mapper/task-enum'
import RelatedObjects from './related-objects'
import useClickOutsideWithPortal from '@/hooks/useClickOutsideWithPortal'
import useEscapeKey from '@/hooks/useEscapeKey'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'
import { useGetTags } from '@/lib/graphql-hooks/tags'
import TagChip from '@/components/shared/tag-chip.tsx/tag-chip'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enums'
import { CustomTypeEnumOptionChip, CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'

type PropertiesProps = {
  isEditing: boolean
  taskData: TaskQuery['task'] | undefined
  internalEditing: keyof EditTaskFormData | null
  setInternalEditing: (field: keyof EditTaskFormData | null) => void
  handleUpdate?: (val: UpdateTaskInput) => void
  isEditAllowed: boolean
}

const allProperties = ['assigneeID', 'due', 'status', 'taskKindName', 'tags']

const Properties: React.FC<PropertiesProps> = ({ isEditing, taskData, internalEditing, setInternalEditing, handleUpdate, isEditAllowed }) => {
  const { control, formState, watch, setValue } = useFormContext<EditTaskFormData>()
  const { orgMembers } = useTaskStore()

  const statusOptions = TaskStatusOptions
  const { tagOptions } = useGetTags()

  const { enumOptions: taskKindOptions } = useGetCustomTypeEnums({
    where: {
      objectType: 'task',
      field: 'kind',
    },
  })

  const tags = watch('tags')
  const tagValues = useMemo(() => {
    return (tags ?? [])
      .filter((item): item is string => typeof item === 'string')
      .map((item) => ({
        value: item,
        label: item,
      }))
  }, [tags])

  const renderTags = () => {
    const hasTags = taskData?.tags && taskData.tags.length > 0

    return (
      <div className={`${isEditAllowed ? 'cursor-pointer' : 'cursor-not-allowed'} flex flex-wrap gap-2`}>
        {hasTags ? taskData?.tags?.map((tag, i) => tag && <TagChip tag={tag} key={i} />) : <span className="text-muted-foreground text-sm italic">No tags</span>}
      </div>
    )
  }

  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const blurTags = () => {
    const current = taskData?.tags || []
    const next = tagValues.map((item) => item.value)
    const changed = current.length !== next.length || current.some((val) => !next.includes(val))

    if (changed && handleUpdate) {
      handleUpdate({ tags: next })
    }
  }

  useClickOutsideWithPortal(
    () => {
      setInternalEditing(null)

      if (internalEditing === 'tags') {
        blurTags()
      }
    },
    {
      refs: { triggerRef, popoverRef },
      enabled: !!internalEditing && allProperties.includes(internalEditing),
    },
  )

  useEscapeKey(
    () => {
      if (!internalEditing) {
        return
      }
      if (['assigneeID', 'due', 'status', 'taskKindName'].includes(internalEditing)) {
        setInternalEditing(null)
      }
      if (internalEditing === 'tags') {
        const options: Option[] = (taskData?.tags ?? []).filter((item): item is string => typeof item === 'string').map((item) => ({ value: item, label: item }))
        setValue(
          'tags',
          options.map((opt) => opt.value),
        )
        setInternalEditing(null)
      }
    },
    { enabled: !!internalEditing && allProperties.includes(internalEditing) },
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Assigner */}
      <div className="flex items-center gap-4">
        <CircleUser className="text-primary" size={16} />
        <p className="text-sm w-[120px]">Assigner</p>
        <p className="capitalize text-sm cursor-not-allowed">{taskData?.assigner?.displayName}</p>
      </div>

      {/* Assignee */}
      <div className="flex items-center gap-4">
        <UserRoundPen className="text-primary" size={16} />
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
          <HoverPencilWrapper showPencil={isEditAllowed} className={`${isEditAllowed ? 'cursor-pointer' : 'cursor-not-allowed'} capitalize text-sm pr-5`}>
            <p onDoubleClick={() => isEditAllowed && !isEditing && setInternalEditing('assigneeID')}>{taskData?.assignee?.displayName || 'Unassigned'}</p>
          </HoverPencilWrapper>
        )}
      </div>

      {/* Due Date */}
      <div className="flex items-center gap-4">
        <CalendarCheck2 className="text-primary" size={16} />
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
          <HoverPencilWrapper showPencil={isEditAllowed} className={`${isEditAllowed ? 'cursor-pointer' : 'cursor-not-allowed'} text-sm pr-5`}>
            <p onDoubleClick={() => isEditAllowed && !isEditing && setInternalEditing('due')}>{formatDate(taskData?.due) || 'No due date'}</p>
          </HoverPencilWrapper>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center gap-4">
        <Circle className="text-primary" size={16} />
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
          <HoverPencilWrapper showPencil={isEditAllowed} className={`${isEditAllowed ? 'cursor-pointer' : 'cursor-not-allowed'} flex items-center space-x-2 pr-5`}>
            <div onDoubleClick={() => isEditAllowed && !isEditing && setInternalEditing('status')}>{taskData?.status ? TaskStatusMapper[taskData.status] : 'No status'}</div>
          </HoverPencilWrapper>
        )}
      </div>

      {/* Task Type */}
      <div className="flex items-center gap-4">
        <Folder className="text-primary" size={16} />
        <p className="text-sm w-[120px]">Task Type</p>

        {isEditing || internalEditing === 'taskKindName' ? (
          <Controller
            name="taskKindName"
            control={control}
            render={({ field }) => (
              <div className="w-[250px]" ref={triggerRef}>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    handleUpdate?.({ taskKindName: value })
                    field.onChange(value)
                    setInternalEditing(null)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      <CustomTypeEnumValue value={field.value} options={taskKindOptions} placeholder="Select" />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent ref={popoverRef}>
                    {taskKindOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        <CustomTypeEnumOptionChip option={o} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formState.errors.taskKindName && <p className="text-red-500 text-sm">{formState.errors.taskKindName.message as string}</p>}
              </div>
            )}
          />
        ) : (
          <HoverPencilWrapper showPencil={isEditAllowed} className={`${isEditAllowed ? 'cursor-pointer' : 'cursor-not-allowed'} text-sm pr-5`}>
            <p onDoubleClick={() => isEditAllowed && !isEditing && setInternalEditing('taskKindName')}>{taskData?.taskKindName || 'No category'}</p>
          </HoverPencilWrapper>
        )}
      </div>

      {/* Tags */}
      <div className="flex items-center gap-4">
        <Tag className="text-primary" size={16} />
        <p className="text-sm w-[120px]">Tags</p>

        {isEditing || internalEditing === 'tags' ? (
          <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <div className="w-[250px]" ref={triggerRef}>
                <MultipleSelector
                  options={tagOptions}
                  hideClearAllButton
                  placeholder="Add tag..."
                  creatable
                  commandProps={{ className: 'w-full' }}
                  value={tagValues}
                  onChange={(selectedOptions) => {
                    const newTags = selectedOptions.map((opt) => opt.value)
                    field.onChange(newTags)
                  }}
                />
                {formState.errors.tags && <p className="text-red-500 text-sm">{formState.errors.tags.message}</p>}
              </div>
            )}
          />
        ) : (
          <HoverPencilWrapper showPencil={isEditAllowed} className={`${isEditAllowed ? 'cursor-pointer' : 'cursor-not-allowed'} pr-5`}>
            <div onDoubleClick={() => isEditAllowed && !isEditing && setInternalEditing('tags')}>{renderTags()}</div>
          </HoverPencilWrapper>
        )}
      </div>

      {/* Related Objects */}
      {!isEditing && (
        <div className="flex items-center gap-4">
          <BookText className="text-primary w-4 h-4 shrink-0" />
          <p className="text-sm w-[120px]">Related Objects</p>
          <RelatedObjects taskData={taskData} />
        </div>
      )}
    </div>
  )
}

export default Properties

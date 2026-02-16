import useClickOutsideWithPortal from '@/hooks/useClickOutsideWithPortal'
import useEscapeKey from '@/hooks/useEscapeKey'
import { ControlControlStatus, SubcontrolControlStatus, UpdateControlInput, UpdateSubcontrolInput } from '@repo/codegen/src/schema'
import type { ControlByIdNode } from '@/lib/graphql-hooks/control'
import type { SubcontrolByIdNode } from '@/lib/graphql-hooks/subcontrol'
import { useRef, useState } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { ControlIconMapper16, controlIconsMap, ControlStatusOptions } from '@/components/shared/enum-mapper/control-enum'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

export const Status = ({
  isEditing,
  data,
  handleUpdate,
  activeField,
  setActiveField,
  fieldId,
}: {
  isEditing: boolean
  data?: ControlByIdNode | SubcontrolByIdNode
  handleUpdate?: (val: UpdateControlInput | UpdateSubcontrolInput) => void
  activeField?: string | null
  setActiveField?: (field: string | null) => void
  fieldId?: string
}) => {
  const { control, getValues } = useFormContext()
  const [internalEditing, setInternalEditing] = useState(false)
  const resolvedFieldId = fieldId ?? 'status'
  const isControlled = activeField !== undefined && setActiveField !== undefined
  const isActive = isControlled ? activeField === resolvedFieldId : internalEditing

  const editing = isEditing || isActive

  const handleChange = (val: ControlControlStatus | SubcontrolControlStatus) => {
    if (getValues('status') === val) {
      if (isControlled) {
        setActiveField?.(null)
      } else {
        setInternalEditing(false)
      }
      return
    }
    if (!isEditing) {
      handleUpdate?.({ status: val })
    }

    if (isControlled) {
      setActiveField?.(null)
    } else {
      setInternalEditing(false)
    }
  }

  const handleClick = () => {
    if (!isEditing) {
      if (isControlled) {
        setActiveField?.(resolvedFieldId)
      } else {
        setInternalEditing(true)
      }
    }
  }

  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEscapeKey(() => {
    if (isActive) {
      if (isControlled) {
        setActiveField?.(null)
      } else {
        setInternalEditing(false)
      }
    }
  })

  useClickOutsideWithPortal(
    () => {
      if (isActive) {
        if (isControlled) {
          setActiveField?.(null)
        } else {
          setInternalEditing(false)
        }
      }
    },
    {
      refs: { triggerRef, popoverRef },
      enabled: isActive,
    },
  )

  return (
    <div className="grid grid-cols-[140px_1fr] items-start gap-x-3 border-b border-border pb-3 last:border-b-0">
      <div className="flex items-start gap-2">
        <div className="pt-0.5">{controlIconsMap.Status}</div>
        <div className="text-sm">Status</div>
      </div>
      <div ref={triggerRef} className="text-sm">
        {editing ? (
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(val: ControlControlStatus | SubcontrolControlStatus) => {
                  handleChange(val)
                  field.onChange(val)
                }}
              >
                <SelectTrigger>
                  <SelectValue>{field.value === 'NULL' ? '-' : getEnumLabel(field.value as ControlControlStatus)}</SelectValue>
                </SelectTrigger>
                <SelectContent ref={popoverRef}>
                  {ControlStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        ) : (
          <HoverPencilWrapper onPencilClick={handleClick}>
            <div className="flex items-center space-x-2 cursor-pointer" onDoubleClick={handleClick}>
              {ControlIconMapper16[data?.status as ControlControlStatus]}
              <p>{getEnumLabel(data?.status as ControlControlStatus) || '-'}</p>
            </div>
          </HoverPencilWrapper>
        )}
      </div>
    </div>
  )
}

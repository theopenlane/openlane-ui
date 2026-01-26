import useClickOutsideWithPortal from '@/hooks/useClickOutsideWithPortal'
import useEscapeKey from '@/hooks/useEscapeKey'
import { Control, ControlControlStatus, Subcontrol, SubcontrolControlStatus, UpdateControlInput, UpdateSubcontrolInput } from '@repo/codegen/src/schema'
import { useRef, useState } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { ControlIconMapper16, controlIconsMap, ControlStatusLabels, ControlStatusOptions } from '@/components/shared/enum-mapper/control-enum'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'

export const Status = ({ isEditing, data, handleUpdate }: { isEditing: boolean; data?: Control | Subcontrol; handleUpdate?: (val: UpdateControlInput | UpdateSubcontrolInput) => void }) => {
  const { control, getValues } = useFormContext()
  const [internalEditing, setInternalEditing] = useState(false)

  const editing = isEditing || internalEditing

  const handleChange = (val: ControlControlStatus | SubcontrolControlStatus) => {
    if (getValues('status') === val) {
      setInternalEditing(false)
      return
    }
    if (!isEditing) {
      handleUpdate?.({ status: val })
    }

    setInternalEditing(false)
  }

  const handleClick = () => {
    if (!isEditing) {
      setInternalEditing(true)
    }
  }

  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEscapeKey(() => {
    if (internalEditing) setInternalEditing(false)
  })

  useClickOutsideWithPortal(
    () => {
      if (internalEditing) setInternalEditing(false)
    },
    {
      refs: { triggerRef, popoverRef },
      enabled: internalEditing,
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
                  <SelectValue>{field.value === 'NULL' ? '-' : ControlStatusLabels[field.value as ControlControlStatus]}</SelectValue>
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
          <HoverPencilWrapper>
            <div className="flex items-center space-x-2 cursor-pointer" onDoubleClick={handleClick}>
              {ControlIconMapper16[data?.status as ControlControlStatus]}
              <p>{ControlStatusLabels[data?.status as ControlControlStatus] || '-'}</p>
            </div>
          </HoverPencilWrapper>
        )}
      </div>
    </div>
  )
}

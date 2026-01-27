import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'
import useClickOutsideWithPortal from '@/hooks/useClickOutsideWithPortal'
import useEscapeKey from '@/hooks/useEscapeKey'
import { UpdateControlInput, UpdateSubcontrolInput } from '@repo/codegen/src/schema'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { useRef, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { FolderIcon } from 'lucide-react'
import { controlIconsMap } from '@/components/shared/enum-mapper/control-enum'
import { CustomTypeEnumOptionChip, CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'
import { Option } from '@repo/ui/multiple-selector'

export const EditableSelect = ({
  label,
  name,
  isEditing,
  options,
  handleUpdate,
  isEditAllowed,
}: {
  label: string
  name: string
  isEditing: boolean
  options: (Option & { color?: string; description?: string })[]
  handleUpdate?: (val: UpdateControlInput | UpdateSubcontrolInput) => void
  isEditAllowed: boolean
}) => {
  const { control, getValues } = useFormContext()
  const [internalEditing, setInternalEditing] = useState(false)

  const handleClick = () => {
    if (!isEditing && isEditAllowed) setInternalEditing(true)
  }

  const handleChange = (value: string) => {
    if (getValues(name) === value) {
      setInternalEditing(false)
      return
    }
    if (!isEditing) {
      handleUpdate?.({ [name]: value })
      setInternalEditing(false)
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

  const isEditable = isEditAllowed && (isEditing || internalEditing)

  return (
    <div className="grid grid-cols-[140px_1fr] items-start gap-x-3 border-b border-border pb-3 last:border-b-0">
      <div className="flex items-start gap-2">
        <div className="pt-0.5">{controlIconsMap[label] ?? <FolderIcon size={16} className="text-brand" />}</div>
        <div className="text-sm">{label}</div>
      </div>
      <div ref={triggerRef} className="text-sm">
        {isEditable ? (
          <Controller
            control={control}
            name={name}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(val) => {
                  if (val) {
                    handleChange(val)
                    field.onChange(val)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${label.toLowerCase()}`}>
                    <CustomTypeEnumValue value={field.value} options={options} placeholder={`Select ${label.toLowerCase()}`} />
                  </SelectValue>
                </SelectTrigger>
                <SelectContent ref={popoverRef}>
                  {options.map((opt, i) => (
                    <SelectItem key={`${opt.value}-${i}`} value={opt.value}>
                      <CustomTypeEnumOptionChip option={opt} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        ) : (
          <HoverPencilWrapper showPencil={isEditAllowed} className={isEditAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}>
            <div onDoubleClick={isEditAllowed ? handleClick : undefined} className="flex items-center min-h-6">
              {(() => {
                const val = getValues(name)
                const option = options.find((o) => o.value === val)
                return option ? (
                  <CustomTypeEnumOptionChip
                    option={{
                      ...option,
                      description: option.description ?? '',
                    }}
                  />
                ) : (
                  <CustomTypeEnumValue value={val ?? ''} options={options} placeholder={'-'} />
                )
              })()}
            </div>
          </HoverPencilWrapper>
        )}
      </div>
    </div>
  )
}

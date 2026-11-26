import { usePersistFormField, type TPersistOptions } from '@/components/shared/crud-base/persist-form-field'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'
import useClickOutsideWithPortal from '@/hooks/useClickOutsideWithPortal'
import useEscapeKey from '@/hooks/useEscapeKey'
import { type UpdateControlInput, type UpdateSubcontrolInput } from '@repo/codegen/src/schema'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { useId, useRef, useState } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { FolderIcon } from 'lucide-react'
import { controlIconsMap } from '@/components/shared/enum-mapper/control-enum'
import { CustomTypeEnumOptionChip, CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'
import { type Option } from '@repo/ui/multiple-selector'
import { CreatableCustomTypeEnumSelect } from '@/components/shared/custom-type-enum-select/creatable-custom-type-enum-select'

type TControlClearKey = Extract<keyof UpdateControlInput & keyof UpdateSubcontrolInput, `clear${string}`>

const SelectedDisplay = ({ name, options }: { name: string; options: (Option & { color?: string; description?: string })[] }) => {
  const val = useWatch({ name })
  const option = options.find((o) => o.value === val)
  return option ? <CustomTypeEnumOptionChip option={{ ...option, description: option.description ?? '' }} /> : <CustomTypeEnumValue value={val ?? ''} options={options} placeholder="-" />
}

export const EditableSelect = ({
  label,
  name,
  isEditing,
  options,
  handleUpdate,
  isEditAllowed,
  activeField,
  setActiveField,
  fieldId,
  onCreateOption,
  clearKey,
}: {
  label: string
  name: string
  isEditing: boolean
  options: (Option & { color?: string; description?: string })[]
  handleUpdate?: (val: UpdateControlInput | UpdateSubcontrolInput, options?: TPersistOptions) => Promise<void>
  isEditAllowed: boolean
  activeField?: string | null
  setActiveField?: (field: string | null) => void
  fieldId?: string
  onCreateOption?: (value: string) => Promise<void>
  clearKey?: TControlClearKey
}) => {
  const { control, getValues } = useFormContext()
  const persistField = usePersistFormField()
  const [internalEditing, setInternalEditing] = useState(false)
  const resolvedFieldId = fieldId ?? name
  const isControlled = activeField !== undefined && setActiveField !== undefined
  const isActive = isControlled ? activeField === resolvedFieldId : internalEditing

  const handleClick = () => {
    if (!isEditing && isEditAllowed) {
      if (isControlled) {
        setActiveField?.(resolvedFieldId)
      } else {
        setInternalEditing(true)
      }
    }
  }

  const closeEditing = () => {
    if (isControlled) {
      setActiveField?.(null)
    } else {
      setInternalEditing(false)
    }
  }

  const handleChange = (value: string, onFieldChange?: (value: string) => void) => {
    if (getValues(name) === value) {
      closeEditing()
      return
    }
    closeEditing()
    if (!isEditing && handleUpdate) {
      const input = !value && clearKey ? { [clearKey]: true } : { [name]: value }
      void persistField(name, value, (options) => handleUpdate(input, options))
      return
    }
    onFieldChange?.(value)
  }

  const labelId = useId()
  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEscapeKey(() => {
    if (isActive) closeEditing()
  })

  useClickOutsideWithPortal(
    () => {
      if (isActive) closeEditing()
    },
    {
      refs: { triggerRef, popoverRef },
      enabled: isActive,
    },
  )

  const isEditable = isEditAllowed && (isEditing || isActive)

  return (
    <div className="grid grid-cols-[160px_1fr] items-start gap-x-3 narrow-rail:rail-row-stacked border-b border-border pb-3 last:border-b-0">
      <div className="flex items-start gap-2">
        <div className="pt-0.5">{controlIconsMap[label] ?? <FolderIcon size={16} />}</div>
        <div id={labelId} className="text-sm">
          {label}
        </div>
      </div>
      <div ref={triggerRef} className="text-sm">
        {isEditable ? (
          <Controller
            control={control}
            name={name}
            render={({ field }) =>
              onCreateOption ? (
                <CreatableCustomTypeEnumSelect
                  itemLabel={label.toLowerCase()}
                  value={field.value}
                  options={options}
                  onCreateOption={onCreateOption}
                  clearable={!!clearKey}
                  contentRef={popoverRef}
                  onValueChange={(val) => handleChange(val, field.onChange)}
                />
              ) : (
                <Select
                  value={field.value}
                  onValueChange={(val) => {
                    if (val) {
                      handleChange(val, field.onChange)
                    }
                  }}
                >
                  <SelectTrigger aria-labelledby={labelId}>
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
              )
            }
          />
        ) : (
          <HoverPencilWrapper showPencil={isEditAllowed} className={isEditAllowed ? 'cursor-pointer' : 'cursor-not-allowed'} onPencilClick={isEditAllowed ? handleClick : undefined}>
            <div onDoubleClick={isEditAllowed ? handleClick : undefined} className="flex items-center min-h-6">
              <SelectedDisplay name={name} options={options} />
            </div>
          </HoverPencilWrapper>
        )}
      </div>
    </div>
  )
}

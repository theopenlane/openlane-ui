import { usePersistFormField, type TPersistOptions } from '@/components/shared/crud-base/persist-form-field'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'
import { useNotification } from '@/hooks/useNotification'
import { type UpdateControlInput, type UpdateSubcontrolInput } from '@repo/codegen/src/schema'
import { Input } from '@repo/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { CopyIcon, FolderIcon, HelpCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

const REFERENCE_CLEAR_KEYS = {
  referenceID: 'clearReferenceID',
  auditorReferenceID: 'clearAuditorReferenceID',
  sourceName: 'clearSourceName',
  externalUUID: 'clearExternalUUID',
} as const

export const ReferenceProperty = ({
  name,
  isEditAllowed,
  label,
  icon,
  tooltip,
  value,
  isEditing,
  handleUpdate,
  activeField,
  setActiveField,
  fieldId,
}: {
  name: keyof typeof REFERENCE_CLEAR_KEYS
  isEditAllowed: boolean
  label: string
  icon?: React.ReactNode
  tooltip: string
  value?: string | null
  isEditing: boolean
  handleUpdate?: (val: UpdateControlInput | UpdateSubcontrolInput, options?: TPersistOptions) => Promise<void>
  activeField?: string | null
  setActiveField?: (field: string | null) => void
  fieldId?: string
}) => {
  const { control } = useFormContext()
  const persistField = usePersistFormField()
  const { successNotification } = useNotification()
  const [internalEditing, setInternalEditing] = useState(false)
  const resolvedFieldId = fieldId ?? name
  const isControlled = activeField !== undefined && setActiveField !== undefined
  const isActive = isControlled ? activeField === resolvedFieldId : internalEditing

  const inputRef = useRef<HTMLInputElement>(null)

  const editing = isEditAllowed && (isEditing || isActive)

  const handleClick = () => {
    if (!isEditing && isEditAllowed) {
      if (isControlled) {
        setActiveField?.(resolvedFieldId)
      } else {
        setInternalEditing(true)
      }
    }
  }

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isActive])

  const handleCopy = () => {
    if (!value) return
    navigator.clipboard.writeText(value)
    successNotification({ description: `${label} copied to clipboard` })
  }

  return (
    <div className="grid grid-cols-[160px_1fr] items-start gap-x-3 border-b border-border pb-3 last:border-b-0 text-sm">
      <div className="flex items-start gap-2">
        {icon || <FolderIcon size={14} className="text-brand mt-0.5 shrink-0" />}
        <div>
          <div className="flex gap-1 items-start">
            <span className="leading-none">{label}</span>
            <TooltipProvider disableHoverableContent>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle size={12} className="mb-1 ml-1 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="bottom">{tooltip}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
      <div className="text-sm w-full">
        {editing ? (
          <Controller
            control={control}
            name={name}
            render={({ field }) => (
              <Input
                {...field}
                ref={inputRef}
                className="w-full"
                placeholder={label}
                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                  if (isEditing) return

                  const trimmed = e.target.value.trim()
                  field.onChange(trimmed)
                  if (isControlled) {
                    setActiveField?.(null)
                  } else {
                    setInternalEditing(false)
                  }
                  if ((value ?? '') !== trimmed && handleUpdate) {
                    const input = trimmed ? { [name]: trimmed } : { [REFERENCE_CLEAR_KEYS[name]]: true }
                    void persistField(name, trimmed, (options) => handleUpdate(input, options))
                  }
                }}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    ;(e.target as HTMLInputElement).blur()
                  }
                }}
              />
            )}
          />
        ) : (
          <HoverPencilWrapper showPencil={isEditAllowed} onPencilClick={isEditAllowed ? handleClick : undefined}>
            {value ? (
              <div className="flex items-center gap-2 cursor-pointer" onDoubleClick={handleClick}>
                <span>{value}</span>
                <TooltipProvider disableHoverableContent>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCopy()
                        }}
                      >
                        <CopyIcon className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Copy</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ) : (
              <span className="cursor-pointer" onDoubleClick={handleClick}>
                -
              </span>
            )}
          </HoverPencilWrapper>
        )}
      </div>
    </div>
  )
}

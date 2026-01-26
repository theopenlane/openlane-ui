import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'
import { useNotification } from '@/hooks/useNotification'
import { UpdateControlInput, UpdateSubcontrolInput } from '@repo/codegen/src/schema'
import { Input } from '@repo/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { CopyIcon, FolderIcon, HelpCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

export const ReferenceProperty = ({
  name,
  label,
  tooltip,
  value,
  isEditing,
  handleUpdate,
}: {
  name: string
  label: string
  tooltip: string
  value?: string | null
  isEditing: boolean
  handleUpdate?: (val: UpdateControlInput | UpdateSubcontrolInput) => void
}) => {
  const { control } = useFormContext()
  const { successNotification } = useNotification()
  const [internalEditing, setInternalEditing] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  const editing = isEditing || internalEditing

  const handleClick = () => {
    if (!isEditing) {
      setInternalEditing(true)
    }
  }

  useEffect(() => {
    if (internalEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [internalEditing])

  const handleCopy = () => {
    if (!value) return
    navigator.clipboard.writeText(value)
    successNotification({ description: `${label} copied to clipboard` })
  }

  return (
    <div className="grid grid-cols-[140px_1fr] items-start gap-x-3 border-b border-border pb-3 last:border-b-0">
      <div className="flex items-start gap-2">
        <FolderIcon size={16} className="text-brand mt-0.5 shrink-0" />
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
                  if (value !== trimmed) {
                    handleUpdate?.({ [name]: trimmed })
                  }
                  field.onChange(trimmed)
                  setInternalEditing(false)
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
          <HoverPencilWrapper>
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

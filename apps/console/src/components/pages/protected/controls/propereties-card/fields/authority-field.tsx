import { Avatar } from '@/components/shared/avatar/avatar'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'
import { SearchableSingleSelect } from '@/components/shared/searchableSingleSelect/searchable-single-select'
import { type Group, type UpdateControlInput, type UpdateSubcontrolInput } from '@repo/codegen/src/schema'
import { type Option } from '@repo/ui/multiple-selector'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { useFormContext, Controller } from 'react-hook-form'
import { HelpCircle } from 'lucide-react'

export const AuthorityField = ({
  label,
  fieldKey,
  icon,
  tooltip,
  value,
  editingKey,
  isEditing,
  isEditAllowed,
  editingField,
  setEditingField,
  options,
  handleUpdate,
}: {
  label: string
  fieldKey: 'controlOwnerID' | 'delegateID'
  icon: React.ReactNode
  tooltip: string
  value: Group | undefined
  editingKey: string
  isEditing: boolean
  isEditAllowed: boolean
  editingField: string | null
  setEditingField: (field: string | null) => void
  options: Option[]
  handleUpdate?: (val: UpdateControlInput | UpdateSubcontrolInput) => void
}) => {
  const { control, getValues } = useFormContext()

  const displayName = value?.displayName || `No ${label}`
  const editing = isEditAllowed && (isEditing || editingField === editingKey)

  return (
    <div className="grid grid-cols-[140px_1fr] items-start gap-x-3 border-b border-border pb-3">
      <div className="flex items-start gap-2">
        <div className="pt-0.5">{icon}</div>
        {tooltip ? (
          <div>
            <div className="flex gap-1 items-start">
              <span className="leading-none text-sm">{label}</span>
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
        ) : (
          <div className="text-sm">{label}</div>
        )}
      </div>

      {editing ? (
        <Controller
          control={control}
          name={fieldKey}
          render={({ field }) => (
            <SearchableSingleSelect
              value={getValues(fieldKey) || value?.id}
              options={options}
              placeholder={`Select ${label.toLowerCase()}`}
              onChange={(val) => {
                if (!isEditing) handleUpdate?.({ [fieldKey]: val })
                setEditingField(null)
                field.onChange(val)
              }}
              onClose={() => setEditingField(null)}
              autoFocus
              className="w-full"
            />
          )}
        />
      ) : (
        <HoverPencilWrapper
          onPencilClick={() => {
            if (!isEditing && isEditAllowed) setEditingField(editingKey)
          }}
        >
          <TooltipProvider disableHoverableContent>
            <Tooltip>
              <TooltipTrigger
                type="button"
                className={`w-[200px] ${isEditAllowed ? 'cursor-pointer ' : 'cursor-not-allowed'} bg-unset `}
                onDoubleClick={() => {
                  if (!isEditing && isEditAllowed) setEditingField(editingKey)
                }}
              >
                <div className="flex gap-2 items-center">
                  <Avatar entity={value as Group} variant="small" />
                  <span className="truncate text-sm">{displayName}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">{displayName}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </HoverPencilWrapper>
      )}
    </div>
  )
}

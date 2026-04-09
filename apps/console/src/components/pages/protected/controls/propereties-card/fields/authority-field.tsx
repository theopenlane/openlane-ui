import { Avatar } from '@/components/shared/avatar/avatar'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'
import { SearchableSingleSelect } from '@/components/shared/searchableSingleSelect/searchable-single-select'
import { buildClearableUpdate } from '@/components/shared/searchableSingleSelect/clearable-update'
import { type Entity, type Group, type UpdateControlInput, type UpdateSubcontrolInput } from '@repo/codegen/src/schema'
import { type Option } from '@repo/ui/multiple-selector'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { useFormContext, Controller } from 'react-hook-form'
import { HelpCircle } from 'lucide-react'

const CONTROL_AUTHORITY_CLEAR_KEYS: Record<'controlOwnerID' | 'delegateID' | 'responsiblePartyID', 'clearControlOwner' | 'clearDelegate' | 'clearResponsibleParty'> = {
  controlOwnerID: 'clearControlOwner',
  delegateID: 'clearDelegate',
  responsiblePartyID: 'clearResponsibleParty',
}

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
  hideAvatar,
}: {
  label: string
  fieldKey: 'controlOwnerID' | 'delegateID' | 'responsiblePartyID'
  icon: React.ReactNode
  tooltip: string
  value: Group | Entity | undefined | null
  editingKey: string
  isEditing: boolean
  isEditAllowed: boolean
  editingField: string | null
  setEditingField: (field: string | null) => void
  options: Option[]
  handleUpdate?: (val: UpdateControlInput | UpdateSubcontrolInput) => void
  hideAvatar?: boolean
}) => {
  const { control } = useFormContext()

  const displayName = value?.displayName || `No ${label}`
  const editing = isEditAllowed && (isEditing || editingField === editingKey)

  return (
    <div className="grid grid-cols-[160px_1fr] items-start gap-x-3 border-b border-border pb-3">
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
              value={field.value ?? value?.id}
              options={options}
              placeholder={`Select ${label.toLowerCase()}`}
              clearable
              onChange={(val) => {
                if (!isEditing) handleUpdate?.(buildClearableUpdate(fieldKey, val, CONTROL_AUTHORITY_CLEAR_KEYS[fieldKey]) as UpdateControlInput | UpdateSubcontrolInput)
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
                className={`max-w-45 ${isEditAllowed ? 'cursor-pointer ' : 'cursor-not-allowed'} bg-unset `}
                onDoubleClick={() => {
                  if (!isEditing && isEditAllowed) setEditingField(editingKey)
                }}
              >
                <div className="flex gap-2 items-center">
                  {!hideAvatar && <Avatar entity={value} variant="small" />}
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

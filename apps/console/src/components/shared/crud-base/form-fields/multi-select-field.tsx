'use client'

import { useMemo, useRef } from 'react'
import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { useFormContext } from 'react-hook-form'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'
import MultipleSelector, { type Option } from '@repo/ui/multiple-selector'
import { Badge } from '@repo/ui/badge'
import { type InternalEditingType } from '../generic-sheet'
import useClickOutsideWithPortal from '@/hooks/useClickOutsideWithPortal'
import useEscapeKey from '@/hooks/useEscapeKey'
import { cn } from '@repo/ui/lib/utils'

interface MultiSelectFieldProps<TUpdateInput> {
  name: string
  label: string
  isEditing: boolean
  isEditAllowed: boolean
  isCreate?: boolean
  options: Option[]
  initialSelectedIds: string[]
  handleUpdate?: (input: TUpdateInput) => Promise<void>
  buildUpdateInput: (selectedIds: string[], initialIds: string[]) => TUpdateInput
  internalEditing: string | null
  setInternalEditing: InternalEditingType
  tooltipContent?: string
  icon?: React.ReactNode
  layout?: 'vertical' | 'horizontal'
  labelClassName?: string
}

export const MultiSelectField = <TUpdateInput,>({
  name,
  label,
  isEditing,
  isEditAllowed,
  isCreate = false,
  options,
  initialSelectedIds,
  handleUpdate,
  buildUpdateInput,
  internalEditing,
  setInternalEditing,
  tooltipContent,
  icon,
  layout = 'vertical',
  labelClassName,
}: MultiSelectFieldProps<TUpdateInput>) => {
  const { control, setValue, watch } = useFormContext()
  const triggerRef = useRef<HTMLDivElement>(null)

  const isFieldEditing = internalEditing === name
  const shouldShowInput = isCreate || isEditing || isFieldEditing

  const watchedIds = watch(name) as string[] | undefined
  const selectedIds = useMemo(() => watchedIds ?? [], [watchedIds])
  const selectedOptions = useMemo(() => options.filter((o) => selectedIds.includes(o.value)), [options, selectedIds])
  const displayOptions = useMemo(() => options.filter((o) => initialSelectedIds.includes(o.value)), [options, initialSelectedIds])

  const saveIfChanged = async () => {
    if (!isEditing && !isCreate && handleUpdate) {
      const changed = selectedIds.length !== initialSelectedIds.length || selectedIds.some((id) => !initialSelectedIds.includes(id))
      if (changed) {
        await handleUpdate(buildUpdateInput(selectedIds, initialSelectedIds))
      }
    }
  }

  useClickOutsideWithPortal(
    () => {
      if (isFieldEditing) {
        saveIfChanged()
        if (!isEditing) {
          setInternalEditing(null)
        }
      }
    },
    { refs: { triggerRef }, enabled: isFieldEditing },
  )

  useEscapeKey(
    () => {
      setValue(name, initialSelectedIds)
      setInternalEditing(null)
    },
    { enabled: isFieldEditing },
  )

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={layout === 'horizontal' ? 'flex items-center justify-between gap-4 space-y-0' : ''}>
          <div className="flex items-center gap-2 shrink-0">
            {icon}
            <FormLabel className={cn(layout === 'horizontal' && 'mb-0!', labelClassName)}>{label}</FormLabel>
            {tooltipContent && <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={tooltipContent} />}
          </div>
          <FormControl>
            {shouldShowInput ? (
              <div ref={triggerRef} className="w-full">
                <MultipleSelector
                  options={options}
                  hideClearAllButton
                  placeholder={`Select ${label.toLowerCase()}...`}
                  commandProps={{ className: 'w-full' }}
                  value={selectedOptions}
                  onChange={(selected) => field.onChange(selected.map((o) => o.value))}
                />
              </div>
            ) : (
              <div
                className={cn('flex flex-wrap gap-1 text-sm py-2 rounded-md cursor-pointer hover:bg-accent px-1 w-full min-h-9', layout === 'horizontal' && 'justify-end')}
                onClick={() => isEditAllowed && setInternalEditing(name)}
              >
                {displayOptions.length ? (
                  displayOptions.map((o) => (
                    <Badge key={o.value} variant="outline" className="w-fit">
                      {o.label}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </div>
            )}
          </FormControl>
        </FormItem>
      )}
    />
  )
}

import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'
import useClickOutsideWithPortal from '@/hooks/useClickOutsideWithPortal'
import useEscapeKey from '@/hooks/useEscapeKey'
import { useGetControlCategories, useGetControlSubcategories } from '@/lib/graphql-hooks/controls'
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover'
import { UpdateControlInput, UpdateSubcontrolInput } from '@repo/codegen/src/schema'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { cn } from '@repo/ui/lib/utils'
import { ChevronDown, PlusIcon } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useFormContext, Controller } from 'react-hook-form'

export const EditableSelectFromQuery = ({
  label,
  name,
  isEditing,
  icon,
  handleUpdate,
  isEditAllowed,
  iconAndLabelVisible = true,
  hasGap = true,
  gridColWidth = '140',
}: {
  label: string
  name: string
  isEditing: boolean
  icon: React.ReactNode
  handleUpdate?: (val: UpdateControlInput | UpdateSubcontrolInput) => void
  isEditAllowed: boolean
  iconAndLabelVisible?: boolean
  hasGap?: boolean
  gridColWidth?: string
}) => {
  const { control } = useFormContext()
  const [internalEditing, setInternalEditing] = useState(false)
  const isCategory = name === 'category'
  const { data: categoriesData } = useGetControlCategories({ enabled: isEditing || internalEditing })
  const { data: subcategoriesData } = useGetControlSubcategories({ enabled: isEditing || internalEditing })
  const { getValues } = useFormContext()
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)

  const rawOptions = useMemo(() => {
    return isCategory ? categoriesData?.controlCategories ?? [] : subcategoriesData?.controlSubcategories ?? []
  }, [isCategory, categoriesData, subcategoriesData])
  const initialOptions = useMemo(() => rawOptions.map((val) => ({ value: val, label: val })), [rawOptions])
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
    <div className={cn('grid items-start border-b border-border pb-3 last:border-b-0', hasGap && 'gap-x-3')} style={{ gridTemplateColumns: `${gridColWidth}px 1fr` }}>
      {iconAndLabelVisible && (
        <div className="flex items-start gap-2">
          <div className="pt-0.5">{icon}</div>
          <div className="text-sm">{label}</div>
        </div>
      )}

      <div className="text-sm min-w-0">
        <Controller
          name={name}
          control={control}
          render={({ field }) => {
            const editing = isEditAllowed && (isEditing || internalEditing)

            const handleChange = (val: string) => {
              if (getValues(name) === val) {
                setInternalEditing(false)
                return
              }
              if (!isEditing) {
                handleUpdate?.({ [name]: val })
              }

              field.onChange(val)
              setInternalEditing(false)
            }
            if (!editing) {
              return (
                <HoverPencilWrapper showPencil={isEditAllowed} className={isEditAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}>
                  <span
                    className="w-full block"
                    onDoubleClick={() => {
                      if (isEditAllowed) setInternalEditing(true)
                    }}
                  >
                    {field.value || '-'}
                  </span>
                </HoverPencilWrapper>
              )
            }

            const exists = initialOptions.some((opt) => opt.value === field.value)
            const allOptions = exists ? initialOptions : field.value ? [{ value: field.value, label: field.value }, ...initialOptions] : initialOptions
            const filtered = allOptions.filter((opt) => opt.label.toLowerCase().includes(input.toLowerCase()))
            const allowCustomApply = input.trim().length > 0 && !allOptions.some((opt) => opt.label.toLowerCase() === input.toLowerCase())

            const handleCustomApply = () => {
              handleChange(input.trim())
              setInput('')
              setOpen(false)
            }

            return (
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <div ref={triggerRef} className="flex text-sm h-10 px-3 justify-between border bg-input rounded-md items-center cursor-pointer">
                    <span className="truncate">{field.value || `Select ${label.toLowerCase()}`}</span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="p-0 bg-input border z-50">
                  <Command ref={popoverRef}>
                    <CommandInput
                      placeholder="Search..."
                      value={input}
                      onValueChange={setInput}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === 'Tab') && allowCustomApply) {
                          e.preventDefault()
                          handleCustomApply()
                        }
                      }}
                    />
                    <CommandList>
                      <CommandEmpty className="p-2 text-center">No results found.</CommandEmpty>
                      <CommandGroup>
                        {filtered.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.label}
                            onSelect={() => {
                              handleChange(option.value)
                              setInput('')
                              setOpen(false)
                            }}
                          >
                            {option.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                    {allowCustomApply && (
                      <div className="border-t px-2 py-1" onClick={handleCustomApply}>
                        <div className="w-full justify-start text-left text-sm flex items-center">
                          <PlusIcon className="mr-1 h-4 w-4" />
                          <span>Add&nbsp;</span>
                          <span className="truncate">“{input.trim()}”</span>
                        </div>
                      </div>
                    )}
                  </Command>
                </PopoverContent>
              </Popover>
            )
          }}
        />
      </div>
    </div>
  )
}

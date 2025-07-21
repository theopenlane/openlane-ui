'use client'

import React, { useMemo, useState } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Card } from '@repo/ui/cardpanel'
import { Input } from '@repo/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@repo/ui/select'
import { FolderIcon, BinocularsIcon, CopyIcon, PlusIcon, ChevronDown, FileBadge2, Settings2, FolderSymlink, ArrowUpFromDot, Shapes, HelpCircle } from 'lucide-react'
import { Control, ControlControlSource, ControlControlStatus, ControlControlType, Subcontrol, SubcontrolControlStatus, UpdateControlInput, UpdateSubcontrolInput } from '@repo/codegen/src/schema'
import MappedCategoriesDialog from './mapped-categories-dialog'
import Link from 'next/link'
import { ControlIconMapper16, ControlStatusLabels, ControlStatusOptions } from '@/components/shared/enum-mapper/control-enum'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { useNotification } from '@/hooks/useNotification'
import { useGetControlCategories, useGetControlSubcategories } from '@/lib/graphql-hooks/controls'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import StandardChip from '../standards/shared/standard-chip'

interface PropertiesCardProps {
  isEditing: boolean
  data?: Control | Subcontrol
  handleUpdate?: (val: UpdateControlInput | UpdateSubcontrolInput) => void
}

const sourceLabels: Record<ControlControlSource, string> = {
  FRAMEWORK: 'Framework',
  IMPORTED: 'Imported',
  TEMPLATE: 'Template',
  USER_DEFINED: 'User defined',
}

const typeLabels: Record<ControlControlType, string> = {
  CORRECTIVE: 'Corrective',
  DETECTIVE: 'Detective',
  DETERRENT: 'Deterrent',
  PREVENTATIVE: 'Preventative',
}

export const controlIconsMap: Record<string, React.ReactNode> = {
  Framework: <FileBadge2 size={16} className="text-brand" />,
  Control: <Settings2 size={16} className="text-brand" />,
  Category: <FolderIcon size={16} className="text-brand" />,
  Subcategory: <FolderIcon size={16} className="text-brand" />,
  Status: <BinocularsIcon size={16} className="text-brand" />,
  'Mapped categories': <FolderSymlink size={16} className="text-brand" />,
  Source: <ArrowUpFromDot size={16} className="text-brand" />,
  Type: <Shapes size={16} className="text-brand" />,
}

const PropertiesCard: React.FC<PropertiesCardProps> = ({ data, isEditing, handleUpdate }) => {
  const isSourceFramework = data?.source === ControlControlSource.FRAMEWORK
  const isEditAllowed = !isSourceFramework

  return (
    <Card className="p-4 bg-muted rounded-xl shadow-sm">
      <h3 className="text-lg font-medium mb-4">Properties</h3>
      <div className="space-y-3">
        {data && <Property value={data.referenceFramework || 'CUSTOM'} label="Framework"></Property>}
        {data?.__typename === 'Subcontrol' && <LinkedProperty label="Control" href={`/controls/${data.control.id}/`} value={data.control.refCode} icon={controlIconsMap.Control} />}
        <EditableSelectFromQuery label="Category" name="category" isEditAllowed={isEditAllowed} isEditing={isEditing} icon={controlIconsMap.Category} handleUpdate={handleUpdate} />
        <EditableSelectFromQuery label="Subcategory" name="subcategory" isEditAllowed={isEditAllowed} isEditing={isEditing} icon={controlIconsMap.Subcategory} handleUpdate={handleUpdate} />
        <Status data={data} isEditing={isEditing} handleUpdate={handleUpdate} />
        <MappedCategories isEditing={isEditing} data={data} />
        <EditableSelect
          label="Source"
          name="source"
          isEditing={isEditing}
          options={Object.values(ControlControlSource).filter((s) => s !== ControlControlSource.FRAMEWORK)}
          labels={sourceLabels}
          handleUpdate={handleUpdate}
          isEditAllowed={isEditAllowed}
        />
        <EditableSelect
          label="Type"
          name="controlType"
          isEditing={isEditing}
          isEditAllowed={isEditAllowed}
          options={Object.values(ControlControlType)}
          labels={typeLabels}
          handleUpdate={handleUpdate}
        />{' '}
        {isEditing || data?.referenceID ? (
          <ReferenceProperty name="referenceID" label="Ref ID" tooltip="Internal reference id of the control, used to map across internal systems" value={data?.referenceID} isEditing={isEditing} />
        ) : null}
        {isEditing || data?.auditorReferenceID ? (
          <ReferenceProperty
            name="auditorReferenceID"
            label="Auditor ID"
            tooltip="Reference ID used by auditor, may vary from defined reference code from standard"
            value={data?.auditorReferenceID}
            isEditing={isEditing}
          />
        ) : null}
      </div>
    </Card>
  )
}

export default PropertiesCard

const Property = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="grid grid-cols-[140px_1fr] items-start gap-x-3 border-b border-border pb-3 last:border-b-0">
    <div className="flex items-start gap-2">
      <div className="pt-0.5">{controlIconsMap[label]}</div>
      <div className="text-sm">{label}</div>
    </div>
    <div className="text-sm whitespace-pre-line">{label === 'Framework' ? <StandardChip referenceFramework={value ?? ''} /> : <div className="text-sm whitespace-pre-line">{value || '-'}</div>}</div>
  </div>
)

const LinkedProperty = ({ label, href, value, icon }: { label: string; href: string; value: string; icon: React.ReactNode }) => (
  <div className="grid grid-cols-[140px_1fr] items-start gap-x-3 border-b border-border pb-3 last:border-b-0">
    <div className="flex items-start gap-2">
      <div className="pt-0.5">{icon}</div>
      <div className="text-sm">{label}</div>
    </div>
    <div className="text-sm">
      <Link href={href} className="text-blue-500 hover:underline">
        {value}
      </Link>
    </div>
  </div>
)

const EditableSelect = ({
  label,
  name,
  isEditing,
  options,
  labels,
  handleUpdate,
  isEditAllowed,
}: {
  label: string
  name: string
  isEditing: boolean
  options: string[]
  labels: Record<string, string>
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

    handleUpdate?.({ [name]: value })
    setInternalEditing(false)
  }

  const isEditable = isEditAllowed && (isEditing || internalEditing)

  return (
    <div className="grid grid-cols-[140px_1fr] items-start gap-x-3 border-b border-border pb-3 last:border-b-0">
      <div className="flex items-start gap-2">
        <div className="pt-0.5">{controlIconsMap[label] ?? <FolderIcon size={16} className="text-brand" />}</div>
        <div className="text-sm">{label}</div>
      </div>
      <div className="text-sm">
        {isEditable ? (
          <Controller
            control={control}
            name={name}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(val) => {
                  field.onChange(val)
                  handleChange(val)
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={`Select ${label.toLowerCase()}`}>{labels[field.value] ?? ''}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {options.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {labels[opt]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        ) : (
          <div className={isEditAllowed ? 'cursor-pointer' : 'cursor-not-allowed'} onClick={handleClick}>
            {labels[getValues(name)] ?? '-'}
          </div>
        )}
      </div>
    </div>
  )
}

const ReferenceProperty = ({ name, label, tooltip, value, isEditing }: { name: string; label: string; tooltip: string; value?: string | null; isEditing: boolean }) => {
  const { control } = useFormContext()
  const { successNotification } = useNotification()

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
        {isEditing ? (
          <Controller control={control} name={name} render={({ field }) => <Input {...field} className="w-full" placeholder={label} />} />
        ) : value ? (
          <div className="flex items-center gap-2">
            <span>{value}</span>
            <TooltipProvider disableHoverableContent>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" onClick={handleCopy}>
                    <CopyIcon className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Copy</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ) : (
          '-'
        )}
      </div>
    </div>
  )
}

export const EditableSelectFromQuery = ({
  label,
  name,
  isEditing,
  icon,
  handleUpdate,
  isEditAllowed,
}: {
  label: string
  name: string
  isEditing: boolean
  icon: React.ReactNode
  handleUpdate?: (val: UpdateControlInput | UpdateSubcontrolInput) => void
  isEditAllowed: boolean
}) => {
  const { control } = useFormContext()
  const [internalEditing, setInternalEditing] = useState(false)

  const isCategory = name === 'category'
  const { data: categoriesData } = useGetControlCategories({ enabled: isEditing || internalEditing })
  const { data: subcategoriesData } = useGetControlSubcategories({ enabled: isEditing || internalEditing })

  const rawOptions = useMemo(() => {
    return isCategory ? categoriesData?.controlCategories ?? [] : subcategoriesData?.controlSubcategories ?? []
  }, [isCategory, categoriesData, subcategoriesData])
  const { getValues } = useFormContext()

  const initialOptions = useMemo(() => rawOptions.map((val) => ({ value: val, label: val })), [rawOptions])

  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)

  return (
    <div className="grid grid-cols-[140px_1fr] items-start gap-x-3 border-b border-border pb-3 last:border-b-0">
      <div className="flex items-start gap-2">
        <div className="pt-0.5">{icon}</div>
        <div className="text-sm">{label}</div>
      </div>
      <div className="text-sm">
        <Controller
          name={name}
          control={control}
          render={({ field }) => {
            const isEditable = isEditAllowed && (isEditing || internalEditing)

            const handleChange = (val: string) => {
              if (getValues(name) === val) {
                setInternalEditing(false)
                return
              }

              field.onChange(val)
              handleUpdate?.({ [name]: val })
              setInternalEditing(false)
            }
            if (!isEditable) {
              return (
                <span className={isEditAllowed ? 'cursor-pointer' : 'cursor-not-allowed'} onClick={() => setInternalEditing(true)}>
                  {field.value || '-'}
                </span>
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
                  <div className="w-[200px] flex text-sm h-10 px-3 justify-between border bg-input-background rounded-md items-center cursor-pointer">
                    <span className="truncate">{field.value || `Select ${label.toLowerCase()}`}</span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0 bg-input-background border z-50">
                  <Command>
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

const Status = ({ isEditing, data, handleUpdate }: { isEditing: boolean; data?: Control | Subcontrol; handleUpdate?: (val: UpdateControlInput | UpdateSubcontrolInput) => void }) => {
  const { control, getValues } = useFormContext()
  const [internalEditing, setInternalEditing] = useState(false)

  const isEditable = isEditing || internalEditing

  const handleChange = (val: ControlControlStatus | SubcontrolControlStatus) => {
    if (getValues('status') === val) {
      setInternalEditing(false)
      return
    }

    handleUpdate?.({ status: val })
    setInternalEditing(false)
  }

  const handleClick = () => {
    if (!isEditing) {
      setInternalEditing(true)
    }
  }

  return (
    <div className="grid grid-cols-[140px_1fr] items-start gap-x-3 border-b border-border pb-3 last:border-b-0">
      <div className="flex items-start gap-2">
        <div className="pt-0.5">{controlIconsMap.Status}</div>
        <div className="text-sm">Status</div>
      </div>
      <div className="text-sm">
        {isEditable ? (
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(val: ControlControlStatus | SubcontrolControlStatus) => {
                  field.onChange(val)
                  handleChange(val)
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue>{field.value === 'NULL' ? '-' : ControlStatusLabels[field.value as ControlControlStatus]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
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
          <div className="flex items-center space-x-2 cursor-pointer" onClick={handleClick}>
            {ControlIconMapper16[data?.status as ControlControlStatus]}
            <p>{ControlStatusLabels[data?.status as ControlControlStatus] || '-'}</p>
          </div>
        )}
      </div>
    </div>
  )
}

const MappedCategories = ({ isEditing, data }: { isEditing: boolean; data?: Control | Subcontrol }) => {
  const [internalEditing, setInternalEditing] = useState(false)
  const isEditable = isEditing || internalEditing

  const handleClick = () => {
    if (!isEditing) {
      setInternalEditing(true)
    }
  }

  if (isEditable) {
    return <MappedCategoriesDialog onClose={() => setInternalEditing(false)} />
  }

  return (
    <div onClick={handleClick} className="cursor-pointer">
      <Property label="Mapped categories" value={(data?.mappedCategories ?? []).join(',\n')} />
    </div>
  )
}

'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Card } from '@repo/ui/cardpanel'
import { Input } from '@repo/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@repo/ui/select'
import { FolderIcon, BinocularsIcon, CopyIcon, PlusIcon, ChevronDown, FileBadge2, Settings2, FolderSymlink, ArrowUpFromDot, Shapes, HelpCircle, CircleUser, CircleArrowRight } from 'lucide-react'
import { Control, ControlControlSource, ControlControlStatus, Subcontrol, SubcontrolControlStatus, UpdateControlInput, UpdateSubcontrolInput } from '@repo/codegen/src/schema'
import MappedCategoriesDialog from './mapped-categories-dialog'
import Link from 'next/link'
import { ControlIconMapper16, ControlStatusLabels, ControlStatusOptions } from '@/components/shared/enum-mapper/control-enum'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { useNotification } from '@/hooks/useNotification'
import { useGetControlCategories, useGetControlSubcategories } from '@/lib/graphql-hooks/controls'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import StandardChip from '../standards/shared/standard-chip'
import useEscapeKey from '@/hooks/useEscapeKey'
import useClickOutsideWithPortal from '@/hooks/useClickOutsideWithPortal'
import { SearchableSingleSelect } from '@/components/shared/searchableSingleSelect/searchable-single-select'
import { Group } from '@repo/codegen/src/schema'
import { Option } from '@repo/ui/multiple-selector'
import { Avatar } from '@/components/shared/avatar/avatar'
import { useGetAllGroups } from '@/lib/graphql-hooks/groups'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enums'
import { usePathname } from 'next/navigation'

interface PropertiesCardProps {
  isEditing: boolean
  data?: Control | Subcontrol
  handleUpdate?: (val: UpdateControlInput | UpdateSubcontrolInput) => void
  canEdit: boolean
}

const sourceLabels: Record<ControlControlSource, string> = {
  FRAMEWORK: 'Framework',
  IMPORTED: 'Imported',
  TEMPLATE: 'Template',
  USER_DEFINED: 'User defined',
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

const PropertiesCard: React.FC<PropertiesCardProps> = ({ data, isEditing, handleUpdate, canEdit }) => {
  const isSourceFramework = data?.source === ControlControlSource.FRAMEWORK
  const isEditAllowed = !isSourceFramework && canEdit
  const authorityEditAllowed = canEdit
  const path = usePathname()
  const isCreateSubcontrol = path.includes('/create-subcontrol')

  const [editingField, setEditingField] = useState<'owner' | 'delegate' | null>(null)
  const { data: groupsData } = useGetAllGroups({ where: {}, enabled: isEditing || !!editingField })
  const groups = groupsData?.groups?.edges?.map((edge) => edge?.node) || []

  const { enumOptions } = useGetCustomTypeEnums({
    where: {
      objectType: 'control',
      field: 'kind',
    },
  })

  const typeOptions = enumOptions.map((o) => o.value)
  const typeLabels = Object.fromEntries(enumOptions.map((o) => [o.value, o.label]))

  const options: Option[] = groups.map((g) => ({
    label: g?.displayName || g?.name || '',
    value: g?.id || '',
  }))

  return (
    <Card className="p-4 bg-card rounded-xl shadow-xs">
      <h3 className="text-lg font-medium mb-4">Properties</h3>
      <div className="space-y-3">
        <AuthorityField
          label="Owner"
          fieldKey="controlOwnerID"
          icon={<CircleUser size={16} className="text-brand" />}
          value={data?.controlOwner as Group}
          editingKey="owner"
          isEditing={isEditing}
          isEditAllowed={authorityEditAllowed}
          editingField={editingField}
          setEditingField={setEditingField}
          options={options}
          handleUpdate={handleUpdate}
        />
        <AuthorityField
          label="Delegate"
          fieldKey="delegateID"
          icon={<CircleArrowRight size={16} className="text-brand" />}
          value={data?.delegate as Group}
          editingKey="delegate"
          isEditing={isEditing}
          isEditAllowed={authorityEditAllowed}
          editingField={editingField}
          setEditingField={setEditingField}
          options={options}
          handleUpdate={handleUpdate}
        />

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
          name={data?.__typename === 'Subcontrol' || isCreateSubcontrol ? 'subcontrolKindName' : 'controlKindName'}
          isEditing={isEditing}
          isEditAllowed={isEditAllowed}
          options={typeOptions}
          labels={typeLabels}
          handleUpdate={handleUpdate}
        />
        {isEditing || data?.referenceID ? (
          <ReferenceProperty
            handleUpdate={handleUpdate}
            name="referenceID"
            label="Ref ID"
            tooltip="Internal reference id of the control, used to map across internal systems"
            value={data?.referenceID}
            isEditing={isEditing}
          />
        ) : null}
        {isEditing || data?.auditorReferenceID ? (
          <ReferenceProperty
            handleUpdate={handleUpdate}
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
  <div className="grid grid-cols-[140px_1fr] items-start gap-x-3 border-b border-border pb-3">
    <div className="flex items-start gap-2">
      <div className="pt-0.5">{controlIconsMap[label]}</div>
      <div className="text-sm">{label}</div>
    </div>
    <div className="text-sm whitespace-pre-line relative group">
      {label === 'Framework' ? (
        <div className="cursor-not-allowed">
          <StandardChip referenceFramework={value ?? ''} />
        </div>
      ) : (
        <HoverPencilWrapper>
          <div className="text-sm whitespace-pre-line">{value || '-'}</div>
        </HoverPencilWrapper>
      )}
    </div>
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
                  <SelectValue placeholder={`Select ${label.toLowerCase()}`}>{labels[field.value] ?? ''}</SelectValue>
                </SelectTrigger>
                <SelectContent ref={popoverRef}>
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
          <HoverPencilWrapper showPencil={isEditAllowed} className={isEditAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}>
            <div onDoubleClick={isEditAllowed ? handleClick : undefined}>{labels[getValues(name)] ?? '-'}</div>
          </HoverPencilWrapper>
        )}
      </div>
    </div>
  )
}

const ReferenceProperty = ({
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
  const { getValues } = useFormContext()
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)

  const rawOptions = useMemo(() => {
    return isCategory ? (categoriesData?.controlCategories ?? []) : (subcategoriesData?.controlSubcategories ?? [])
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
    <div className="grid grid-cols-[140px_1fr] items-start gap-x-3 border-b border-border pb-3 last:border-b-0">
      <div className="flex items-start gap-2">
        <div className="pt-0.5">{icon}</div>
        <div className="text-sm">{label}</div>
      </div>
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

const Status = ({ isEditing, data, handleUpdate }: { isEditing: boolean; data?: Control | Subcontrol; handleUpdate?: (val: UpdateControlInput | UpdateSubcontrolInput) => void }) => {
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

const MappedCategories = ({ isEditing, data }: { isEditing: boolean; data?: Control | Subcontrol }) => {
  const [internalEditing, setInternalEditing] = useState(false)
  const editing = isEditing || internalEditing

  const handleClick = () => {
    if (!isEditing) {
      setInternalEditing(true)
    }
  }

  useEscapeKey(() => {
    if (internalEditing) setInternalEditing(false)
  })

  if (editing) {
    return <MappedCategoriesDialog onClose={() => setInternalEditing(false)} />
  }

  return (
    <div onDoubleClick={handleClick} className="cursor-pointer ">
      <Property label="Mapped categories" value={(data?.mappedCategories ?? []).join(',\n')} />
    </div>
  )
}

const AuthorityField = ({
  label,
  fieldKey,
  icon,
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
  value: Group | undefined
  editingKey: 'owner' | 'delegate'
  isEditing: boolean
  isEditAllowed: boolean
  editingField: 'owner' | 'delegate' | null
  setEditingField: React.Dispatch<React.SetStateAction<'owner' | 'delegate' | null>>
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
        <div className="text-sm">{label}</div>
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
        <HoverPencilWrapper>
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

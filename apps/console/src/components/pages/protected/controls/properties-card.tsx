'use client'

import React, { useMemo, useState } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Card } from '@repo/ui/cardpanel'
import { Input } from '@repo/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@repo/ui/select'
import { FolderIcon, BinocularsIcon, CopyIcon, InfoIcon, PlusIcon, ChevronDown, FileBadge2, Settings2, FolderSymlink, ArrowUpFromDot, Shapes } from 'lucide-react'
import { Control, ControlControlSource, ControlControlStatus, ControlControlType, Subcontrol } from '@repo/codegen/src/schema'
import MappedCategoriesDialog from './mapped-categories-dialog'
import Link from 'next/link'
import { ControlIconMapper } from '@/components/shared/icon-enum/control-enum.tsx'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { useNotification } from '@/hooks/useNotification'
import { useGetControlCategories, useGetControlSubcategories } from '@/lib/graphql-hooks/controls'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'

interface PropertiesCardProps {
  isEditing: boolean
  data?: Control | Subcontrol
}

const statusLabels: Record<ControlControlStatus, string> = {
  APPROVED: 'Approved',
  ARCHIVED: 'Archived',
  CHANGES_REQUESTED: 'Changes requested',
  NEEDS_APPROVAL: 'Needs approval',
  NOT_IMPLEMENTED: 'Not implemented',
  PREPARING: 'Preparing',
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

const statusOptions = Object.values(ControlControlStatus)

const iconsMap: Record<string, React.ReactNode> = {
  Framework: <FileBadge2 size={16} className="text-brand" />,
  Control: <Settings2 size={16} className="text-brand" />,
  Category: <FolderIcon size={16} className="text-brand" />,
  Subcategory: <FolderIcon size={16} className="text-brand" />,
  Status: <BinocularsIcon size={16} className="text-brand" />,
  'Mapped categories': <FolderSymlink size={16} className="text-brand" />,
  Source: <ArrowUpFromDot size={16} className="text-brand" />,
  Type: <Shapes size={16} className="text-brand" />,
}

const PropertiesCard: React.FC<PropertiesCardProps> = ({ data, isEditing }) => {
  const { control } = useFormContext()

  const isSourceFramework = data?.source === ControlControlSource.FRAMEWORK
  const isEditAllowed = !isSourceFramework && isEditing

  return (
    <Card className="p-4 bg-muted rounded-xl shadow-sm">
      <h3 className="text-lg font-medium mb-4">Properties</h3>
      <div className="space-y-3">
        {data && <Property value={data.referenceFramework || 'CUSTOM'} label="Framework"></Property>}
        {data?.__typename === 'Subcontrol' && <LinkedProperty label="Control" href={`/controls/${data.control.id}/`} value={data.control.refCode} icon={iconsMap.Control} />}
        <EditableSelectFromQuery label="Category" name="category" isEditing={isEditAllowed} icon={iconsMap.Category} />
        <EditableSelectFromQuery label="Subcategory" name="subcategory" isEditing={isEditAllowed} icon={iconsMap.Subcategory} />
        <div className="grid grid-cols-[110px_1fr] items-start gap-x-3 border-b border-border pb-3 last:border-b-0">
          <div className="flex items-start gap-2">
            <div className="pt-0.5">{iconsMap.Status}</div>
            <div className="text-sm">Status</div>
          </div>
          <div className="text-sm">
            {isEditing ? (
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select status">{field.value === 'NULL' ? '-' : statusLabels[field.value as ControlControlStatus]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {statusLabels[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            ) : (
              <div className="flex items-center space-x-2">
                {ControlIconMapper[status as ControlControlStatus]}
                <p>{statusLabels[status as ControlControlStatus] || '-'}</p>
              </div>
            )}
          </div>
        </div>
        {isEditing ? <MappedCategoriesDialog /> : <Property label="Mapped categories" value={(data?.mappedCategories ?? []).join(',\n')} />}{' '}
        <EditableSelect
          label="Source"
          name="source"
          isEditing={isEditAllowed}
          options={Object.values(ControlControlSource).filter((source) => source !== ControlControlSource.FRAMEWORK)}
          labels={sourceLabels}
        />
        <EditableSelect label="Type" name="controlType" isEditing={isEditing} options={Object.values(ControlControlType)} labels={typeLabels} />
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
  <div className="grid grid-cols-[110px_1fr] items-start gap-x-3 border-b border-border pb-3 last:border-b-0">
    <div className="flex items-start gap-2">
      <div className="pt-0.5">{iconsMap[label]}</div>
      <div className="text-sm">{label}</div>
    </div>
    <div className="text-sm whitespace-pre-line">{value || '-'}</div>
  </div>
)

const LinkedProperty = ({ label, href, value, icon }: { label: string; href: string; value: string; icon: React.ReactNode }) => (
  <div className="grid grid-cols-[110px_1fr] items-start gap-x-3 border-b border-border pb-3 last:border-b-0">
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

const EditableSelect = ({ label, name, isEditing, options, labels }: { label: string; name: string; isEditing: boolean; options: string[]; labels: Record<string, string> }) => {
  const { control, getValues } = useFormContext()

  return (
    <div className="grid grid-cols-[110px_1fr] items-start gap-x-3 border-b border-border pb-3 last:border-b-0">
      <div className="flex items-start gap-2">
        <div className="pt-0.5">{iconsMap[label] ?? <FolderIcon size={16} className="text-brand" />}</div>
        <div className="text-sm">{label}</div>
      </div>
      <div className="text-sm">
        {isEditing ? (
          <Controller
            control={control}
            name={name}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={`Select ${label.toLowerCase()}`}>{labels[field.value as keyof typeof labels] ?? ''}</SelectValue>
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
          <span>{labels[getValues(name)] ?? '-'}</span>
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
    <div className="grid grid-cols-[110px_1fr] items-start gap-x-3 border-b border-border pb-3 last:border-b-0">
      <div className="flex items-start gap-2">
        <FolderIcon size={16} className="text-brand mt-0.5 shrink-0" />
        <div>
          <div className="text-sm">{label}</div>
          <TooltipProvider disableHoverableContent>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon size={14} className="mx-1 mt-1" />
              </TooltipTrigger>
              <TooltipContent side="bottom">{tooltip}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
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

export const EditableSelectFromQuery = ({ label, name, isEditing, icon }: { label: string; name: string; isEditing: boolean; icon: React.ReactNode }) => {
  const { control } = useFormContext()
  const isCategory = name === 'category'

  const { data: categoriesData } = useGetControlCategories({ enabled: isEditing && isCategory })
  const { data: subcategoriesData } = useGetControlSubcategories({ enabled: isEditing && !isCategory })

  const rawOptions = useMemo(() => {
    return isCategory ? categoriesData?.controlCategories ?? [] : subcategoriesData?.controlSubcategories ?? []
  }, [isCategory, categoriesData, subcategoriesData])

  const initialOptions = useMemo(() => rawOptions.map((val) => ({ value: val, label: val })), [rawOptions])

  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)

  return (
    <div className="grid grid-cols-[110px_1fr] items-start gap-x-3 border-b border-border pb-3 last:border-b-0">
      <div className="flex items-start gap-2">
        <div className="pt-0.5">{icon}</div>
        <div className="text-sm">{label}</div>
      </div>
      <div className="text-sm">
        <Controller
          name={name}
          control={control}
          render={({ field }) => {
            if (!isEditing) {
              return <span>{field.value || '-'}</span>
            }

            const exists = initialOptions.some((opt) => opt.value === field.value)
            const allOptions = exists ? initialOptions : field.value ? [{ value: field.value, label: field.value }, ...initialOptions] : initialOptions

            const filtered = allOptions.filter((opt) => opt.label.toLowerCase().includes(input.toLowerCase()))

            const allowCustomApply = input.trim().length > 0 && !allOptions.some((opt) => opt.label.toLowerCase() === input.toLowerCase())

            const handleCustomApply = () => {
              field.onChange(input.trim())
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
                              field.onChange(option.value)
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
                      <div className="border-t px-2 py-1 " onClick={handleCustomApply}>
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

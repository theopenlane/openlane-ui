'use client'

import React from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Card } from '@repo/ui/cardpanel'
import { Input } from '@repo/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@repo/ui/select'
import { FolderIcon, BinocularsIcon } from 'lucide-react'
import { Control, ControlControlStatus, SubcontrolControlStatus } from '@repo/codegen/src/schema'
import MappedCategoriesDialog from './mapped-categories-dialog'
import Link from 'next/link'

interface PropertiesCardProps {
  category?: string | null
  subcategory?: string | null
  status?: ControlControlStatus | SubcontrolControlStatus | null
  mappedCategories?: string[] | null
  isEditing: boolean
  controlData?: Control
}

const statusLabels: Record<ControlControlStatus, string> = {
  APPROVED: 'Approved',
  ARCHIVED: 'Archived',
  CHANGES_REQUESTED: 'Changes requested',
  NEEDS_APPROVAL: 'Needs approval',
  NOT_IMPLEMENTED: 'Not implemented',
  PREPARING: 'Preparing',
}

const statusOptions = Object.values(ControlControlStatus)

const iconsMap: Record<string, React.ReactNode> = {
  Category: <FolderIcon size={16} className="text-brand" />,
  Subcategory: <FolderIcon size={16} className="text-brand" />,
  Status: <BinocularsIcon size={16} className="text-brand" />,
  'Mapped categories': <FolderIcon size={16} className="text-brand" />,
}

const PropertiesCard: React.FC<PropertiesCardProps> = ({ category, subcategory, status, mappedCategories, isEditing, controlData }) => {
  const { control } = useFormContext()

  return (
    <Card className="p-4 bg-muted rounded-xl shadow-sm">
      <h3 className="text-lg font-medium mb-4">Properties</h3>
      <div className="space-y-3">
        {controlData && <LinkedProperty label="Control" href={`/controls/${controlData.id}`} value={controlData.refCode} icon={<FolderIcon size={16} className="text-brand" />} />}
        <EditableProperty label="Category" icon={iconsMap.Category} isEditing={isEditing} name="category" defaultValue={category} />
        <EditableProperty label="Subcategory" icon={iconsMap.Subcategory} isEditing={isEditing} name="subcategory" defaultValue={subcategory} />
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
                      {statusOptions
                        .filter((status) => status !== 'NOT_IMPLEMENTED')
                        .map((status) => (
                          <SelectItem key={status} value={status}>
                            {statusLabels[status]}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
            ) : (
              statusLabels[status as ControlControlStatus] || '-'
            )}
          </div>
        </div>
        {isEditing ? <MappedCategoriesDialog /> : <Property label="Mapped categories" value={(mappedCategories ?? []).join(',\n')} />}{' '}
      </div>
    </Card>
  )
}

export default PropertiesCard

const EditableProperty = ({ label, name, icon, isEditing, defaultValue }: { label: string; name: string; icon: React.ReactNode; isEditing: boolean; defaultValue?: string | null }) => {
  const { control } = useFormContext()
  return (
    <div className="grid grid-cols-[110px_1fr] items-start gap-x-3 border-b border-border pb-3 last:border-b-0">
      <div className="flex items-start gap-2">
        <div className="pt-0.5">{icon}</div>
        <div className="text-sm">{label}</div>
      </div>
      <div className="text-sm">
        {isEditing ? (
          <Controller control={control} name={name} defaultValue={defaultValue || ''} render={({ field }) => <Input {...field} className="w-[180px]" placeholder={`Enter ${label.toLowerCase()}`} />} />
        ) : (
          defaultValue || '-'
        )}
      </div>
    </div>
  )
}

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

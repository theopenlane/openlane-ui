'use client'

import React from 'react'
import { Card } from '@repo/ui/cardpanel'
import { FolderIcon, BinocularsIcon } from 'lucide-react'

interface PropertiesCardProps {
  category?: string | null
  subcategory?: string | null
  status?: string | null
  mappedCategories?: string[] | null
}

const iconsMap: Record<string, React.ReactNode> = {
  Category: <FolderIcon size={16} className="text-brand" />,
  Subcategory: <FolderIcon size={16} className="text-brand" />,
  Status: <BinocularsIcon size={16} className="text-brand" />,
  'Mapped categories': <FolderIcon size={16} className="text-brand" />,
}

const PropertiesCard: React.FC<PropertiesCardProps> = ({ category, subcategory, status, mappedCategories }) => {
  return (
    <Card className="p-4 bg-muted rounded-xl shadow-sm">
      <h3 className="text-lg font-medium mb-4">Properties</h3>
      <div className="space-y-3">
        <Property label="Category" value={category} />
        <Property label="Subcategory" value={subcategory} />
        <Property label="Status" value={status} />
        <Property label="Mapped categories" value={(mappedCategories ?? []).join(',\n')} />
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

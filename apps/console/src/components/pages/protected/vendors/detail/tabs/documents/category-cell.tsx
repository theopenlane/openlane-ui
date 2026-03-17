'use client'

import React, { useState } from 'react'
import { Input } from '@repo/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Button } from '@repo/ui/button'
import { Check, PencilIcon } from 'lucide-react'

const CATEGORY_OPTIONS = ['Contract', 'Certificate', 'Policy', 'Report', 'Invoice', 'SLA', 'NDA', 'SOC 2', 'ISO 27001', 'Other']

interface CategoryCellProps {
  fileId: string
  value: string | null | undefined
  onUpdate: (fileId: string, categoryType: string | null) => Promise<void>
  canEdit: boolean
}

const CategoryCell: React.FC<CategoryCellProps> = ({ fileId, value, onUpdate, canEdit }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [customValue, setCustomValue] = useState('')

  const handleSelect = async (newValue: string) => {
    if (newValue === '__custom__') return
    if (newValue === '__clear__') {
      await onUpdate(fileId, null)
    } else {
      await onUpdate(fileId, newValue)
    }
    setIsEditing(false)
  }

  const handleCustomSubmit = async () => {
    const trimmed = customValue.trim()
    if (trimmed) {
      await onUpdate(fileId, trimmed)
    }
    setCustomValue('')
    setIsEditing(false)
  }

  if (!canEdit) {
    return <span className="text-sm">{value || '-'}</span>
  }

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsEditing(true)
        }}
        className="flex items-center gap-1.5 group cursor-pointer bg-transparent text-sm"
      >
        <span>{value || '-'}</span>
        <PencilIcon size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    )
  }

  return (
    <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      <Popover open={isEditing} onOpenChange={setIsEditing}>
        <PopoverTrigger asChild>
          <button type="button" className="text-sm bg-transparent cursor-pointer">
            {value || '-'}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-1" align="start">
          <div className="flex flex-col gap-0.5">
            {CATEGORY_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                className="flex items-center justify-between px-2 py-1.5 text-sm rounded-sm hover:bg-accent cursor-pointer bg-transparent text-left w-full"
              >
                <span>{option}</span>
                {value === option && <Check size={14} className="text-success" />}
              </button>
            ))}
            <div className="border-t border-border mt-1 pt-1">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleCustomSubmit()
                }}
                className="flex items-center gap-1 px-1"
              >
                <Input placeholder="Custom..." value={customValue} onChange={(e) => setCustomValue(e.currentTarget.value)} className="h-7 text-xs" />
                <Button type="submit" size="sm" variant="secondary" className="h-7 px-2 shrink-0">
                  <Check size={12} />
                </Button>
              </form>
            </div>
            {value && (
              <button
                type="button"
                onClick={() => handleSelect('__clear__')}
                className="px-2 py-1.5 text-sm rounded-sm hover:bg-accent cursor-pointer bg-transparent text-left w-full text-muted-foreground"
              >
                Clear
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default CategoryCell

'use client'

import React from 'react'
import { cn } from '@repo/ui/lib/utils'
import { CircleCheck } from 'lucide-react'

interface ModeOptionProps {
  icon: React.ReactNode
  title: string
  description: string
  selected: boolean
  disabled?: boolean
  onSelect: () => void
}

export const ModeOption: React.FC<ModeOptionProps> = ({ icon, title, description, selected, disabled, onSelect }) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    disabled={disabled}
    onClick={onSelect}
    className={cn(
      'flex flex-col gap-1 rounded-md border p-3 text-left',
      selected ? 'border-brand bg-brand/10 ring-2 ring-brand' : 'border-border hover:bg-muted/50',
      disabled && 'cursor-not-allowed opacity-60',
    )}
  >
    <div className="flex items-center justify-between">
      {icon}
      {selected && <CircleCheck size={16} className="text-brand" />}
    </div>
    <span className="text-sm font-medium">{title}</span>
    <span className="text-xs text-muted-foreground">{description}</span>
  </button>
)

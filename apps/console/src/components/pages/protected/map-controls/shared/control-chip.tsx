import React from 'react'
import { Badge } from '@repo/ui/badge'
import Drag from '@/assets/Drag'
import { XIcon } from 'lucide-react'

export interface ControlChipProps {
  control: {
    id: string
    refCode: string
    shortName: string
  }
  draggable?: boolean
  onDragStart?: (e: React.DragEvent<HTMLSpanElement>) => void
  onDragEnd?: (e: React.DragEvent<HTMLSpanElement>) => void
  removable?: boolean
  onRemove?: (id: string) => void
  className?: string
}

const ControlChip: React.FC<ControlChipProps> = ({ control, draggable = false, onDragStart, onDragEnd, removable = false, onRemove, className = '' }) => {
  const baseClasses = 'bg-background-secondary flex gap-1 items-center'
  const dragClass = draggable ? 'cursor-grab' : ''

  return (
    <Badge
      variant="outline"
      className={`${baseClasses} ${dragClass} ${className}`}
      draggable={draggable}
      onDragStart={draggable ? onDragStart : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
    >
      {draggable && <Drag strokeWidth={1} className="text-border" />}

      <span className="text-text-informational">{control.shortName}</span>
      <span className="text-border">|</span>
      <span>{control.refCode}</span>

      {removable && onRemove && <XIcon size={12} className="cursor-pointer ml-1" onClick={() => onRemove(control.id)} />}
    </Badge>
  )
}

export default ControlChip

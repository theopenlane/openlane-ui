import React, { useState } from 'react'
import { Badge } from '@repo/ui/badge'
import Drag from '@/assets/Drag'
import { PencilLine, XIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { SlidersHorizontal, FileText, Folder, FolderPlus, ExternalLink } from 'lucide-react'
import Link from 'next/link'

import { useGetControlMinifiedById } from '@/lib/graphql-hooks/controls'
import { useGetSubcontrolMinifiedById } from '@/lib/graphql-hooks/subcontrol'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { MapControl } from '@/types'

export interface ControlChipProps {
  control: MapControl
  selected?: boolean
  draggable?: boolean
  onDragStart?: (e: React.DragEvent<HTMLSpanElement>) => void
  onDragEnd?: (e: React.DragEvent<HTMLSpanElement>) => void
  removable?: boolean
  onRemove?: (control: MapControl) => void
  className?: string
  onClick?: (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => void
  onContextMenu?: (e: React.MouseEvent<HTMLSpanElement>, control: MapControl) => void
}

const ControlChip: React.FC<ControlChipProps> = ({ control, draggable = false, onDragStart, onDragEnd, removable = false, onRemove, className = '', selected, onClick, onContextMenu }) => {
  const [tooltipOpen, setTooltipOpen] = useState(false)

  const baseClasses = 'bg-background-secondary flex gap-1 items-center'
  const dragClass = draggable ? 'cursor-grab' : ''
  const borderClass = selected ? 'border-brand ring-1 ring-brand' : 'border-border'

  if (!control) {
    return
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
        <TooltipTrigger asChild>
          <Badge
            onClick={onClick}
            variant="outline"
            className={`${baseClasses} ${dragClass} ${borderClass} ${className}`}
            draggable={draggable}
            onDragStart={draggable ? onDragStart : undefined}
            onDragEnd={draggable ? onDragEnd : undefined}
            onContextMenu={(e) => {
              e.preventDefault()
              onContextMenu?.(e, control)
            }}
          >
            {draggable && <Drag strokeWidth={1} className="text-border" />}
            <span className="text-text-informational">{control.referenceFramework || 'CUSTOM'}</span>
            <span className="text-border">|</span>
            <span>{control.refCode || ''}</span>
            {removable && onRemove && <XIcon size={12} className="cursor-pointer ml-1" onClick={() => onRemove(control)} />}
          </Badge>
        </TooltipTrigger>

        {tooltipOpen && (
          <TooltipContent side="top">
            <ControlTooltipContent control={control} />
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}

export default React.memo(ControlChip)

const ControlTooltipContent: React.FC<{ control: NonNullable<ControlChipProps['control']> }> = ({ control }) => {
  const { convertToReadOnly } = usePlateEditor()

  const { data: ctrlData, isLoading: ctrlLoading } = useGetControlMinifiedById(control.__typename === 'Control' ? control.id : undefined)
  const { data: subData, isLoading: subLoading } = useGetSubcontrolMinifiedById(control.__typename === 'Subcontrol' ? control.id : undefined)

  const loading = ctrlLoading || subLoading
  const details = ctrlData?.control || subData?.subcontrol

  const nameHref = control.__typename === 'Control' ? `/controls/${ctrlData?.control.id}` : `/controls/${subData?.subcontrol.control.id}/${subData?.subcontrol.id}`

  const standardHref = control.__typename === 'Subcontrol' ? `/standards/${ctrlData?.control.standardID}` : `/standards/${subData?.subcontrol.control.standardID}`

  if (loading) return <p className="text-xs">Loading details…</p>
  if (!details) return <p className="text-xs">No details available.</p>

  return (
    <div className="bg-background-secondary p-3 rounded-md text-xs min-w-[240px]">
      <div className="grid grid-cols-[auto_1fr] gap-y-2">
        <div className="flex items-center gap-1 border-b pb-2">
          <SlidersHorizontal size={12} />
          <span className="font-medium">Name</span>
        </div>
        <div className="w-full border-b">
          <Link href={nameHref} className="size-fit pl-3 pb-2 hover:underline flex items-center gap-1" target="_blank" rel="noopener">
            <span className="text-brand">{details.refCode}</span> <ExternalLink size={12} />
          </Link>
        </div>

        <div className="flex items-center gap-1 border-b pb-2">
          <FileText size={12} />
          <span className="font-medium">Standard</span>
        </div>
        <div className="w-full border-b">
          <Link href={standardHref} className=" size-fit pb-2 hover:underline flex items-center gap-1" target="_blank" rel="noopener">
            <span className="pl-3 text-brand ">{control.referenceFramework || 'CUSTOM'}</span> <ExternalLink size={12} />
          </Link>
        </div>

        <div className="flex items-center gap-1 border-b pb-2">
          <Folder size={12} />
          <span className="font-medium">Category</span>
        </div>
        <span className="pl-3 pb-2 border-b">{details.category}</span>

        <div className="flex items-center gap-1 border-b pb-2">
          <FolderPlus size={12} />
          <span className="font-medium">Subcategory</span>
        </div>
        <span className="pl-3 pb-2 border-b">{details.subcategory}</span>
      </div>

      <div className="flex flex-col pt-2">
        <div className="flex items-center gap-1">
          <PencilLine size={12} />
          <span className="font-medium">Description</span>
        </div>
        <div className="line-clamp-4 text-justify">{convertToReadOnly(details.description || '', 0)}</div>
      </div>
    </div>
  )
}

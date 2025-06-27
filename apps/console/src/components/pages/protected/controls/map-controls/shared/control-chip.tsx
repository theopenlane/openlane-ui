import React, { useState } from 'react'
import { Badge } from '@repo/ui/badge'
import Drag from '@/assets/Drag'
import { PencilLine, XIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { SlidersHorizontal, FileText, Folder, FolderPlus, ExternalLink } from 'lucide-react'
import Link from 'next/link'

import { DroppedControl } from '../map-controls-card'
import { useGetControlMinifiedById } from '@/lib/graphql-hooks/controls'
import { useGetSubcontrolMinifiedById } from '@/lib/graphql-hooks/subcontrol'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'

export interface ControlChipProps {
  control: {
    id: string
    refCode: string
    shortName: string
    type: 'control' | 'subcontrol'
  }
  draggable?: boolean
  onDragStart?: (e: React.DragEvent<HTMLSpanElement>) => void
  onDragEnd?: (e: React.DragEvent<HTMLSpanElement>) => void
  removable?: boolean
  onRemove?: (control: DroppedControl) => void
  className?: string
}

const ControlChip: React.FC<ControlChipProps> = ({ control, draggable = false, onDragStart, onDragEnd, removable = false, onRemove, className = '' }) => {
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const { convertToReadOnly } = usePlateEditor()

  const { data: ctrlData, isLoading: ctrlLoading } = useGetControlMinifiedById(control.type === 'control' ? control.id : undefined, tooltipOpen)
  const { data: subData, isLoading: subLoading } = useGetSubcontrolMinifiedById(control.type === 'subcontrol' ? control.id : undefined, tooltipOpen)

  const loading = ctrlLoading || subLoading
  const details = ctrlData?.control || subData?.subcontrol

  const nameHref = control.type === 'control' ? `/controls/${ctrlData?.control.id}` : `/controls/${subData?.subcontrol.control.id}/${subData?.subcontrol.id}`
  const standardHref = control.type === 'control' ? `/standards/${ctrlData?.control.standardID}` : `/standards/${subData?.subcontrol.control.standardID}`

  const baseClasses = 'bg-background-secondary flex gap-1 items-center'
  const dragClass = draggable ? 'cursor-grab' : ''

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
        <TooltipTrigger asChild>
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

            {removable && onRemove && <XIcon size={12} className="cursor-pointer ml-1" onClick={() => onRemove(control)} />}
          </Badge>
        </TooltipTrigger>

        <TooltipContent side="top" className="bg-background-secondary p-3 rounded-md shadow-lg text-xs min-w-[240px]">
          {loading ? (
            <p>Loading details…</p>
          ) : details ? (
            <div>
              <div className="grid grid-cols-[auto_1fr] gap-y-2">
                {/* Name */}
                <div className="flex items-center gap-1 border-b pb-2">
                  <SlidersHorizontal size={12} />
                  <span className="font-medium">Name</span>
                </div>
                <div className="w-full border-b">
                  <Link href={nameHref} className="size-fit pl-3 pb-2 hover:underline flex items-center gap-1" target="_blank" rel="noopener">
                    <span className="text-brand">{details.refCode}</span> <ExternalLink size={12} />
                  </Link>
                </div>

                {/* Standard */}
                <div className="flex items-center gap-1 border-b pb-2">
                  <FileText size={12} />
                  <span className="font-medium">Standard</span>
                </div>
                <div className="w-full border-b">
                  <Link href={standardHref} className=" size-fit pb-2 hover:underline flex items-center gap-1" target="_blank" rel="noopener">
                    <span className="pl-3 text-brand ">{control.shortName}</span> <ExternalLink size={12} />
                  </Link>
                </div>

                {/* Category */}
                <div className="flex items-center gap-1 border-b pb-2">
                  <Folder size={12} />
                  <span className="font-medium">Category</span>
                </div>
                <span className="pl-3 pb-2 border-b">{details.category}</span>

                {/* Subcategory */}
                <div className="flex items-center gap-1 border-b pb-2">
                  <FolderPlus size={12} />
                  <span className="font-medium">Subcategory</span>
                </div>
                <span className="pl-3 pb-2 border-b">{details.subcategory}</span>
              </div>

              {/* Description (spans both cols for the text) */}
              <div className="flex flex-col pt-2">
                <div className="flex items-center gap-1">
                  <PencilLine size={12} />
                  <span className="font-medium">Description</span>
                </div>
                <div className="line-clamp-4 text-justify">{convertToReadOnly(details.description || '', 0)}</div>
              </div>
            </div>
          ) : (
            <p>No details available.</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default ControlChip

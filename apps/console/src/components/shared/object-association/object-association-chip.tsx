import React, { useState } from 'react'
import { ExternalLink, PencilLine, SlidersHorizontal } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import ObjectsChip from '../objects-chip/objects-chip'

export interface ObjectChipProps {
  object: {
    id: string
    refCode?: string | null
    displayName?: string | null
    name?: string | null
    title?: string | null
    description?: string | null
    desiredOutcome?: string | null
    details?: string | null
    summary?: string | null
    link: string
  }
  kind?: string
  removable?: boolean
  onRemove?: () => void
  onItemClick?: (id: string, kind: string) => void
}

const ObjectAssociationChip: React.FC<ObjectChipProps> = ({ object, kind, removable, onRemove, onItemClick }) => {
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const { convertToReadOnly } = usePlateEditor()

  const displayText = object.refCode || object.displayName || object.name || object.title || ''
  const displayDescription = object.summary || object.details || object.description || object.desiredOutcome || ''
  const objectKind = kind || ''
  const handleNavigate = () => {
    if (onItemClick) {
      onItemClick(object.id, objectKind)
    } else {
      window.open(object.link, '_blank')
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
        <TooltipTrigger
          className="bg-transparent"
          onClick={(e) => {
            e.preventDefault()
            handleNavigate()
          }}
        >
          <ObjectsChip name={displayText} objectType={objectKind} removable={removable} onRemove={onRemove ? () => onRemove() : undefined} />
        </TooltipTrigger>

        <TooltipContent side="top" className="p-3 rounded-md shadow-lg text-xs min-w-60">
          <div>
            <div className="grid grid-cols-[auto_1fr] gap-y-2">
              <div className="flex items-center gap-1 border-b pb-2">
                <SlidersHorizontal size={12} />
                <span className="font-medium">Name</span>
              </div>
              <div className="w-full border-b pb-2">
                <span className="text-brand pl-3 cursor-pointer hover:underline inline-flex items-center gap-1" onClick={handleNavigate}>
                  {displayText}
                  <ExternalLink size={12} />
                </span>
              </div>
            </div>

            <div className="flex flex-col pt-2">
              <div className="flex items-center gap-1">
                <PencilLine size={12} />
                <span className="font-medium">Description</span>
              </div>
              <div className="max-w-xs text-justify line-clamp-4">{displayDescription ? convertToReadOnly(displayDescription) : 'No description available'}</div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default ObjectAssociationChip

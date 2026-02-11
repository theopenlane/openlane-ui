import React, { useState } from 'react'
import { PencilLine, SlidersHorizontal } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { useRouter } from 'next/navigation'
import ObjectsChip from '../objects-chip/objects-chip'

export interface ObjectChipProps {
  object: {
    id: string
    refCode?: string | null
    name?: string | null
    title?: string | null
    description?: string | null
    details?: string | null
    summary?: string | null
    link: string
  }
  kind?: string
  removable?: boolean
  onRemove?: () => void
}

const ObjectAssociationChip: React.FC<ObjectChipProps> = ({ object, kind, removable, onRemove }) => {
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const { convertToReadOnly } = usePlateEditor()
  const router = useRouter()

  const displayText = object.refCode || object.name || object.title || ''
  const displayDescription = object.summary || object.description || object.details || ''
  const objectKind = kind || ''
  const handleNavigate = () => {
    router.push(object.link)
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
        <TooltipTrigger className="bg-transparent" onClick={(e) => e.preventDefault()}>
          <ObjectsChip name={displayText} objectType={objectKind} removable={removable} onRemove={onRemove ? () => onRemove() : undefined} />
        </TooltipTrigger>

        <TooltipContent side="top" className="bg-secondary p-3 rounded-md shadow-lg text-xs min-w-[240px]">
          <div>
            <div className="grid grid-cols-[auto_1fr] gap-y-2">
              <div className="flex items-center gap-1 border-b pb-2">
                <SlidersHorizontal size={12} />
                <span className="font-medium">Name</span>
              </div>
              <div className="w-full border-b pb-2">
                <span className="text-brand pl-3 cursor-pointer" onClick={handleNavigate}>
                  {displayText}
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

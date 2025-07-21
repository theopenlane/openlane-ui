import React, { useState } from 'react'
import { Badge } from '@repo/ui/badge'
import { PencilLine, SlidersHorizontal } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { useRouter } from 'next/navigation'

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
  className?: string
}

const ObjectAssociationChip: React.FC<ObjectChipProps> = ({ object, className = '' }) => {
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const { convertToReadOnly } = usePlateEditor()
  const router = useRouter()

  const displayText = object.refCode || object.name || object.title || ''
  const displayDescription = object.summary || object.description || object.details || ''

  const handleNavigate = () => {
    router.push(object.link)
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`bg-background-secondary flex gap-1 items-center ${className}`}>
            <span>{displayText}</span>
          </Badge>
        </TooltipTrigger>

        <TooltipContent side="top" className="bg-background-secondary p-3 rounded-md shadow-lg text-xs min-w-[240px]">
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
              <div className="line-clamp-4 text-justify">{displayDescription ? convertToReadOnly(displayDescription) : 'No description available'}</div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default ObjectAssociationChip

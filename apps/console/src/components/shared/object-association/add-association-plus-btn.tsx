import { Plus } from 'lucide-react'
import React, { useState } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { Button } from '@repo/ui/button'

const AddAssociationPlusBtn = ({ ref, ...props }: React.ButtonHTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) => {
  const [tooltipOpen, setTooltipOpen] = useState(false)

  return (
    <TooltipProvider delayDuration={100} disableHoverableContent>
      <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
        <TooltipTrigger asChild>
          <div ref={ref} {...props}>
            <Button type="button" variant="secondary" aria-label="Add Association objects">
              <Plus size={14} />
            </Button>
          </div>
        </TooltipTrigger>
        {tooltipOpen && <TooltipContent>Add Object Association</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  )
}

export default AddAssociationPlusBtn

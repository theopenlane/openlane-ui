import { Plus } from 'lucide-react'
import React, { useState } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { Button } from '@repo/ui/button'

const AddAssociationPlusBtn = React.forwardRef<HTMLDivElement, React.ButtonHTMLAttributes<HTMLDivElement>>((props, ref) => {
  const [tooltipOpen, setTooltipOpen] = useState(false)

  return (
    <TooltipProvider delayDuration={100} disableHoverableContent>
      <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
        <TooltipTrigger asChild>
          <div ref={ref} {...props}>
            <Button variant="secondary" aria-label="Add Association objects">
              <Plus size={14} />
            </Button>
          </div>
        </TooltipTrigger>
        {tooltipOpen && <TooltipContent>Add Object Association</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  )
})

AddAssociationPlusBtn.displayName = 'AddAssociationPlusBtn'
export default AddAssociationPlusBtn

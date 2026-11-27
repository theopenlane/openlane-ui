import { Plus } from 'lucide-react'
import React, { useState } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@theopenlane/ui/tooltip'
import { Button, type ButtonProps } from '@theopenlane/ui/button'

const AddAssociationPlusBtn = ({ ref, ...props }: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) => {
  const [tooltipOpen, setTooltipOpen] = useState(false)

  return (
    <TooltipProvider delayDuration={100} disableHoverableContent>
      <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
        <TooltipTrigger asChild>
          <Button ref={ref} type="button" variant="secondary" aria-label="Add Association objects" {...props}>
            <Plus size={14} />
          </Button>
        </TooltipTrigger>
        {tooltipOpen && <TooltipContent>Add Object Association</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  )
}

export default AddAssociationPlusBtn

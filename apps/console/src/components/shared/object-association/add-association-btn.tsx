import { Plus } from 'lucide-react'
import React, { useState } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import LinkedBox from '@/assets/LinkedBox'

const AddAssociationBtn = React.forwardRef<HTMLDivElement, React.ButtonHTMLAttributes<HTMLDivElement>>((props, ref) => {
  const [tooltipOpen, setTooltipOpen] = useState(false)

  return (
    <TooltipProvider delayDuration={100} disableHoverableContent>
      <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
        <TooltipTrigger asChild>
          <div aria-label="Add Association objects" ref={ref} {...props} className={`h-8 px-1 border rounded-md cursor-pointer`}>
            <div className="flex items-center h-full">
              <LinkedBox className="mr-1" />
              <div className="border-r h-full"></div>
              <Plus size={15} className="ml-1" />
            </div>
          </div>
        </TooltipTrigger>
        {tooltipOpen && <TooltipContent>Add Object Association</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  )
})

AddAssociationBtn.displayName = 'AddAssociationBtn'
export default AddAssociationBtn

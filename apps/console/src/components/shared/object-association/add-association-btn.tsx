import { Plus } from 'lucide-react'
import React, { useState } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import LinkedBox from '@/assets/LinkedBox'

interface AddAssociationBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  disabled?: boolean
}

const AddAssociationBtn = React.forwardRef<HTMLButtonElement, AddAssociationBtnProps>(({ disabled = false, onClick, className, ...props }, ref) => {
  const [tooltipOpen, setTooltipOpen] = useState(false)

  return (
    <TooltipProvider delayDuration={100} disableHoverableContent>
      <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
        <TooltipTrigger asChild>
          <button
            ref={ref}
            aria-label="Add Association objects"
            disabled={disabled}
            onClick={onClick}
            className={`
                h-8 px-1 border rounded-md flex items-center select-none transition-all
                ${disabled ? 'cursor-not-allowed opacity-50 bg-muted' : 'cursor-pointer hover:bg-background-secondary'}
                ${className ?? ''}
              `}
            {...props}
          >
            <LinkedBox className="mr-1" />
            <div className="border-r h-full" />
            <Plus size={15} className="ml-1" />
          </button>
        </TooltipTrigger>

        {tooltipOpen && <TooltipContent>{disabled ? 'Action unavailable' : 'Add Object Association'}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  )
})

AddAssociationBtn.displayName = 'AddAssociationBtn'
export default AddAssociationBtn

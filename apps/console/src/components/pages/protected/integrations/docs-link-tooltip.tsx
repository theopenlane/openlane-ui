import React from 'react'
import { SquareArrowOutUpRight } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'

type DocsLinkTooltipProps = {
  href: string
  label: string
}

const DocsLinkTooltip = ({ href, label }: DocsLinkTooltipProps) => {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <a href={href} target="_blank" rel="noreferrer" aria-label={`Open ${label} documentation`} className="absolute right-0 top-0">
            <span className="inline-flex h-6 w-6 items-center justify-center text-muted-foreground transition-colors hover:text-foreground">
              <SquareArrowOutUpRight size={12} />
            </span>
          </a>
        </TooltipTrigger>
        <TooltipContent side="top" align="end" sideOffset={8}>
          Open documentation
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default DocsLinkTooltip

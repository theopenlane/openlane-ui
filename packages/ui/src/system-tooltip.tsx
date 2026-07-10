import React from 'react'
import { cn } from '../lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

type TProps = {
  icon: React.ReactNode
  content: React.ReactNode | string
  disableHoverableContent?: boolean
  side?: 'bottom' | 'top' | 'right' | 'left' | undefined
  className?: string
}

const SystemTooltip: React.FC<TProps> = (props: TProps) => {
  return (
    <TooltipProvider disableHoverableContent={props.disableHoverableContent === undefined ? true : props.disableHoverableContent}>
      <Tooltip>
        <TooltipTrigger type="button" asChild className={cn('bg-unset', props.className)}>
          {props.icon}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs whitespace-normal break-words" align="start" side={props.side || 'bottom'}>
          {typeof props.content === 'string' ? <p>{props.content}</p> : props.content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

SystemTooltip.displayName = 'SystemTooltip'

export { SystemTooltip }

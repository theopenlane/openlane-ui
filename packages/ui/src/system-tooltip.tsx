import React from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

type TProps = {
  icon: React.ReactNode
  content: React.ReactNode | string
  disableHoverableContent?: boolean
}

const SystemTooltip: React.FC<TProps> = (props: TProps) => {
  return (
    <TooltipProvider disableHoverableContent={props.disableHoverableContent === undefined ? true : props.disableHoverableContent}>
      <Tooltip>
        <TooltipTrigger type="button">{props.icon}</TooltipTrigger>
        <TooltipContent side="right">{typeof props.content === 'string' ? <p>{props.content}</p> : props.content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

SystemTooltip.displayName = 'SystemTooltip'

export { SystemTooltip }

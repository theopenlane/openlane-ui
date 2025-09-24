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
        <TooltipTrigger type="button" className="bg-unset">
          {props.icon}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs whitespace-normal break-words" align="start" side="bottom">
          {typeof props.content === 'string' ? <p>{props.content}</p> : props.content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

SystemTooltip.displayName = 'SystemTooltip'

export { SystemTooltip }

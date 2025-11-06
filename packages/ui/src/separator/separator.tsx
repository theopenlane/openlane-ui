import { HTMLAttributes } from 'react'
import { separatorStyles, type SeparatorVariants } from './separator.styles'
import { cn } from '../../lib/utils'

export interface SeparatorProps extends SeparatorVariants, HTMLAttributes<HTMLDivElement> {
  label?: string
  login?: boolean
  separatorClass?: string
  vertical?: boolean
}

export const Separator = ({ label, programStep, full, className, login, separatorClass, vertical: isVertical = false, ...rest }: SeparatorProps) => {
  const { base, horizontal, line, text, vertical } = separatorStyles({ programStep, full, login })

  if (label) {
    return (
      <div className={cn(base(), className)} {...rest}>
        <div className={line()} />
        <div className={text()}>{label}</div>
        <div className={line()} />
      </div>
    )
  }

  return (
    <div className={cn(base(), className)} {...rest}>
      {isVertical ? <div className={cn(vertical(), separatorClass)}></div> : <div className={cn(horizontal(), className, separatorClass)}></div>}
    </div>
  )
}

export { separatorStyles }

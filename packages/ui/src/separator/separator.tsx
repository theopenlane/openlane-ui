import { HTMLAttributes } from 'react'
import { separatorStyles, type SeparatorVariants } from './separator.styles'
import { cn } from '../../lib/utils'

export interface SeparatorProps extends SeparatorVariants, HTMLAttributes<HTMLDivElement> {
  label?: string
  login?: boolean
  separatorClass?: string
}

export const Separator = ({ label, programStep, full, className, login, separatorClass, ...rest }: SeparatorProps) => {
  const { base, vertical, line, text } = separatorStyles({ programStep, full, login })

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
      <div className={cn(vertical(), className, separatorClass)}></div>
    </div>
  )
}

export { separatorStyles }

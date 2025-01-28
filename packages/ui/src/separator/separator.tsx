import { HTMLAttributes } from 'react'
import { separatorStyles, type SeparatorVariants } from './separator.styles'
import { cn } from '../../lib/utils'

export interface SeparatorProps extends SeparatorVariants, HTMLAttributes<HTMLDivElement> {
  label?: string
}

export const Separator = ({ label, ...rest }: SeparatorProps) => {
  const { base, line, text } = separatorStyles()

  if (label) {
    return (
      <div className={cn(base(), rest.className)}>
        <div className={line()} />
        <div className={text()}>{label}</div>
        <div className={line()} />
      </div>
    )
  }
  return (
    <div className={base()}>
      <div className={line()}></div>
    </div>
  )
}

export { separatorStyles }

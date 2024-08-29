import { HTMLAttributes, ReactNode } from 'react'
import { tagStyles, type TagVariants } from './tag.styles'

export interface TagProps extends TagVariants, HTMLAttributes<HTMLDivElement> {
  children: ReactNode | string
}

export const Tag = ({ children, ...rest }: TagProps) => {
  const { base } = tagStyles()

  return (
    <div className={base()} {...rest}>
      {children}
    </div>
  )
}

export { tagStyles }

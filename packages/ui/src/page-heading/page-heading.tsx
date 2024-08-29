import React from 'react'
import { cn } from '../../lib/utils'
import {
  pageHeadingStyles,
  type PageHeadingVariants,
} from './page-heading.styles'

interface PageHeadingProps extends PageHeadingVariants {
  className?: string
  heading: React.ReactNode | string
  eyebrow?: React.ReactNode | string
}

const PageHeading: React.FC<PageHeadingProps> = ({
  heading,
  eyebrow,
  className,
}) => {
  const styles = pageHeadingStyles()
  return (
    <div className={cn(styles.wrapper(), className)}>
      {eyebrow && <span className={styles.eyebrow()}>{eyebrow}</span>}
      <h2 className={styles.heading()}>{heading}</h2>
    </div>
  )
}

export { PageHeading }

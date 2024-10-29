import React from 'react'
import { cn } from '../../lib/utils'
import {
  paragraphStyles,
  type ParagraphVariants,
} from './paragraph.styles'

interface ParagraphProps extends ParagraphVariants {
  className?: string
  paragraph?: React.ReactNode | string
}

const Paragraph: React.FC<ParagraphProps> = ({
  paragraph,
  className,
}) => {
  const styles = paragraphStyles()
  return (
    <div className={cn(styles.wrapper(), className)}>
      <p className={styles.paragraph()}>{paragraph}</p>
    </div>
  )
}

export { Paragraph }

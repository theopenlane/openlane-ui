import React, { ReactNode } from 'react'
import { cn } from '../../lib/utils'
import {
  panelHeaderStyles,
  panelStyles,
  type PanelVariants,
  type PanelHeaderVariants,
} from './panel.styles'
import { TriangleAlert } from 'lucide-react'

interface PanelProps extends PanelVariants {
  className?: string
  children: ReactNode
}

interface PanelHeaderProps extends PanelHeaderVariants {
  className?: string
  heading: React.ReactNode
  subheading?: React.ReactNode
}

const Panel: React.FC<PanelProps> = ({
  gap,
  align,
  justify,
  textAlign,
  destructive,
  className,
  children,
}) => {
  const styles = panelStyles({ gap, align, justify, textAlign, destructive })
  const inner = destructive ? (
    <div className={styles.iconRow()}>
      <div className={styles.icon()}>
        <TriangleAlert strokeWidth={1.5} />
      </div>
      <div className={styles.contentColumn()}>{children}</div>
    </div>
  ) : (
    children
  )
  return <div className={cn(styles.panel(), className)}>{inner}</div>
}

const PanelHeader: React.FC<PanelHeaderProps> = ({
  className,
  heading,
  subheading,
  noBorder,
}) => {
  const styles = panelHeaderStyles({ noBorder })
  return (
    <div className={cn(styles.header(), className)}>
      <h2 className={styles.heading()}>{heading}</h2>
      {subheading && <p className={styles.subheading()}>{subheading}</p>}
    </div>
  )
}

export { Panel, PanelHeader }

import React, { ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { infoStyles, type InfoVariants } from './info.styles'
import { InfoIcon } from 'lucide-react'

interface InfoProps extends InfoVariants {
  className?: string
  children: ReactNode | string
}

const ICON_WIDTH = 16

const Info: React.FC<InfoProps> = ({ className, children, style = 'info' }) => {
  const styles = infoStyles()
  return (
    <div className={cn(styles.panel(), className)}>
      {style === 'info' && <InfoIcon width={ICON_WIDTH} height={ICON_WIDTH} />}
      <>{children}</>
    </div>
  )
}

export { Info }

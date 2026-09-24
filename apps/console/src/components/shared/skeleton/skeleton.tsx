import React from 'react'
import { cn } from '@repo/ui/lib/utils'

interface TSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  width?: string | number
  height?: string | number
}

const Skeleton = ({ className = '', width, height, ...props }: TSkeletonProps) => {
  const style: React.CSSProperties = {
    ...(width ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
  }

  return <div style={style} className={cn('animate-custom-pulse bg-muted-foreground/20', className || 'rounded-lg')} {...props} />
}

export default Skeleton

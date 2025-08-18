import React from 'react'

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

  return <div style={style} className={`animate-custom-pulse bg-white/20 rounded-lg ${className}`} {...props} />
}

export default Skeleton

import { PencilIcon } from 'lucide-react'
import React from 'react'
import clsx from 'clsx'

interface HoverPencilWrapperProps {
  children: React.ReactNode
  className?: string
  showPencil?: boolean
  pencilClass?: string
}

export const HoverPencilWrapper: React.FC<HoverPencilWrapperProps> = ({ children, className, showPencil = true, pencilClass }) => {
  return (
    <div className={clsx('relative group', className)}>
      {children}
      {showPencil && <PencilIcon size={16} className={clsx('absolute top-1/2 right-0 -translate-y-1/2 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100', pencilClass)} />}
    </div>
  )
}

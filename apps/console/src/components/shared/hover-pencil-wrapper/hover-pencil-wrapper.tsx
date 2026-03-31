import { PencilIcon } from 'lucide-react'
import React from 'react'
import clsx from 'clsx'

interface HoverPencilWrapperProps {
  children: React.ReactNode
  className?: string
  showPencil?: boolean
  pencilClass?: string
  onPencilClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  pencilAriaLabel?: string
}

export const HoverPencilWrapper: React.FC<HoverPencilWrapperProps> = ({ children, className, showPencil = true, pencilClass, onPencilClick, pencilAriaLabel = 'Edit' }) => {
  return (
    <div className={clsx('group flex items-center gap-2', showPencil && 'cursor-pointer', className)}>
      {children}
      {showPencil &&
        (onPencilClick ? (
          <button
            type="button"
            aria-label={pencilAriaLabel}
            onMouseDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onPencilClick(event)
            }}
            className={clsx('shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 p-0 bg-transparent border-0 cursor-pointer', pencilClass)}
          >
            <PencilIcon size={16} />
          </button>
        ) : (
          <PencilIcon size={16} className={clsx('shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100', pencilClass)} />
        ))}
    </div>
  )
}

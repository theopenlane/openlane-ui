'use client'

import React from 'react'

import { cn, withRef } from '@udecode/cn'
import { useFocused, useSelected } from 'slate-react'

import { PlateElement } from './plate-element'

export const HrElement = withRef<typeof PlateElement>(({ className, nodeProps, ...props }, ref) => {
  const { children } = props

  const selected = useSelected()
  const focused = useFocused()

  return (
    <PlateElement ref={ref} {...props}>
      <div className="py-6" contentEditable={false}>
        <hr
          {...nodeProps}
          className={cn(
            'h-0.5 cursor-pointer rounded-sm border-none bg-oxford-blue-100 bg-clip-content dark:bg-oxford-blue-800',
            selected && focused && 'ring-2 ring-oxford-blue-950 ring-offset-2 dark:ring-oxford-blue-300',
            className,
          )}
        />
      </div>
      {children}
    </PlateElement>
  )
})

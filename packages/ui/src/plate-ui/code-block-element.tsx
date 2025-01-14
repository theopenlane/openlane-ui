'use client'

import { cn, withRef } from '@udecode/cn'
import { useCodeBlockElementState } from '@udecode/plate-code-block/react'

import { CodeBlockCombobox } from './code-block-combobox'
import { PlateElement } from './plate-element'

import './code-block-element.css'

export const CodeBlockElement = withRef<typeof PlateElement>(({ children, className, ...props }, ref) => {
  const { element } = props
  const state = useCodeBlockElementState({ element })

  return (
    <PlateElement ref={ref} className={cn('relative py-1', state.className, className)} {...props}>
      <pre className="overflow-x-auto rounded-md bg-oxford-blue-100 px-4 py-4 font-mono text-sm leading-[normal] [tab-size:2] dark:bg-oxford-blue-800">
        <code>{children}</code>
      </pre>

      {state.syntax && (
        <div className="absolute right-2 top-2 z-10 select-none" contentEditable={false}>
          <CodeBlockCombobox />
        </div>
      )}
    </PlateElement>
  )
})

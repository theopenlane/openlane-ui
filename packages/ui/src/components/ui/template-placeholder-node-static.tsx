import * as React from 'react'

import type { SlateLeafProps } from 'platejs/static'

import { SlateLeaf } from 'platejs/static'

export function TemplatePlaceholderLeafStatic(props: SlateLeafProps) {
  return (
    <SlateLeaf {...props} as="mark" className="rounded-xs bg-[var(--color-warning)]/25 text-inherit">
      {props.children}
    </SlateLeaf>
  )
}

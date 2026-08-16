'use client'

import * as React from 'react'

import type { PlateLeafProps } from 'platejs/react'

import { PlateLeaf } from 'platejs/react'

export function TemplatePlaceholderLeaf(props: PlateLeafProps) {
  return (
    <PlateLeaf {...props} as="mark" className="rounded-xs bg-[var(--color-warning)]/25 text-inherit">
      {props.children}
    </PlateLeaf>
  )
}

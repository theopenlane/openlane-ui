'use client'

import { TocPlugin } from '@platejs/toc/react'

import { TocElement } from '@theopenlane/ui/components/ui/toc-node.tsx'
export const TocKit = [
  TocPlugin.configure({
    options: {
      // isScroll: true,
      topOffset: 80,
    },
  }).withComponent(TocElement),
]

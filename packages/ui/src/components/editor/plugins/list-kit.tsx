'use client'

import { ListPlugin } from '@platejs/list/react'
import { KEYS } from 'platejs'

import { IndentKit } from '@repo/ui/components/editor/plugins/indent-kit.tsx'
import { BlockList } from '@repo/ui/components/ui/block-list.tsx'

export const ListKit = [
  ...IndentKit,
  ListPlugin.configure({
    inject: {
      targetPlugins: [...KEYS.heading, KEYS.p, KEYS.blockquote, KEYS.codeBlock, KEYS.toggle],
    },
    render: {
      belowNodes: BlockList,
    },
  }),
]

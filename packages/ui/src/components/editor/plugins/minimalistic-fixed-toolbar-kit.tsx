'use client'

import { createPlatePlugin } from 'platejs/react'

import { FixedToolbar } from '@repo/ui/components/ui/fixed-toolbar.tsx'
import { MinimalisticToolbarButtons } from '@repo/ui/components/ui/minimalistic-toolbar-buttons.tsx'

export const MinimalisticFixedToolbarKit = [
  createPlatePlugin({
    key: 'minimalistic-fixed-toolbar',
    render: {
      beforeEditable: () => (
        <FixedToolbar>
          <MinimalisticToolbarButtons />
        </FixedToolbar>
      ),
    },
  }),
]

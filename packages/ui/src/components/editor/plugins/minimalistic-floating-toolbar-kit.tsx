'use client'

import { createPlatePlugin } from 'platejs/react'

import { FloatingToolbar } from '@repo/ui/components/ui/floating-toolbar.tsx'
import { MinimalisticFloatingToolbarButtons } from '@repo/ui/components/ui/minimalistic-floating-toolbar-buttons.tsx'

export const MinimalisticFloatingToolbarKit = [
  createPlatePlugin({
    key: 'minimalistic-floating-toolbar',
    render: {
      afterEditable: () => (
        <FloatingToolbar>
          <MinimalisticFloatingToolbarButtons />
        </FloatingToolbar>
      ),
    },
  }),
]

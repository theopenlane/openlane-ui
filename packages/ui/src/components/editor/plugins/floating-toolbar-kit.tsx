'use client'

import { createPlatePlugin } from 'platejs/react'

import { FloatingToolbar } from '@repo/ui/components/ui/floating-toolbar.tsx'
import { FloatingToolbarButtons } from '@repo/ui/components/ui/floating-toolbar-buttons.tsx'

export const FloatingToolbarKit = [
  createPlatePlugin({
    key: 'floating-toolbar',
    render: {
      afterEditable: () => (
        <FloatingToolbar>
          <FloatingToolbarButtons />
        </FloatingToolbar>
      ),
    },
  }),
]

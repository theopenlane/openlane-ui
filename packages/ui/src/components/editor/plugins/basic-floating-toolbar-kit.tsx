'use client'

import { createPlatePlugin } from 'platejs/react'

import { FloatingToolbar } from '@repo/ui/components/ui/floating-toolbar.tsx'
import { BasicFloatingToolbarButtons } from '@repo/ui/components/ui/basic-floating-toolbar-buttons.tsx'

export const BasicFloatingToolbarKit = [
  createPlatePlugin({
    key: 'basic-floating-toolbar',
    render: {
      afterEditable: () => (
        <FloatingToolbar>
          <BasicFloatingToolbarButtons />
        </FloatingToolbar>
      ),
    },
  }),
]

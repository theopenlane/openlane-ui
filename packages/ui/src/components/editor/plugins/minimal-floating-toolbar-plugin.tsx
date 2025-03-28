'use client'

import { createPlatePlugin } from '@udecode/plate/react'

import { FloatingToolbar } from '../../plate-ui/floating-toolbar'
import { MinimalFloatingToolbarButtons } from '../../plate-ui/minimal-floating-toolbar-buttons.tsx'

export const MinimalFloatingToolbarPlugin = createPlatePlugin({
  key: 'minimal-floating-toolbar',
  render: {
    afterEditable: () => (
      <FloatingToolbar>
        <MinimalFloatingToolbarButtons />
      </FloatingToolbar>
    ),
  },
})

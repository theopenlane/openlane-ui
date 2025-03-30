'use client'

import { createPlatePlugin } from '@udecode/plate/react'

import { FloatingToolbar } from '../../plate-ui/floating-toolbar'
import { AdvancedFloatingToolbarButtons } from '../../plate-ui/advanced-floating-toolbar-buttons.tsx'

export const AdvancedFloatingToolbarPlugin = createPlatePlugin({
  key: 'floating-toolbar',
  render: {
    afterEditable: () => (
      <FloatingToolbar>
        <AdvancedFloatingToolbarButtons />
      </FloatingToolbar>
    ),
  },
})

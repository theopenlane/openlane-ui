'use client'

import { createPlatePlugin } from '@udecode/plate/react'

import { FloatingToolbar } from '../../plate-ui/floating-toolbar'
import { StandardFloatingToolbarButtons } from '../../plate-ui/standard-floating-toolbar-buttons.tsx'

export const StandardFloatingToolbarPlugin = createPlatePlugin({
  key: 'standard-floating-toolbar',
  render: {
    afterEditable: () => (
      <FloatingToolbar>
        <StandardFloatingToolbarButtons />
      </FloatingToolbar>
    ),
  },
})

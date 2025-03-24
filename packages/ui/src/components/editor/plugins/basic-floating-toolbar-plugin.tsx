'use client'

import { createPlatePlugin } from '@udecode/plate/react'

import { FloatingToolbar } from '../../plate-ui/floating-toolbar'
import { BasicFloatingToolbarButtons } from '../../plate-ui/basic-floating-toolbar-buttons'

export const BasicFloatingToolbarPlugin = createPlatePlugin({
  key: 'basic-floating-toolbar',
  render: {
    afterEditable: () => (
      <FloatingToolbar>
        <BasicFloatingToolbarButtons />
      </FloatingToolbar>
    ),
  },
})

'use client'

import { createPlatePlugin } from '@udecode/plate/react'

import { FixedToolbar } from '../../plate-ui/fixed-toolbar'
import { AdvancedFixedToolbarButtons } from '../../plate-ui/advanced-fixed-toolbar-buttons.tsx'

export const AdvancedFixedToolbarPlugin = createPlatePlugin({
  key: 'advanced-fixed-toolbar',
  render: {
    beforeEditable: () => (
      <FixedToolbar>
        <AdvancedFixedToolbarButtons />
      </FixedToolbar>
    ),
  },
})

'use client'

import { createPlatePlugin } from '@udecode/plate/react'

import { FixedToolbar } from '../../plate-ui/fixed-toolbar'
import { MinimalFixedToolbarButtons } from '../../plate-ui/minimal-fixed-toolbar-buttons.tsx'

export const MinimalFixedToolbarPlugin = createPlatePlugin({
  key: 'minimal-fixed-toolbar',
  render: {
    beforeEditable: () => (
      <FixedToolbar>
        <MinimalFixedToolbarButtons />
      </FixedToolbar>
    ),
  },
})

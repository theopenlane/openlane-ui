'use client'

import { createPlatePlugin } from '@udecode/plate/react'

import { FixedToolbar } from '../../plate-ui/fixed-toolbar'
import { StandardFixedToolbarButtons } from '../../plate-ui/standard-fixed-toolbar-buttons.tsx'

export const StandardFixedToolbarPlugin = createPlatePlugin({
  key: 'standard-fixed-toolbar',
  render: {
    beforeEditable: () => (
      <FixedToolbar>
        <StandardFixedToolbarButtons />
      </FixedToolbar>
    ),
  },
})

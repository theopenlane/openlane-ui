'use client'

import { createPlatePlugin } from '@udecode/plate/react'

import { FixedToolbar } from '../../plate-ui/fixed-toolbar'
import { BasicFixedToolbarButtons } from '../../plate-ui/basic-fixed-toolbar-buttons.tsx'

export const BasicFixedToolbarPlugin = createPlatePlugin({
  key: 'fixed-toolbar',
  render: {
    beforeEditable: () => (
      <FixedToolbar>
        <BasicFixedToolbarButtons />
      </FixedToolbar>
    ),
  },
})

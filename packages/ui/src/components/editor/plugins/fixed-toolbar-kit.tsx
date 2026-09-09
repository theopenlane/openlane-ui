'use client'

import { createPlatePlugin } from 'platejs/react'

import { FixedToolbar } from '@theopenlane/ui/components/ui/fixed-toolbar.tsx'
import { FixedToolbarButtons } from '@theopenlane/ui/components/ui/fixed-toolbar-buttons.tsx'

export const FixedToolbarKit = [
  createPlatePlugin({
    key: 'fixed-toolbar',
    render: {
      beforeEditable: () => (
        <FixedToolbar>
          <FixedToolbarButtons />
        </FixedToolbar>
      ),
    },
  }),
]

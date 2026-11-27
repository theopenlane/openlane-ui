'use client'

import { createPlatePlugin } from 'platejs/react'

import { FixedToolbar } from '@theopenlane/ui/components/ui/fixed-toolbar.tsx'
import { BasicToolbarButtons } from '@theopenlane/ui/components/ui/basic-toolbar-buttons.tsx'

export const BasicFixedToolbarKit = [
  createPlatePlugin({
    key: 'basic-fixed-toolbar',
    render: {
      beforeEditable: () => (
        <FixedToolbar>
          <BasicToolbarButtons />
        </FixedToolbar>
      ),
    },
  }),
]

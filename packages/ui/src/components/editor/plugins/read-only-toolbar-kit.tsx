'use client'

import { createPlatePlugin } from 'platejs/react'

import { FixedToolbar } from '@repo/ui/components/ui/fixed-toolbar.tsx'
import { ReadyOnlyToolbarButtons } from '@repo/ui/components/ui/readonly-toolbar-buttons.tsx'

export const ReadOnlyToolbarKit = [
  createPlatePlugin({
    key: 'read-only-toolbar',
    render: {
      beforeContainer: () => (
        <FixedToolbar className="p-0 overflow-x-visible border-none">
          <ReadyOnlyToolbarButtons />
        </FixedToolbar>
      ),
    },
  }),
]

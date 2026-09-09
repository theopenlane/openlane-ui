'use client'

import { createPlatePlugin } from 'platejs/react'

import { Toolbar } from '@theopenlane/ui/components/ui/toolbar.tsx'
import { ReadOnlyToolbarButtons } from '@theopenlane/ui/components/ui/readonly-toolbar-buttons.tsx'

type ReadOnlyToolbarKitOptions = {
  title?: string
  className?: string
}

export function createReadOnlyToolbarKit({ title, className }: ReadOnlyToolbarKitOptions = {}) {
  return [
    createPlatePlugin({
      key: 'read-only-toolbar',
      render: {
        beforeContainer: () => (
          <Toolbar className="w-full">
            <ReadOnlyToolbarButtons title={title} className={className} />
          </Toolbar>
        ),
      },
    }),
  ]
}

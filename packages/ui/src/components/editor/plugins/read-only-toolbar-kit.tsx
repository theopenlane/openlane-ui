'use client'

import { useContext } from 'react'
import { createPortal } from 'react-dom'
import { createPlatePlugin } from 'platejs/react'

import { Toolbar } from '@repo/ui/components/ui/toolbar.tsx'
import { ReadOnlyToolbarButtons } from '@repo/ui/components/ui/readonly-toolbar-buttons.tsx'
import { ReadOnlyToolbarPortalContext } from '@repo/ui/components/editor/read-only-toolbar-portal.ts'
import { cn } from '@repo/ui/lib/utils'

type ReadOnlyToolbarKitOptions = {
  className?: string
}

const ReadOnlyToolbar = ({ className }: ReadOnlyToolbarKitOptions) => {
  const portalTarget = useContext(ReadOnlyToolbarPortalContext)

  if (portalTarget) {
    return createPortal(
      <Toolbar>
        <ReadOnlyToolbarButtons />
      </Toolbar>,
      portalTarget,
    )
  }

  return (
    <Toolbar className="w-full">
      <ReadOnlyToolbarButtons className={cn('w-full mt-[-7rem]', className)} />
    </Toolbar>
  )
}

export function createReadOnlyToolbarKit({ className }: ReadOnlyToolbarKitOptions = {}) {
  return [
    createPlatePlugin({
      key: 'read-only-toolbar',
      render: {
        beforeContainer: () => <ReadOnlyToolbar className={className} />,
      },
    }),
  ]
}

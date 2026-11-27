'use client'

import { LinkPlugin } from '@platejs/link/react'

import { LinkElement } from '@theopenlane/ui/components/ui/link-node.tsx'
import { LinkFloatingToolbar } from '@theopenlane/ui/components/ui/link-toolbar.tsx'

export const LinkKit = [
  LinkPlugin.configure({
    render: {
      node: LinkElement,
      afterEditable: () => <LinkFloatingToolbar />,
    },
  }),
]

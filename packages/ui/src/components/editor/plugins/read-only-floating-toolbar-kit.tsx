'use client'

import { createPlatePlugin } from 'platejs/react'

import { FloatingToolbar } from '@repo/ui/components/ui/floating-toolbar.tsx'
import { CommentToolbarButton, useCanComment } from '@repo/ui/components/ui/comment-toolbar-button.tsx'
import { ToolbarGroup } from '@repo/ui/components/ui/toolbar.tsx'

const ReadOnlyFloatingCommentToolbar = () => {
  const canComment = useCanComment()

  if (!canComment) return null

  return (
    <FloatingToolbar state={{ showWhenReadOnly: true }}>
      <ToolbarGroup>
        <CommentToolbarButton />
      </ToolbarGroup>
    </FloatingToolbar>
  )
}

export const ReadOnlyFloatingToolbarKit = [
  createPlatePlugin({
    key: 'read-only-floating-toolbar',
    render: {
      afterEditable: () => <ReadOnlyFloatingCommentToolbar />,
    },
  }),
]

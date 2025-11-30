'use client'

import * as React from 'react'

import { MessageSquareTextIcon } from 'lucide-react'
import { useEditorRef } from 'platejs/react'

import { commentPlugin } from '@repo/ui/components/editor/plugins/comment-kit.tsx'

import { ToolbarButton } from './toolbar'

export function CommentToolbarButton() {
  const editor = useEditorRef()

  return (
    <ToolbarButton
      onClick={(e) => {
        e.stopPropagation()
        editor.getTransforms(commentPlugin).comment.setDraft()
      }}
      data-plate-prevent-overlay
      tooltip="Comment"
    >
      <MessageSquareTextIcon />
    </ToolbarButton>
  )
}

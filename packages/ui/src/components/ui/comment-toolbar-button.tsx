'use client'

import * as React from 'react'

import { MessageSquareTextIcon } from 'lucide-react'
import { useEditorRef, usePluginOption } from 'platejs/react'

import { commentPlugin } from '@repo/ui/components/editor/plugins/comment-kit.tsx'
import { discussionPlugin } from '@repo/ui/components/editor/plugins/discussion-kit.tsx'

import { ToolbarButton } from './toolbar'

export const useCanComment = (): boolean => {
  const entityId = usePluginOption(discussionPlugin, 'entityId')
  const isCreate = usePluginOption(discussionPlugin, 'isCreate')

  return !!entityId && !isCreate
}

export function CommentToolbarButton() {
  const editor = useEditorRef()
  const canComment = useCanComment()

  if (!canComment) return null

  return (
    <ToolbarButton
      onMouseDown={(e) => e.preventDefault()}
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

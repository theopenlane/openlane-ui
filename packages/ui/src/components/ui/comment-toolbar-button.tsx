'use client'

import * as React from 'react'

import { MessageSquareCheckIcon, MessageSquareTextIcon } from 'lucide-react'
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

export const ResolvedCommentsToolbarButton = () => {
  const editor = useEditorRef()
  const showResolved = usePluginOption(discussionPlugin, 'showResolved')
  const hasResolved = usePluginOption(discussionPlugin, 'hasResolvedInDocument')

  if (!hasResolved && !showResolved) return null

  const label = showResolved ? 'Hide resolved comments' : 'Show resolved comments'

  return (
    <ToolbarButton
      pressed={showResolved}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => editor.setOption(discussionPlugin, 'showResolved', !showResolved)}
      data-plate-prevent-overlay
      tooltip={label}
      aria-label={label}
    >
      <MessageSquareCheckIcon />
    </ToolbarButton>
  )
}

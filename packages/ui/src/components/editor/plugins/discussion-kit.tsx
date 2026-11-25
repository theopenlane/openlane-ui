'use client'

import { useLayoutEffect } from 'react'
import type { TComment } from '@repo/ui/components/ui/comment.tsx'
import { getCommentKeyId, getCommentKeys, getDraftCommentKey } from '@platejs/comment'
import { createPlatePlugin, usePluginOption } from 'platejs/react'
import { commentPlugin } from '@repo/ui/components/editor/plugins/comment-kit.tsx'
import { BlockDiscussion } from '@repo/ui/components/ui/block-discussion.tsx'
import { ObjectTypes } from '@repo/codegen/src/type-names'

export interface TDiscussion {
  id: string
  systemId?: string
  comments: TComment[]
  createdAt: Date
  isResolved: boolean
  userId: string
  documentContent?: string
}

export type CommentEntityType = typeof ObjectTypes.CONTROL | typeof ObjectTypes.SUBCONTROL | typeof ObjectTypes.INTERNAL_POLICY | typeof ObjectTypes.PROCEDURE | typeof ObjectTypes.RISK

export interface TDiscussionUser {
  id: string
  name: string
  avatarUrl?: string
  hue?: number
}

export const canCommentOnEntity = ({ entityId, isCreate }: { entityId?: string; isCreate: boolean }): boolean => !!entityId && !isCreate

/**
 * discussionPlugin
 *
 * NOW DYNAMIC:
 * You must pass:
 * - entityType: "policy" | "risk" | "control" | "procedure" | "subcontrol"
 * - entityId: ID of that entity
 * - currentUserId: logged-in user
 * - users: map of users
 * - discussions: list loaded from backend
 */
export const discussionPlugin = createPlatePlugin({
  key: 'discussion',

  /**
   * Default values for development/demos.
   * In production, these are overridden when the editor is created.
   */
  options: {
    entityType: undefined as CommentEntityType | undefined,
    entityId: undefined as string | undefined,
    currentUserId: undefined as string | undefined,
    isCreate: false,
    users: {} as Record<string, TDiscussionUser>,
    discussions: [] as TDiscussion[],
    pendingAiDiscussions: [] as TDiscussion[],
    showResolved: false,
    hasResolvedInDocument: false,
  },
})
  .configure({
    render: { aboveNodes: BlockDiscussion },
    useHooks: ({ editor }) => {
      const discussions = usePluginOption(discussionPlugin, 'discussions')
      const showResolved = usePluginOption(discussionPlugin, 'showResolved')

      useLayoutEffect(() => {
        const shownIds = new Set(discussions.filter((discussion) => showResolved || !discussion.isResolved).map((discussion) => discussion.id))
        const currentShownIds = editor.getOption(commentPlugin, 'shownIds')
        if (currentShownIds.size !== shownIds.size || [...shownIds].some((id) => !currentShownIds.has(id))) {
          editor.setOption(commentPlugin, 'shownIds', shownIds)
        }

        const isHidden = (id: string | null) => !!id && id !== getDraftCommentKey() && !shownIds.has(id)
        if (isHidden(editor.getOption(commentPlugin, 'activeId'))) editor.setOption(commentPlugin, 'activeId', null)
        if (isHidden(editor.getOption(commentPlugin, 'hoverId'))) editor.setOption(commentPlugin, 'hoverId', null)

        const markedIds = new Set(
          editor
            .getApi(commentPlugin)
            .comment.nodes({ at: [] })
            .flatMap(([node]) => getCommentKeys(node).map(getCommentKeyId)),
        )
        editor.setOption(
          discussionPlugin,
          'hasResolvedInDocument',
          discussions.some((discussion) => discussion.isResolved && markedIds.has(discussion.id)),
        )
      }, [editor, discussions, showResolved])
    },
  })
  .extendSelectors(({ getOption }) => ({
    currentUser: () => {
      const id = getOption('currentUserId')
      if (!id) return undefined
      return getOption('users')[id]
    },

    user: (userId: string) => getOption('users')[userId],
  }))

export const DiscussionKit = [discussionPlugin]

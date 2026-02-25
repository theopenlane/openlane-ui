'use client'

import type { TComment } from '@repo/ui/components/ui/comment.tsx'
import { createPlatePlugin } from 'platejs/react'
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
    users: {} as Record<
      string,
      {
        id: string
        avatarUrl: string
        name: string
        hue?: number
      }
    >,
    discussions: [] as TDiscussion[],
  },
})
  .configure({
    render: { aboveNodes: BlockDiscussion },
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

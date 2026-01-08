'use client'

import type { TComment } from '@repo/ui/components/ui/comment.tsx'
import { createPlatePlugin } from 'platejs/react'
import { BlockDiscussion } from '@repo/ui/components/ui/block-discussion.tsx'

export interface TDiscussion {
  id: string
  systemId?: string
  comments: TComment[]
  createdAt: Date
  isResolved: boolean
  userId: string
  documentContent?: string
}

export type CommentEntityType = 'Control' | 'InternalPolicy' | 'Procedure' | 'Risk' | 'Subcontrol'

/**
 * discussionPlugin
 *
 * NOW DYNAMIC:
 * You must pass:
 * - entityType: "policy" | "risk" | "task" | "procedure"
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

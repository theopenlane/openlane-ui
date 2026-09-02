import { useMemo } from 'react'
import {
  type ControlDiscussionFieldsFragment,
  type GetUserProfileQuery,
  type PolicyDiscussionFieldsFragment,
  type ProcedureDiscussionFieldsFragment,
  type RiskDiscussionFieldsFragment,
  type SubcontrolDiscussionFieldsFragment,
} from '@repo/codegen/src/schema'
import { type TDiscussion, type TDiscussionUser } from '@repo/ui/components/editor/plugins/discussion-kit.tsx'
import { type TComment } from '@repo/ui/components/ui/comment.tsx'
import { parseCommentTextToChildren } from '@repo/ui/components/editor/plugins/mention-serialize.ts'
import { getAvatarImageSrc } from '@/components/shared/avatar/avatar'
import { EMPTY_DISPLAY_NAME, resolveAuthor, UNKNOWN_AUTHOR_ID } from '@/lib/authors'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'

export type TDiscussionEntity = PolicyDiscussionFieldsFragment | ProcedureDiscussionFieldsFragment | RiskDiscussionFieldsFragment | SubcontrolDiscussionFieldsFragment | ControlDiscussionFieldsFragment

type TCurrentUser = GetUserProfileQuery['user']

export const mapEntityDiscussions = (entity: TDiscussionEntity): TDiscussion[] =>
  entity.discussions?.edges
    ?.map((edge) => {
      const d = edge?.node
      if (!d || !d.externalID) return null

      const comments: TComment[] =
        d.comments?.edges
          ?.map((cEdge) => {
            const c = cEdge?.node
            if (!c) return null

            return {
              id: c.id,
              contentRich: [
                {
                  type: 'p',
                  children: parseCommentTextToChildren(c.text ?? '', { comment: true, [`comment_${d.externalID}`]: true }),
                  id: c.noteRef,
                },
              ],
              createdAt: new Date(c.createdAt ?? Date.now()),
              discussionId: d.externalID,
              isEdited: c.isEdited,
              userId: c.createdBy || UNKNOWN_AUTHOR_ID,
            } as TComment
          })
          .filter((c): c is TComment => c !== null) ?? []

      return {
        id: d.externalID,
        systemId: d.id,
        createdAt: new Date(d.createdAt ?? Date.now()),
        isResolved: d.isResolved ?? false,
        userId: comments[0]?.userId ?? UNKNOWN_AUTHOR_ID,
        comments,
      } as TDiscussion
    })
    .filter((d): d is TDiscussion => d !== null) ?? []

export const useDiscussionUsers = (discussions: TDiscussion[], currentUser?: TCurrentUser): Record<string, TDiscussionUser> => {
  const authorIds = useMemo(() => Array.from(new Set(discussions.flatMap((discussion) => discussion.comments.map((comment) => comment.userId)))), [discussions])

  const { userMap, tokenMap, isLoading } = useAuthorMaps(authorIds)

  return useMemo(() => {
    const users: Record<string, TDiscussionUser> = {}

    if (currentUser) {
      users[currentUser.id] = {
        id: currentUser.id,
        name: currentUser.displayName || EMPTY_DISPLAY_NAME,
        avatarUrl: getAvatarImageSrc(currentUser),
      }
    }

    authorIds.forEach((id) => {
      if (users[id]) return

      const author = resolveAuthor(id, { userMap, tokenMap })
      if (author.kind === 'deleted' && isLoading) return

      users[id] = {
        id,
        name: author.displayName,
        avatarUrl: author.kind === 'user' ? getAvatarImageSrc(author.user) : undefined,
      }
    })

    return users
  }, [authorIds, currentUser, isLoading, tokenMap, userMap])
}

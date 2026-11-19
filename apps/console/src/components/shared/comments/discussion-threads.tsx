import React, { useId, useMemo } from 'react'
import { type Value } from 'platejs'
import { Badge } from '@repo/ui/badge'
import { TruncatedCell } from '@repo/ui/truncated-cell'
import { collectDiscussionQuotes } from '@repo/ui/components/editor/plugins/discussion-quotes.ts'
import { parseCommentText } from '@repo/ui/components/editor/plugins/mention-serialize.ts'
import CommentList from '@/components/shared/comments/CommentList'
import { type TCommentData } from '@/components/shared/comments/types/TCommentData'
import { getCommentedDiscussions, type TDiscussionEntity } from '@/components/shared/plate/discussions'
import { SkeletonRows } from '@/components/shared/skeleton/skeleton-rows'
import { resolveAuthor } from '@/lib/authors'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { compareByCreatedAt } from '@/lib/sort'

type TDiscussionThread = {
  id: string
  quote: string | undefined
  isResolved: boolean
  createdAt: string
  comments: TCommentData[]
}

type TDiscussionThreadsProps = {
  entity: TDiscussionEntity | undefined
  document: Value | null | undefined
  entityLabel: string
  isLoading: boolean
  isError: boolean
}

const toCommentValue = (text: string): Value => text.split('\n').map((line) => parseCommentText(line))

export const DiscussionThreads: React.FC<TDiscussionThreadsProps> = ({ entity, document, entityLabel, isLoading, isError }) => {
  const headingId = useId()
  const discussions = useMemo(() => getCommentedDiscussions(entity), [entity])
  const quotes = useMemo(() => collectDiscussionQuotes(document), [document])

  const authorIds = useMemo(() => discussions.flatMap((discussion) => getNodes(discussion.comments).map((comment) => comment.createdBy)), [discussions])
  const { authorMaps } = useAuthorMaps(authorIds)

  const threads = useMemo<TDiscussionThread[]>(
    () =>
      discussions
        .map((discussion) => ({
          id: discussion.id,
          quote: discussion.externalID ? quotes.get(discussion.externalID) : undefined,
          isResolved: !!discussion.isResolved,
          createdAt: discussion.createdAt ?? '',
          comments: getNodes(discussion.comments)
            .map((comment) => ({
              id: comment.id,
              comment: toCommentValue(comment.text),
              createdAt: comment.createdAt ?? '',
              createdBy: comment.createdBy ?? '',
              author: resolveAuthor(comment.createdBy, authorMaps),
            }))
            .sort(compareByCreatedAt),
        }))
        .sort((a, b) => Number(a.isResolved) - Number(b.isResolved) || compareByCreatedAt(b, a)),
    [discussions, quotes, authorMaps],
  )

  return (
    <section className="space-y-3" aria-labelledby={headingId}>
      <h3 id={headingId} className="text-lg font-semibold">
        Document discussions
      </h3>
      {isLoading ? (
        <div role="status" aria-live="polite" aria-label="Loading discussions">
          <SkeletonRows count={2} height={56} />
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">Discussions could not be loaded.</p>
      ) : threads.length === 0 ? (
        <p className="text-sm text-muted-foreground">No inline comments yet. Select text in the {entityLabel} to start a discussion.</p>
      ) : (
        <ul className="space-y-3">
          {threads.map((thread) => (
            <li key={thread.id} className="rounded-lg border p-3">
              <div className="mb-2 flex items-start gap-3">
                {thread.quote && (
                  <blockquote className="min-w-0 border-l-2 border-primary pl-2 text-sm text-muted-foreground">
                    <TruncatedCell lineClamp={3} portal>
                      {thread.quote}
                    </TruncatedCell>
                  </blockquote>
                )}
                {!thread.quote && document && <p className="text-sm italic text-muted-foreground">The commented text is no longer in the {entityLabel}.</p>}
                <Badge variant={thread.isResolved ? 'green' : 'outline'} className="ml-auto shrink-0">
                  {thread.isResolved ? 'Resolved' : 'Open'}
                </Badge>
              </div>
              <CommentList comments={thread.comments} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

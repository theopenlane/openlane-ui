import React, { useId, useMemo, useState } from 'react'
import { type Value } from 'platejs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@theopenlane/ui/tabs'
import { TruncatedCell } from '@theopenlane/ui/truncated-cell'
import { collectDiscussionQuotes } from '@theopenlane/ui/components/editor/plugins/discussion-quotes.ts'
import { parseCommentText } from '@theopenlane/ui/components/editor/plugins/mention-serialize.ts'
import CommentList from '@/components/shared/comments/CommentList'
import { ReopenDiscussionButton } from '@/components/shared/comments/reopen-discussion-button'
import { type TCommentData } from '@/components/shared/comments/types/TCommentData'
import { getCommentedDiscussions, type TDiscussionEntity } from '@/components/shared/plate/discussions'
import { SkeletonRows } from '@/components/shared/skeleton/skeleton-rows'
import { resolveAuthor } from '@/lib/authors'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { compareByCreatedAt } from '@/lib/sort'
import { isOneOf } from '@/utils/type-guards'

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

const DISCUSSION_STATUSES = ['open', 'resolved'] as const

type TDiscussionStatus = (typeof DISCUSSION_STATUSES)[number]

const DISCUSSION_STATUS_LABELS: Record<TDiscussionStatus, string> = { open: 'Open', resolved: 'Resolved' }

const isDiscussionStatus = isOneOf(DISCUSSION_STATUSES)

const toCommentValue = (text: string): Value => text.split('\n').map((line) => parseCommentText(line))

export const DiscussionThreads: React.FC<TDiscussionThreadsProps> = ({ entity, document, entityLabel, isLoading, isError }) => {
  const headingId = useId()
  const [status, setStatus] = useState<TDiscussionStatus>('open')
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
        .sort((a, b) => compareByCreatedAt(b, a)),
    [discussions, quotes, authorMaps],
  )

  const threadsByStatus = useMemo<Record<TDiscussionStatus, TDiscussionThread[]>>(
    () => ({ open: threads.filter((thread) => !thread.isResolved), resolved: threads.filter((thread) => thread.isResolved) }),
    [threads],
  )
  const isLoaded = !isLoading && !isError

  if (isLoaded && threads.length === 0) return null

  const selectStatus = (value: string) => {
    if (isDiscussionStatus(value)) setStatus(value)
  }

  const heading = (
    <h3 id={headingId} className="text-lg font-semibold">
      Discussions
    </h3>
  )

  if (!isLoaded) {
    return (
      <section className="space-y-3" aria-labelledby={headingId}>
        {heading}
        {isLoading ? (
          <div role="status" aria-live="polite" aria-label="Loading discussions">
            <SkeletonRows count={2} height={56} />
          </div>
        ) : (
          <p className="text-sm text-destructive">Discussions could not be loaded.</p>
        )}
      </section>
    )
  }

  return (
    <section aria-labelledby={headingId}>
      <Tabs value={status} onValueChange={selectStatus} variant="solid" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {heading}
          <TabsList className="w-fit" aria-label="Discussion status">
            {DISCUSSION_STATUSES.map((value) => (
              <TabsTrigger key={value} value={value}>
                {DISCUSSION_STATUS_LABELS[value]} ({threadsByStatus[value].length})
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {DISCUSSION_STATUSES.map((value) => (
          <TabsContent key={value} value={value} className="mt-0">
            {threadsByStatus[value].length === 0 ? (
              <p className="text-sm text-muted-foreground">{value === 'open' ? 'No open discussions. All discussions are resolved.' : 'No resolved discussions.'}</p>
            ) : (
              <ul className="space-y-3">
                {threadsByStatus[value].map((thread) => (
                  <li key={thread.id} className="rounded-lg border p-3">
                    {thread.quote && (
                      <blockquote className="mb-2 border-l-2 border-primary pl-2 text-sm text-muted-foreground">
                        <TruncatedCell lineClamp={3} portal>
                          {thread.quote}
                        </TruncatedCell>
                      </blockquote>
                    )}
                    {!thread.quote && document && <p className="mb-2 text-sm italic text-muted-foreground">The commented text is no longer in the {entityLabel}.</p>}
                    <CommentList comments={thread.comments} />
                    {thread.isResolved && (
                      <div className="mt-2 flex justify-end">
                        <ReopenDiscussionButton discussionId={thread.id} authorId={thread.comments[0]?.createdBy} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}

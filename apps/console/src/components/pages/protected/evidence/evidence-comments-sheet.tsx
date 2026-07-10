import AddComment from '@/components/shared/comments/AddComment'
import CommentList from '@/components/shared/comments/CommentList'
import { type TCommentData } from '@/components/shared/comments/types/TCommentData'
import { type TComments } from '@/components/shared/comments/types/TComments'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { useNotification } from '@/hooks/useNotification'
import { useDeleteNote } from '@/lib/graphql-hooks/control'
import { useGetEvidenceComments, useUpdateEvidence, useUpdateEvidenceComment } from '@/lib/graphql-hooks/evidence'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { resolveAuthor } from '@/lib/authors'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { SheetTitle } from '@repo/ui/sheet'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowDownUp, ArrowUpDown } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'

const EvidenceCommentSheet = () => {
  const searchParams = useSearchParams()
  const evidenceId = searchParams.get('id') || searchParams.get('controlEvidenceId')
  const { data } = useGetEvidenceComments(evidenceId)
  const { mutateAsync: updateEvidenceComment } = useUpdateEvidenceComment()
  const { mutateAsync: updateEvidence } = useUpdateEvidence()
  const { errorNotification } = useNotification()
  const [commentSortIsAsc, setCommentSortIsAsc] = useState(false)
  const { mutateAsync: deleteNote } = useDeleteNote()
  const queryClient = useQueryClient()
  const plateEditorHelper = usePlateEditor()

  const commentSource = data?.evidence.comments
  const userIds = useMemo(() => {
    const edges = commentSource?.edges ?? []
    return Array.from(new Set(edges.map((item) => item?.node?.createdBy).filter((id): id is string => typeof id === 'string')))
  }, [commentSource])

  const { userMap, tokenMap, isLoading: isAuthorsLoading } = useAuthorMaps(userIds)

  const comments = useMemo(() => {
    if (!commentSource?.edges?.length) return []

    const mapped: TCommentData[] = commentSource.edges.flatMap((item) => {
      const commentNode = item?.node
      if (!commentNode) return []

      return [
        {
          comment: commentNode.text ?? '',
          createdAt: String(commentNode.createdAt ?? ''),
          author: resolveAuthor(commentNode.createdBy, { userMap, tokenMap }),
          createdBy: commentNode.createdBy ?? '',
          id: commentNode.id,
        },
      ]
    })

    return mapped.sort((a, b) => new Date(!commentSortIsAsc ? b.createdAt : a.createdAt).getTime() - new Date(!commentSortIsAsc ? a.createdAt : b.createdAt).getTime())
  }, [commentSortIsAsc, commentSource, tokenMap, userMap])

  const handleEditComment = useCallback(
    async (commentId: string, newValue: string) => {
      try {
        await updateEvidenceComment({
          updateEvidenceCommentId: commentId,
          input: { text: newValue },
        })
      } catch (error) {
        errorNotification({ title: 'Error', description: parseErrorMessage(error) })
      }
    },
    [errorNotification, updateEvidenceComment],
  )

  const handleSendComment = useCallback(
    async (data: TComments) => {
      if (!evidenceId) return
      try {
        const comment = await plateEditorHelper.convertToHtml(data.comment)
        await updateEvidence({
          updateEvidenceId: evidenceId,
          input: { addComment: { text: comment } },
        })
        queryClient.invalidateQueries({ queryKey: ['evidenceComments', evidenceId] })
      } catch (error) {
        errorNotification({ title: 'Error', description: parseErrorMessage(error) })
      }
    },
    [errorNotification, evidenceId, queryClient, plateEditorHelper, updateEvidence],
  )

  const handleRemoveComment = useCallback(
    async (commentId: string) => {
      if (!evidenceId) return
      try {
        await deleteNote({ deleteNoteId: commentId })
        queryClient.invalidateQueries({ queryKey: ['evidenceComments', evidenceId] })
      } catch (error) {
        errorNotification({ title: 'Error', description: parseErrorMessage(error) })
      }
    },
    [deleteNote, errorNotification, queryClient, evidenceId],
  )

  const handleCommentSort = useCallback(() => {
    setCommentSortIsAsc((prev) => !prev)
  }, [])

  return (
    <div className="p-4 w-full h-full overflow-y-auto">
      <SheetTitle />
      <div className="flex justify-between items-end mb-2">
        <p className="text-lg font-semibold">Comments</p>
        <div className="flex items-center gap-1 text-right cursor-pointer" onClick={handleCommentSort}>
          {!commentSortIsAsc ? <ArrowDownUp height={16} width={16} /> : <ArrowUpDown height={16} width={16} className="text-primary" />}
          <p className="text-sm">{!commentSortIsAsc ? 'Newest at top' : 'Newest at bottom'}</p>
        </div>
      </div>
      {isAuthorsLoading && commentSource?.edges?.length ? (
        <div className="space-y-4">
          {commentSource.edges.map((_, index) => (
            <div key={index} className="w-full p-2 mb-2 rounded-lg">
              <div className="flex items-start space-x-3">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex flex-col w-full gap-2">
                  <div className="flex items-center gap-2">
                    <Skeleton height={16} width={120} />
                    <Skeleton height={14} width={80} />
                  </div>
                  <Skeleton height={16} width="80%" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <CommentList comments={comments} onEdit={handleEditComment} onRemove={handleRemoveComment} />
      )}
      <AddComment onSuccess={handleSendComment} />
    </div>
  )
}

export default EvidenceCommentSheet

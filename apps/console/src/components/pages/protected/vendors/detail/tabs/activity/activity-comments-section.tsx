import React, { useCallback, useMemo, useState } from 'react'
import { ArrowDownUp, ArrowUpDown } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useGetEntityComments, useUpdateEntity } from '@/lib/graphql-hooks/entity'
import { useDeleteNote } from '@/lib/graphql-hooks/control'
import { useNotification } from '@/hooks/useNotification'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import CommentList from '@/components/shared/comments/CommentList'
import AddComment from '@/components/shared/comments/AddComment'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useGetOrgMemberships } from '@/lib/graphql-hooks/member'
import Skeleton from '@/components/shared/skeleton/skeleton'
import type { TComments } from '@/components/shared/comments/types/TComments'
import type { TCommentData } from '@/components/shared/comments/types/TCommentData'
import { toBase64DataUri } from '@/lib/image-utils'

type ActivityCommentsSectionProps = {
  vendorId: string
}

const ActivityCommentsSection: React.FC<ActivityCommentsSectionProps> = ({ vendorId }) => {
  const { data, isLoading: isCommentsLoading } = useGetEntityComments(vendorId)
  const [commentSortIsAsc, setCommentSortIsAsc] = useState(false)

  const queryClient = useQueryClient()
  const { errorNotification } = useNotification()
  const plateEditorHelper = usePlateEditor()

  const { mutateAsync: updateEntity } = useUpdateEntity()
  const { mutateAsync: deleteNote } = useDeleteNote()

  const commentSource = data?.entity
  const userIds = useMemo(() => {
    const edges = commentSource?.notes?.edges ?? []
    return Array.from(new Set(edges.map((item) => item?.node?.createdBy).filter((itemId): itemId is string => typeof itemId === 'string')))
  }, [commentSource])

  const { data: userData, isLoading: isUsersLoading } = useGetOrgMemberships({
    where: { hasUserWith: [{ idIn: userIds }] },
    enabled: userIds.length > 0,
  })

  const userMap = useMemo(() => {
    const map: Record<string, { id: string; displayName?: string | null; avatarFile?: { base64?: string | null } | null; avatarRemoteURL?: string | null }> = {}
    userData?.orgMemberships?.edges?.forEach((edge) => {
      const user = edge?.node?.user
      if (user) map[user.id] = user
    })
    return map
  }, [userData])

  const invalidateComments = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['entityComments', vendorId] })
  }, [queryClient, vendorId])

  const handleSendComment = useCallback(
    async (commentData: TComments) => {
      if (!vendorId) return
      try {
        const text = await plateEditorHelper.convertToHtml(commentData.comment)
        await updateEntity({
          updateEntityId: vendorId,
          input: { note: { text } },
        })
        invalidateComments()
      } catch (error) {
        errorNotification({ title: 'Error', description: parseErrorMessage(error) })
      }
    },
    [vendorId, plateEditorHelper, updateEntity, errorNotification, invalidateComments],
  )

  const handleRemoveComment = useCallback(
    async (commentId: string) => {
      if (!vendorId) return
      try {
        await deleteNote({ deleteNoteId: commentId })
        invalidateComments()
      } catch (error) {
        errorNotification({ title: 'Error', description: parseErrorMessage(error) })
      }
    },
    [vendorId, deleteNote, errorNotification, invalidateComments],
  )

  const handleCommentSort = useCallback(() => {
    setCommentSortIsAsc((prev) => !prev)
  }, [])

  const comments = useMemo(() => {
    if (!commentSource?.notes?.edges?.length) return []

    const mapped = commentSource.notes.edges
      .map((item) => item?.node)
      .filter((node): node is NonNullable<typeof node> => !!node && !!node.id)
      .map((node) => {
        const user = node.createdBy ? userMap[node.createdBy] : undefined
        const avatarUrl = (user?.avatarFile?.base64 ? toBase64DataUri(user.avatarFile.base64) : null) || user?.avatarRemoteURL
        return {
          comment: node.text,
          avatarUrl,
          createdAt: node.createdAt,
          userName: user?.displayName || 'Deleted user',
          createdBy: node.createdBy,
          id: node.id,
        } as TCommentData
      })

    return mapped.sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return commentSortIsAsc ? diff : -diff
    })
  }, [commentSortIsAsc, commentSource, userMap])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <button type="button" className="flex items-center gap-1 text-right" onClick={handleCommentSort}>
          {!commentSortIsAsc ? <ArrowDownUp height={16} width={16} /> : <ArrowUpDown height={16} width={16} className="text-primary" />}
          <p className="text-sm">{!commentSortIsAsc ? 'Newest at top' : 'Newest at bottom'}</p>
        </button>
      </div>

      {isCommentsLoading || (isUsersLoading && commentSource?.notes?.edges?.length) ? (
        <div className="space-y-4">
          {(commentSource?.notes?.edges?.length ? commentSource.notes.edges : [null, null]).map((_, index) => (
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
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet</p>
      ) : (
        <CommentList comments={comments} onRemove={handleRemoveComment} />
      )}
      <AddComment onSuccess={handleSendComment} />
    </div>
  )
}

export default ActivityCommentsSection

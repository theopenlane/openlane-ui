import { useCallback } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { useDeleteNote } from '@/lib/graphql-hooks/control'
import { getNodes, type Connection } from '@/lib/graphql-hooks/connection'
import { type TFileActionsRow } from '@/components/shared/file-table/file-actions-column'
import { UserFacingError } from '@/utils/graphQlErrorMatcher'

export type TCommentFile = TFileActionsRow & { providedFileSize?: number | null }

export type TCommentNode = {
  id: string
  createdAt?: string | null
  createdBy?: string | null
  text: string
  files?: Connection<TCommentFile> | null
}

export type TAddCommentOutcome = 'posted' | 'posted-without-attachments'

export type TEntityComments = {
  comments: TCommentNode[]
  totalCount: number
  isLoading: boolean
  error: Error | null
  canAttachFiles: boolean
  addComment: (html: string, files: File[]) => Promise<TAddCommentOutcome>
  editComment: (commentId: string, html: string) => Promise<void>
  removeComment: (commentId: string) => Promise<void>
}

type TGraphQLClient = ReturnType<typeof useGraphQLClient>['client']

type TEntityCommentRequests = {
  queryKeyPrefix: string
  entityId: string | null | undefined
  fetchComments: (client: TGraphQLClient, entityId: string) => Promise<(Connection<TCommentNode> & { totalCount: number }) | null | undefined>
  addComment: (client: TGraphQLClient, entityId: string, text: string, withCommentId: boolean) => Promise<string | void>
  editComment: (client: TGraphQLClient, commentId: string, text: string) => Promise<unknown>
  attachFiles?: (commentId: string, files: File[]) => Promise<unknown>
}

type TCommentsPage = { comments: TCommentNode[]; totalCount: number }

const NO_COMMENTS: TCommentsPage = { comments: [], totalCount: 0 }

const requireEntityId = (entityId: string | null | undefined): string => {
  if (!entityId) throw new UserFacingError('Select a record before commenting.')
  return entityId
}

export const useEntityComments = ({ queryKeyPrefix, entityId, fetchComments, addComment, editComment, attachFiles }: TEntityCommentRequests): TEntityComments => {
  const { client, queryClient } = useGraphQLClient()

  const { data, isPending, error } = useQuery<TCommentsPage, Error>({
    queryKey: [queryKeyPrefix, entityId],
    queryFn: async () => {
      const connection = await fetchComments(client, requireEntityId(entityId))
      return { comments: getNodes(connection), totalCount: connection?.totalCount ?? 0 }
    },
    enabled: !!entityId,
    placeholderData: undefined,
  })

  const invalidate = useCallback((id: string) => queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, id] }), [queryClient, queryKeyPrefix])

  const { mutateAsync: add } = useMutation({
    mutationFn: async ({ id, text, files }: { id: string; text: string; files: File[] }): Promise<TAddCommentOutcome> => {
      const withAttachments = !!attachFiles && files.length > 0
      const commentId = await addComment(client, id, text, withAttachments)
      if (!withAttachments) return 'posted'
      if (!commentId) return 'posted-without-attachments'
      try {
        await attachFiles(commentId, files)
        return 'posted'
      } catch {
        return 'posted-without-attachments'
      }
    },
    onSettled: (_, __, { id }) => invalidate(id),
  })
  const { mutateAsync: edit } = useMutation({
    mutationFn: (variables: { id: string; commentId: string; text: string }) => editComment(client, variables.commentId, variables.text),
    onSuccess: (_, { id }) => invalidate(id),
  })
  const { mutateAsync: deleteNote } = useDeleteNote()

  const addCommentToEntity = useCallback((text: string, files: File[]) => add({ id: requireEntityId(entityId), text, files }), [add, entityId])
  const editCommentById = useCallback(
    async (commentId: string, text: string) => {
      await edit({ id: requireEntityId(entityId), commentId, text })
    },
    [edit, entityId],
  )
  const removeComment = useCallback(
    async (commentId: string) => {
      const id = requireEntityId(entityId)
      await deleteNote({ deleteNoteId: commentId })
      await invalidate(id)
    },
    [deleteNote, invalidate, entityId],
  )

  const page = data ?? NO_COMMENTS

  return {
    comments: page.comments,
    totalCount: page.totalCount,
    isLoading: !!entityId && isPending && !error,
    error,
    canAttachFiles: !!attachFiles,
    addComment: addCommentToEntity,
    editComment: editCommentById,
    removeComment,
  }
}

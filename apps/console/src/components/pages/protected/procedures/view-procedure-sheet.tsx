'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { ChevronDown, ChevronRight, ExternalLink, PanelRightClose } from 'lucide-react'
import { Avatar } from '@/components/shared/avatar/avatar'
import { DocumentStatusBadge } from '@/components/shared/enum-mapper/policy-enum'
import PlateEditor from '@/components/shared/plate/plate-editor'
import AddComment from '@/components/shared/comments/AddComment'
import CommentList from '@/components/shared/comments/CommentList'
import { type TCommentData } from '@/components/shared/comments/types/TCommentData'
import { type TComments } from '@/components/shared/comments/types/TComments'
import { useGetProcedureDetailsById, useGetProcedureDiscussionById, useGetProcedureCommentsById, useInsertProcedureComment, useUpdateProcedureComment } from '@/lib/graphql-hooks/procedure'
import { useDeleteNote } from '@/lib/graphql-hooks/control'
import { useGetOrgMemberships } from '@/lib/graphql-hooks/member'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useQueryClient } from '@tanstack/react-query'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { type Value } from 'platejs'
import { type Group, type ProcedureByIdFragment } from '@repo/codegen/src/schema'
import { GenericDetailsSheet, type RenderFieldsProps, type RenderHeaderProps } from '@/components/shared/crud-base/generic-sheet'
import { useForm } from 'react-hook-form'
import { ObjectTypes } from '@repo/codegen/src/type-names'

type Props = {
  procedureId: string | null
  onClose: () => void
}

export const ViewProcedureSheet: React.FC<Props> = ({ procedureId, onClose }) => {
  const router = useRouter()
  const [detailsOpen, setDetailsOpen] = useState(true)
  const form = useForm()
  const normalizeData = useCallback(() => ({}), [])
  const { data, isLoading } = useGetProcedureDetailsById(procedureId, !!procedureId)
  const { data: discussionData } = useGetProcedureDiscussionById(procedureId)
  const { data: commentsData, isLoading: commentsLoading } = useGetProcedureCommentsById(procedureId)
  const { mutateAsync: insertComment } = useInsertProcedureComment()
  const { mutateAsync: updateComment } = useUpdateProcedureComment()
  const { mutateAsync: deleteNote } = useDeleteNote()
  const { errorNotification } = useNotification()
  const queryClient = useQueryClient()
  const plateEditorHelper = usePlateEditor()

  const procedure = data?.procedure
  const commentEdges = useMemo(() => commentsData?.procedure?.comments?.edges ?? [], [commentsData])

  const userIds = useMemo(() => {
    return [...new Set(commentEdges.map((e) => e?.node?.createdBy).filter((id): id is string => typeof id === 'string'))]
  }, [commentEdges])

  const { data: userData, isLoading: usersLoading } = useGetOrgMemberships({
    where: { hasUserWith: [{ idIn: userIds }] },
    enabled: userIds.length > 0,
  })

  const userMap = useMemo(() => {
    const map: Record<string, { id: string; displayName?: string | null; avatarFile?: { presignedURL?: string | null } | null; avatarRemoteURL?: string | null }> = {}
    userData?.orgMemberships?.edges?.forEach((edge) => {
      const user = edge?.node?.user
      if (user) map[user.id] = user
    })
    return map
  }, [userData])

  const comments: TCommentData[] = useMemo(() => {
    return commentEdges.flatMap((item) => {
      const node = item?.node
      if (!node) return []
      const user = node.createdBy ? userMap[node.createdBy] : undefined
      const avatarUrl = user?.avatarFile?.presignedURL || user?.avatarRemoteURL
      return [
        {
          id: node.id,
          comment: node.text ?? '',
          avatarUrl: avatarUrl ?? undefined,
          createdAt: String(node.createdAt ?? ''),
          userName: user?.displayName || 'Deleted user',
          createdBy: node.createdBy ?? '',
        },
      ]
    })
  }, [commentEdges, userMap])

  const handleSendComment = useCallback(
    async (data: TComments) => {
      if (!procedureId) return
      try {
        const comment = await plateEditorHelper.convertToHtml(data.comment)
        await insertComment({ updateProcedureId: procedureId, input: { addComment: { text: comment } } })
        queryClient.invalidateQueries({ queryKey: ['procedureComments', procedureId] })
      } catch (error) {
        errorNotification({ title: 'Error', description: parseErrorMessage(error) })
      }
    },
    [procedureId, insertComment, queryClient, plateEditorHelper, errorNotification],
  )

  const handleEditComment = useCallback(
    async (commentId: string, newValue: string) => {
      try {
        await updateComment({ updateProcedureCommentId: commentId, input: { text: newValue } })
        queryClient.invalidateQueries({ queryKey: ['procedureComments', procedureId] })
      } catch (error) {
        errorNotification({ title: 'Error', description: parseErrorMessage(error) })
      }
    },
    [updateComment, queryClient, procedureId, errorNotification],
  )

  const handleRemoveComment = useCallback(
    async (commentId: string) => {
      try {
        await deleteNote({ deleteNoteId: commentId })
        queryClient.invalidateQueries({ queryKey: ['procedureComments', procedureId] })
      } catch (error) {
        errorNotification({ title: 'Error', description: parseErrorMessage(error) })
      }
    },
    [deleteNote, queryClient, procedureId, errorNotification],
  )

  const renderHeader = useCallback(
    ({ close }: RenderHeaderProps) => (
      <SheetHeader>
        <SheetTitle className="sr-only">Procedure</SheetTitle>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PanelRightClose size={16} className="cursor-pointer" onClick={close} />
          </div>
          <div className="flex items-center gap-2 mr-6">
            <Button
              variant="secondary"
              icon={<ExternalLink />}
              iconPosition="left"
              onClick={() => {
                if (procedureId) {
                  close()
                  router.push(`/procedures/${procedureId}/view`)
                }
              }}
            >
              Open Full
            </Button>
          </div>
        </div>
      </SheetHeader>
    ),
    [procedureId, router],
  )

  const renderFields = useCallback(
    ({ data: p }: RenderFieldsProps<ProcedureByIdFragment, never>) => {
      if (!p) return null
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-semibold">{p.name}</h2>
            {p.status && <DocumentStatusBadge status={p.status} />}
          </div>

          {p.approver && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Approver</p>
              <div className="flex items-center gap-2">
                <Avatar entity={p.approver as Group} />
                <span className="text-sm">{p.approver.displayName}</span>
              </div>
            </div>
          )}

          <div>
            <button className="flex items-center gap-1 text-sm font-medium w-full text-left mb-2" onClick={() => setDetailsOpen((o) => !o)}>
              {detailsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              Details
            </button>
            {detailsOpen && (
              <PlateEditor
                key={JSON.stringify(p.detailsJSON ?? p.details)}
                initialValue={p.detailsJSON ? (p.detailsJSON as Value) : (p.details ?? undefined)}
                entity={discussionData?.procedure}
                readonly={true}
                variant="readonly"
                toolbarClassName="hidden"
              />
            )}
          </div>
        </div>
      )
    },
    [detailsOpen, discussionData],
  )

  const commentsSection = (
    <div className="space-y-3 px-1 pb-4">
      <p className="text-sm font-medium">Comments</p>
      {(commentsLoading || usersLoading) && commentEdges.length > 0 ? (
        <div className="space-y-2">
          {commentEdges.map((_, i) => (
            <Skeleton key={i} height={56} />
          ))}
        </div>
      ) : (
        <CommentList comments={comments} onEdit={handleEditComment} onRemove={handleRemoveComment} />
      )}
      <AddComment onSuccess={handleSendComment} />
    </div>
  )

  return (
    <GenericDetailsSheet
      objectType={ObjectTypes.PROCEDURE}
      form={form}
      entityId={procedureId}
      data={procedure}
      isFetching={isLoading}
      normalizeData={normalizeData}
      onClose={onClose}
      basePath="/procedures"
      renderHeader={renderHeader}
      renderFields={renderFields}
      extraContent={commentsSection}
    />
  )
}

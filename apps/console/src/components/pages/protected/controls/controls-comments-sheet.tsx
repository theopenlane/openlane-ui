'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { ArrowDownUp, ArrowUpDown } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/hooks/useNotification'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import CommentList from '@/components/shared/comments/CommentList'
import AddComment from '@/components/shared/comments/AddComment'
import { TComments } from '@/components/shared/comments/types/TComments'
import { TCommentData } from '@/components/shared/comments/types/TCommentData'
import { useGetUsers } from '@/lib/graphql-hooks/user'
import { useSearchParams } from 'next/navigation'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useUpdateControl } from '@/lib/graphql-hooks/controls' // 🟢 create/use this hook
import { ControlQuery, UserWhereInput } from '@repo/codegen/src/schema'

type ControlCommentsSheetProps = {
  controlData?: ControlQuery['control']
  onClose?: () => void
}

const ControlCommentsSheet: React.FC<ControlCommentsSheetProps> = ({ controlData, onClose }) => {
  const searchParams = useSearchParams()
  const id = searchParams.get('id') // control ID from URL if needed

  const [commentSortIsAsc, setCommentSortIsAsc] = useState(false)
  const [comments, setComments] = useState<TCommentData[]>([])

  const { mutateAsync: updateControl } = useUpdateControl()
  const queryClient = useQueryClient()
  const { errorNotification } = useNotification()
  const plateEditorHelper = usePlateEditor()

  const where: UserWhereInput | undefined = controlData?.comments
    ? {
        idIn: controlData.comments.edges?.map((item) => item?.node?.createdBy).filter((id): id is string => typeof id === 'string'),
      }
    : undefined

  const { data: userData } = useGetUsers(where)

  const handleSendComment = useCallback(
    async (data: TComments) => {
      if (!id) return
      try {
        const comment = await plateEditorHelper.convertToHtml(data.comment)
        await updateControl({
          updateControlId: id,
          input: { addComment: { text: comment } },
        })
        queryClient.invalidateQueries({ queryKey: ['controls'] })
      } catch (error) {
        const errorMessage = parseErrorMessage(error)
        errorNotification({ title: 'Error', description: errorMessage })
      }
    },
    [id, plateEditorHelper, updateControl, queryClient, errorNotification],
  )

  const handleCommentSort = () => {
    const sorted = [...comments].sort((a, b) =>
      commentSortIsAsc ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    setCommentSortIsAsc((prev) => !prev)
    setComments(sorted)
  }

  useEffect(() => {
    if (controlData && userData?.users?.edges?.length) {
      const mapped = (controlData?.comments || [])?.edges?.map((item) => {
        const user = userData.users.edges?.find((u) => u?.node?.id === item?.node?.createdBy)?.node
        const avatarUrl = user?.avatarFile?.presignedURL || user?.avatarRemoteURL
        return {
          comment: item?.node?.text,
          avatarUrl,
          createdAt: item?.node?.createdAt,
          userName: user?.displayName,
          createdBy: item?.node?.createdBy,
          id: item?.node?.id || '',
        } as TCommentData
      })
      const sorted = mapped.sort((a, b) => new Date(!commentSortIsAsc ? b.createdAt : a.createdAt).getTime() - new Date(!commentSortIsAsc ? a.createdAt : b.createdAt).getTime())
      setComments(sorted)
    }
  }, [commentSortIsAsc, controlData, userData])

  return (
    <div className="p-4 w-full h-full overflow-y-auto">
      <div className="flex justify-between items-end mb-2">
        <p className="text-lg font-semibold">Control Comments</p>
        <div className="flex items-center gap-1 text-right cursor-pointer" onClick={handleCommentSort}>
          {commentSortIsAsc ? <ArrowDownUp height={16} width={16} /> : <ArrowUpDown height={16} width={16} className="text-primary" />}
          <p className="text-sm">Newest at bottom</p>
        </div>
      </div>

      <CommentList comments={comments} />
      <AddComment onSuccess={handleSendComment} />
    </div>
  )
}

export default ControlCommentsSheet

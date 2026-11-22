import React, { useRef } from 'react'
import { RotateCcw } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { Button } from '@repo/ui/button'
import { useUpdateDiscussion } from '@/lib/graphql-hooks/discussion'
import { useNotification } from '@/hooks/useNotification'
import { useHasOrgFullAccess } from '@/lib/query-hooks/permissions'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

type TReopenDiscussionButtonProps = {
  discussionId: string
  authorId: string | undefined
}

export const ReopenDiscussionButton: React.FC<TReopenDiscussionButtonProps> = ({ discussionId, authorId }) => {
  const { data: session } = useSession()
  const hasOrgFullAccess = useHasOrgFullAccess()
  const { mutateAsync: updateDiscussion, isPending } = useUpdateDiscussion()
  const { errorNotification } = useNotification()
  const isReopeningRef = useRef(false)

  const currentUserId = session?.user?.userId
  const canReopen = (!!authorId && authorId === currentUserId) || hasOrgFullAccess

  if (!canReopen) return null

  const reopen = async () => {
    if (isReopeningRef.current) return
    isReopeningRef.current = true
    try {
      await updateDiscussion({ updateDiscussionId: discussionId, input: { isResolved: false } })
    } catch (error) {
      errorNotification({ title: 'Failed to reopen discussion', description: parseErrorMessage(error) })
    } finally {
      isReopeningRef.current = false
    }
  }

  return (
    <Button type="button" variant="secondary" icon={<RotateCcw />} iconPosition="left" disabled={isPending} loading={isPending} onClick={() => void reopen()}>
      Reopen
    </Button>
  )
}

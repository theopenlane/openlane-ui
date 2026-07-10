import { useGetEvidenceComments } from '@/lib/graphql-hooks/evidence'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import EvidenceCommentSheet from './evidence-comments-sheet'
import { Card } from '@repo/ui/cardpanel'
import { Link, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { SheetContent, SheetHeader, Sheet } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { useNotification } from '@/hooks/useNotification'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { formatDateTime } from '@/utils/date'
import { resolveAuthor } from '@/lib/authors'
import { AuthorDisplay } from '@/components/shared/user-display/author-cell'

const EvidenceCommentsCard = () => {
  const searchParams = useSearchParams()
  const evidenceId = searchParams.get('id') || searchParams.get('controlEvidenceId')
  const { data } = useGetEvidenceComments(evidenceId)
  const [sheetOpen, setSheetOpen] = useState(false)
  const { successNotification, errorNotification } = useNotification()
  const smartRouter = useSmartRouter()
  const plateEditorHelper = usePlateEditor()

  const commentsData = data?.evidence.comments.edges
  const totalComments = commentsData?.length ?? 0
  const hasData = commentsData && commentsData.length > 0

  const userIds = useMemo(() => (hasData ? Array.from(new Set(commentsData.map((item) => item?.node?.createdBy).filter((id): id is string => typeof id === 'string'))) : []), [commentsData, hasData])

  const { userMap, tokenMap, isLoading: isUsersLoading } = useAuthorMaps(userIds)

  const latestComment = useMemo(() => {
    if (!hasData) return null
    const sorted = [...commentsData].sort((a, b) => new Date(b?.node?.createdAt).getTime() - new Date(a?.node?.createdAt).getTime())
    return sorted[0]?.node ?? null
  }, [commentsData, hasData])

  const latestCommentAuthor = useMemo(() => resolveAuthor(latestComment?.createdBy, { userMap, tokenMap }), [latestComment?.createdBy, tokenMap, userMap])

  const handleCopyLink = () => {
    if (!evidenceId) return
    const params = new URLSearchParams(window.location.search)
    params.set('showComments', 'true')
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`
    navigator.clipboard
      .writeText(url)
      .then(() => {
        successNotification({
          title: 'Link copied to clipboard',
        })
      })
      .catch(() => {
        errorNotification({
          title: 'Failed to copy link',
        })
      })
  }

  const handleOpenSheet = () => {
    if (!evidenceId) return
    smartRouter.push({ showComments: 'true' })
  }

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      smartRouter.push({ showComments: null })
    }
  }

  useEffect(() => {
    const showComments = searchParams.get('showComments')
    if (!sheetOpen && showComments === 'true') {
      setSheetOpen(true)
    }
    if (sheetOpen && !showComments) {
      setSheetOpen(false)
    }
  }, [searchParams, sheetOpen])

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <p className="text-lg font-semibold">Comments</p>
          {totalComments > 0 && <span className="inline-flex items-center justify-center min-w-5 h-5 text-xs rounded-full bg-secondary bg-rounded">{totalComments}</span>}
        </div>

        <Button type="button" className="h-8 p-2" variant="secondary" icon={<PanelRightOpen />} onClick={handleOpenSheet}>
          View & Add Comments
        </Button>
      </div>
      <p className="text-gray-500 mb-3">Latest Comment</p>
      {hasData && latestComment ? (
        <div className="flex items-start gap-3 mb-3">
          {isUsersLoading ? (
            <>
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex flex-col min-w-0 flex-1 gap-2">
                <div className="flex items-center gap-2">
                  <Skeleton height={14} width={100} className="rounded" />
                  <Skeleton height={12} width={80} className="rounded" />
                </div>
                <Skeleton height={14} width="80%" className="rounded" />
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <AuthorDisplay author={latestCommentAuthor} className="font-medium truncate" avatarClassName="h-8 w-8" />
                  <p className="text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(latestComment.createdAt)}</p>
                </div>
                <div className="text-sm text-muted-foreground line-clamp-2 overflow-hidden mt-0.5">{plateEditorHelper.convertToReadOnly(latestComment.text, 0, { padding: 0 })}</div>
              </div>
            </>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-3">No comments yet</p>
      )}

      <Sheet open={sheetOpen} onOpenChange={handleOpenChange}>
        <SheetContent
          header={
            <SheetHeader>
              <div className="flex items-center justify-between">
                <PanelRightClose aria-label="Close detail sheet" size={16} className="cursor-pointer" onClick={() => handleOpenChange(false)} />

                <div className="flex justify-end gap-2">
                  <Button icon={<Link />} iconPosition="left" variant="secondary" onClick={handleCopyLink}>
                    Copy link
                  </Button>
                </div>
              </div>
            </SheetHeader>
          }
        >
          <EvidenceCommentSheet />
        </SheetContent>
      </Sheet>
    </Card>
  )
}

export default EvidenceCommentsCard

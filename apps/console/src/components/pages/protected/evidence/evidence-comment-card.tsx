import { useGetEvidenceComments } from '@/lib/graphql-hooks/evidence'
import { useGetOrgMemberships } from '@/lib/graphql-hooks/members'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import EvidenceCommentSheet from './evidence-comments-sheet'
import { Card } from '@repo/ui/cardpanel'
import { Link, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { SheetContent, SheetHeader, Sheet } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import { useNotification } from '@/hooks/useNotification'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { formatDateTime } from '@/utils/date'

const EvidenceCommentsCard = () => {
  const searchParams = useSearchParams()
  const evidenceId = searchParams.get('id')
  const { data } = useGetEvidenceComments(evidenceId)
  const [sheetOpen, setSheetOpen] = useState(false)
  const { successNotification, errorNotification } = useNotification()
  const router = useRouter()
  const plateEditorHelper = usePlateEditor()

  const commentsData = data?.evidence.comments.edges
  const totalComments = commentsData?.length ?? 0
  const hasData = commentsData && commentsData.length > 0

  const userIds = useMemo(() => (hasData ? Array.from(new Set(commentsData.map((item) => item?.node?.createdBy).filter((id): id is string => typeof id === 'string'))) : []), [commentsData, hasData])

  const { data: userData } = useGetOrgMemberships({
    where: {
      hasUserWith: userIds.map((id) => ({ id })),
    },
    enabled: userIds.length > 0,
  })

  const latestComment = useMemo(() => {
    if (!hasData) return null
    const sorted = [...commentsData].sort((a, b) => new Date(b?.node?.createdAt).getTime() - new Date(a?.node?.createdAt).getTime())
    return sorted[0]?.node ?? null
  }, [commentsData, hasData])

  const latestCommentUser = useMemo(() => {
    if (!latestComment || !userData?.orgMemberships?.edges) return null
    const membership = userData.orgMemberships.edges.find((edge) => edge?.node?.user?.id === latestComment.createdBy)
    return membership?.node?.user ?? null
  }, [latestComment, userData])

  const handleCopyLink = () => {
    if (!evidenceId) return
    const url = `${window.location.origin}${window.location.pathname}?id=${evidenceId}&showComments=true`
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
    router.push(`/evidence?id=${evidenceId}&showComments=true`)
  }

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      router.push(`/evidence?id=${evidenceId}`)
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
          See All
        </Button>
      </div>
      <p className="text-gray-500 mb-3">Latest Comment</p>
      {hasData && latestComment ? (
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-8 w-8 border border-border shrink-0" title={latestCommentUser?.displayName}>
            {latestCommentUser?.avatarFile?.presignedURL || latestCommentUser?.avatarRemoteURL ? (
              <AvatarImage src={(latestCommentUser.avatarFile?.presignedURL || latestCommentUser.avatarRemoteURL)!} alt={latestCommentUser?.displayName || 'User'} />
            ) : (
              <AvatarFallback>{latestCommentUser?.displayName?.slice(0, 2).toUpperCase() || '?'}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <p className="text-sm font-medium truncate">{latestCommentUser?.displayName || 'Unknown'}</p>
              <p className="text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(latestComment.createdAt)}</p>
            </div>
            <div className="text-sm text-muted-foreground line-clamp-2 overflow-hidden mt-0.5">{plateEditorHelper.convertToReadOnly(latestComment.text, 0, { padding: 0 })}</div>
          </div>
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

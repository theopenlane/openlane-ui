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

const MAX_AVATARS = 5

const EvidenceCommentsCard = () => {
  const searchParams = useSearchParams()
  const evidenceId = searchParams.get('id')
  const { data } = useGetEvidenceComments(evidenceId)
  const [sheetOpen, setSheetOpen] = useState(false)
  const { successNotification, errorNotification } = useNotification()
  const router = useRouter()

  const commentsData = data?.evidence.comments.edges

  const hasData = commentsData && commentsData.length > 0

  const userIds = useMemo(() => (hasData ? Array.from(new Set(commentsData.map((item) => item?.node?.createdBy).filter((id): id is string => typeof id === 'string'))) : []), [commentsData, hasData])

  const { data: userData } = useGetOrgMemberships({
    where: {
      hasUserWith: userIds.map((id) => ({ id })),
    },
    enabled: userIds.length > 0,
  })

  const { visibleUsers, extraCount } = useMemo(() => {
    const usersEdge = userData?.orgMemberships?.edges?.map((edge) => edge) || []
    const allUsers = usersEdge.map((e) => e?.node?.user).filter(Boolean)
    const visible = allUsers.slice(0, MAX_AVATARS)
    const remaining = Math.max(0, allUsers.length - MAX_AVATARS)
    return { visibleUsers: visible, extraCount: remaining }
  }, [userData])

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
      <div className="flex justify-between items-center mb-5">
        <p className="text-lg font-semibold">Comments</p>
        <Button type="button" className="h-8 p-2" variant="secondary" icon={<PanelRightOpen />} onClick={handleOpenSheet}>
          Open
        </Button>
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        {hasData && visibleUsers.length > 0 ? (
          <>
            {visibleUsers.map((user) => {
              const avatarUrl = user?.avatarFile?.presignedURL || user?.avatarRemoteURL
              const initials = user?.displayName?.slice(0, 2).toUpperCase() || '?'

              return (
                <Avatar key={user?.id} className="h-8 w-8 border border-border" title={user?.displayName}>
                  {avatarUrl ? <AvatarImage src={avatarUrl} alt={user?.displayName || 'User'} /> : <AvatarFallback>{initials}</AvatarFallback>}
                </Avatar>
              )
            })}
            {extraCount > 0 && <span className="text-xs text-muted-foreground font-medium ml-1">+{extraCount} more</span>}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No comments yet</p>
        )}
      </div>

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

'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import { Sheet, SheetContent, SheetHeader } from '@repo/ui/sheet'
import { Link, PanelRightClose, PanelRightOpen } from 'lucide-react'
import ControlCommentsSheet from './controls-comments-sheet'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useGetControlComments } from '@/lib/graphql-hooks/controls'
import { UserWhereInput } from '@repo/codegen/src/schema'
import { useGetUsers } from '@/lib/graphql-hooks/user'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import { useGetSubcontrolComments } from '@/lib/graphql-hooks/subcontrol'
import { useNotification } from '@/hooks/useNotification'

const MAX_AVATARS = 5

const ControlCommentsCard = () => {
  const [sheetOpen, setSheetOpen] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { successNotification, errorNotification } = useNotification()
  const { id, subcontrolId } = useParams<{ id: string; subcontrolId?: string }>()
  const { data: controlComments } = useGetControlComments(subcontrolId ? undefined : id)
  const { data: subcontrolComments } = useGetSubcontrolComments(subcontrolId ? subcontrolId : undefined)

  const commentsData = subcontrolId ? subcontrolComments?.subcontrol?.comments?.edges : controlComments?.control?.comments?.edges

  const hasData = commentsData && commentsData.length > 0

  const where: UserWhereInput | undefined = hasData
    ? {
        idIn: commentsData.map((item) => item?.node?.createdBy).filter((id): id is string => typeof id === 'string'),
      }
    : undefined

  const { data: userData } = useGetUsers(where)

  const { visibleUsers, extraCount } = useMemo(() => {
    const users = userData?.users?.edges ?? []
    const allUsers = users.map((u) => u?.node).filter(Boolean)
    const visible = allUsers.slice(0, MAX_AVATARS)
    const remaining = Math.max(0, allUsers.length - MAX_AVATARS)
    return { visibleUsers: visible, extraCount: remaining }
  }, [userData])

  const handleOpenSheet = () => {
    router.push(subcontrolId ? `/controls/${id}/${subcontrolId}?showComments=true` : `/controls/${id}/?showComments=true`)
  }

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      router.push(subcontrolId ? `/controls/${id}/${subcontrolId}` : `/controls/${id}`)
    }
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?showComments=true`
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
        <Button type="button" className="h-8 p-2" variant="outline" icon={<PanelRightOpen />} onClick={handleOpenSheet}>
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
                  <Button icon={<Link />} iconPosition="left" variant="outline" onClick={handleCopyLink}>
                    Copy link
                  </Button>
                </div>
              </div>
            </SheetHeader>
          }
        >
          <ControlCommentsSheet />
        </SheetContent>
      </Sheet>
    </Card>
  )
}

export default ControlCommentsCard

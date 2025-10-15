'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import { Sheet, SheetContent } from '@repo/ui/sheet'
import { PanelRightOpen } from 'lucide-react'
import ControlCommentsSheet from './controls-comments-sheet'
import { useParams } from 'next/navigation'
import { useGetControlComments } from '@/lib/graphql-hooks/controls'
import { UserWhereInput } from '@repo/codegen/src/schema'
import { useGetUsers } from '@/lib/graphql-hooks/user'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'

const MAX_AVATARS = 5

const ControlCommentsCard = () => {
  const [sheetOpen, setSheetOpen] = useState(false)
  const { id, subcontrolId } = useParams<{ id: string; subcontrolId?: string }>()
  const { data } = useGetControlComments(subcontrolId ? subcontrolId : id)

  const where: UserWhereInput | undefined = data?.control?.comments
    ? {
        idIn: data.control.comments.edges?.map((item) => item?.node?.createdBy).filter((id): id is string => typeof id === 'string'),
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

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-5">
        <p className="text-lg font-semibold">Comments</p>
        <Button type="button" className="h-8 p-2" variant="outline" icon={<PanelRightOpen />} onClick={() => setSheetOpen(true)}>
          Open
        </Button>
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        {visibleUsers.length > 0 ? (
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

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <ControlCommentsSheet />
        </SheetContent>
      </Sheet>
    </Card>
  )
}

export default ControlCommentsCard

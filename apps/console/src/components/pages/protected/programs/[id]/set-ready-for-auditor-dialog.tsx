'use client'

import { Button } from '@repo/ui/button'
import { Info, Pencil } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import React, { useMemo, useState } from 'react'
import { useUpdateProgram } from '@/lib/graphql-hooks/program'
import { useQueryClient } from '@tanstack/react-query'
import { InviteRole, OrgMembershipRole, ProgramProgramStatus } from '@repo/codegen/src/schema'
import { useParams } from 'next/navigation'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import MembersInviteSheet from '@/components/pages/protected/user-management/members/sidebar/members-invite-sheet'
import { useGetOrgMemberships } from '@/lib/graphql-hooks/member'

interface SetReadyForAuditorDialogProps {
  programStatus: ProgramProgramStatus
  email?: string | null
}

const SetReadyForAuditorDialog: React.FC<SetReadyForAuditorDialogProps> = ({ programStatus, email }: SetReadyForAuditorDialogProps) => {
  const [open, setOpen] = useState(false)
  const [isInviteSheetOpen, setIsInviteSheetOpen] = useState(false)
  const { mutateAsync: update } = useUpdateProgram()
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { members: auditorMemberships, isLoading } = useGetOrgMemberships({
    where: { role: OrgMembershipRole.AUDITOR },
    enabled: open,
  })

  const auditors = useMemo(() => auditorMemberships.filter((membership) => membership.user), [auditorMemberships])
  const defaultInvitationEmails = useMemo(() => (email ? [email] : []), [email])

  const handleSetReadyForAuditor = async () => {
    if (!id) return
    await update({
      updateProgramId: id,
      input: {
        auditorReady: true,
      },
    })
    queryClient.invalidateQueries({ queryKey: ['programs'] })
    setOpen(false)
  }
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button disabled={programStatus === ProgramProgramStatus.ARCHIVED} className="h-8! p-2!" variant="secondary" type="button" icon={<Pencil />} iconPosition="left">
            Ready for Auditor
          </Button>
        </DialogTrigger>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="max-w-[497px]">
          <DialogHeader>
            <DialogTitle>Set ready for auditor</DialogTitle>
          </DialogHeader>
          <div className="flex items-start gap-2 rounded-md border border-border bg-input p-4 ">
            <Info className="mt-1" size={16} />
            <div className="text-sm">
              <p className="text-base ">What will happen?</p>
              <p>This program will be marked as &quot;Auditor ready&quot;. All auditors in this organization will get a notification that the program is ready.</p>
            </div>
          </div>
          <div className="rounded-md border border-border p-4">
            <p className="mb-3 text-sm font-medium">Auditors to notify</p>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Fetching organization auditors...</p>
            ) : auditors.length > 0 ? (
              <div className="space-y-2">
                {auditors.map((membership) => (
                  <div key={membership.id} className="flex flex-col rounded-md bg-input px-3 py-2 text-sm">
                    <span>{membership.user.displayName || membership.user.email || 'Unnamed auditor'}</span>
                    {membership.user.email && <span className="text-muted-foreground">{membership.user.email}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">There are no auditors in your organisation. Invite the marked user as an AUDITOR.</p>
                <Button variant="secondary" type="button" onClick={() => setIsInviteSheetOpen(true)}>
                  Invite auditor
                </Button>
              </div>
            )}
          </div>
          <DialogFooter className="mt-6 flex gap-2">
            <Button onClick={handleSetReadyForAuditor}>Set ready</Button>
            <CancelButton onClick={() => setOpen(false)}></CancelButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <MembersInviteSheet
        isMemberSheetOpen={isInviteSheetOpen}
        setIsMemberSheetOpen={setIsInviteSheetOpen}
        defaultEmails={defaultInvitationEmails}
        defaultRole={InviteRole.AUDITOR}
        lockRoleChanges
        title="Invite Auditor"
      />
    </>
  )
}

export default SetReadyForAuditorDialog

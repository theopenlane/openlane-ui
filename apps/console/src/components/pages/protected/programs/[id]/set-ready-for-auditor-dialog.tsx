'use client'

import { MultiEmailInput } from '@/components/pages/protected/user-management/members/sidebar/multi-email-input'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useNotification } from '@/hooks/useNotification'
import { useOrganization } from '@/hooks/useOrganization'
import { useGetOrgMemberships, useUpdateUserRoleInOrg } from '@/lib/graphql-hooks/member'
import { useCreateBulkInvite, useGetOrganizationSetting } from '@/lib/graphql-hooks/organization'
import { useUpdateProgram } from '@/lib/graphql-hooks/program'
import { dedupeEmails, normalizeEmail } from '@/lib/validators'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { getEmailDomain } from '@/utils/strings'
import { type CreateInviteInput, InviteRole, OrgMembershipRole, ProgramProgramStatus } from '@repo/codegen/src/schema'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { useQueryClient } from '@tanstack/react-query'
import { Info, Pencil } from 'lucide-react'
import { useParams } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'
import { SSOExemptionDialog } from './sso-exemption-dialog'

interface SetReadyForAuditorDialogProps {
  programStatus: ProgramProgramStatus
  email?: string | null
}

const SetReadyForAuditorDialog: React.FC<SetReadyForAuditorDialogProps> = ({ programStatus, email }: SetReadyForAuditorDialogProps) => {
  const [open, setOpen] = useState(false)
  const [isSSOExemptionDialogOpen, setIsSSOExemptionDialogOpen] = useState(false)
  const [ssoExemptionEmails, setSSOExemptionEmails] = useState<string[]>([])
  const [ssoExemptionDomains, setSSOExemptionDomains] = useState<string[]>([])
  const [additionalAuditors, setAdditionalAuditors] = useState<string[]>([])
  const [isAdditionalEmailsValid, setIsAdditionalEmailsValid] = useState(true)
  const { mutateAsync: update, isPending: isUpdatingProgram } = useUpdateProgram()
  const { mutateAsync: inviteAuditors, isPending: isInvitingAuditors } = useCreateBulkInvite()
  const { mutateAsync: updateUserRoleInOrg, isPending: isUpdatingAuditorRoles } = useUpdateUserRoleInOrg()
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { currentOrgId } = useOrganization()
  const { errorNotification } = useNotification()
  const { members: auditorMemberships, isLoading } = useGetOrgMemberships({
    where: { role: OrgMembershipRole.AUDITOR },
    enabled: open,
  })
  const { data: orgSettingData, isLoading: isLoadingOrgSetting } = useGetOrganizationSetting(currentOrgId || '')
  const orgSetting = orgSettingData?.organization?.setting
  const auditorEmail = email?.trim().toLowerCase()
  const ssoExemptDomains = orgSetting?.ssoExemptDomains ?? []
  const hasAuditorEmail = auditorEmail !== undefined && auditorEmail.length > 0
  const isSSOEnforced = orgSetting?.identityProvider !== undefined && orgSetting.identityProvider !== 'NONE' && orgSetting.identityProviderLoginEnforced === true
  const { members: markedAuditorMemberships, isLoading: isLoadingMarkedAuditorMembership } = useGetOrgMemberships({
    where: { hasUserWith: [{ emailEqualFold: auditorEmail }] },
    pagination: { page: 1, pageSize: 1, query: { first: 1 } },
    enabled: open && hasAuditorEmail,
  })

  const auditors = useMemo(() => auditorMemberships.filter((membership) => membership.user), [auditorMemberships])
  const auditorEmails = useMemo(
    () =>
      new Set(
        auditors
          .map((membership) => membership.user.email)
          .filter(Boolean)
          .map((email) => normalizeEmail(email)),
      ),
    [auditors],
  )
  const shouldShowAutoInvitationNotice = hasAuditorEmail && !isLoadingMarkedAuditorMembership && markedAuditorMemberships.length === 0
  const isSubmitting = isUpdatingProgram || isInvitingAuditors || isUpdatingAuditorRoles

  const emailBlocklist = useMemo(() => {
    const set = new Set(auditorEmails)

    if (hasAuditorEmail) {
      set.add(auditorEmail)
    }

    return set
  }, [auditorEmail, auditorEmails, hasAuditorEmail])

  const emailsToAddAsAuditors = useMemo(() => {
    const emails = additionalAuditors.filter((email) => !auditorEmails.has(email))

    if (hasAuditorEmail && !auditorEmails.has(auditorEmail)) {
      emails.unshift(auditorEmail)
    }

    return emails
  }, [additionalAuditors, auditorEmail, auditorEmails, hasAuditorEmail])

  const { members: membershipsToAddAsAuditors, isLoading: isLoadingMembershipsToAddAsAuditors } = useGetOrgMemberships({
    where: { hasUserWith: [{ emailIn: emailsToAddAsAuditors }] },
    enabled: open && emailsToAddAsAuditors.length > 0,
  })

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)

    if (!nextOpen) {
      setAdditionalAuditors([])
      setIsAdditionalEmailsValid(true)
    }
  }

  useEffect(() => {
    setAdditionalAuditors((current) => current.filter((additionalEmail) => !emailBlocklist.has(additionalEmail)))
  }, [emailBlocklist])

  const handleNewAuditorEmails = (emails: string[]) => {
    const deduped = dedupeEmails(emails.map(normalizeEmail)).filter((email) => !emailBlocklist.has(email))

    setAdditionalAuditors(deduped)
    setIsAdditionalEmailsValid(true)
  }

  const getSSOExemptionRecipients = (emails: string[]) => {
    if (!isSSOEnforced) {
      return {
        emails: [],
        domains: [],
      }
    }

    const recipients: Array<{ email: string; domain: string }> = []

    emails.forEach((email) => {
      const domain = getEmailDomain(email)

      if (domain && !ssoExemptDomains.includes(domain)) {
        recipients.push({ email, domain })
      }
    })

    return {
      emails: recipients.map((recipient) => recipient.email),
      domains: Array.from(new Set(recipients.map((recipient) => recipient.domain))),
    }
  }

  const handleSetReadyForAuditor = async () => {
    if (!id) return

    try {
      const memberEmailKeys = new Set(membershipsToAddAsAuditors.map((membership) => normalizeEmail(membership.user.email)).filter(Boolean))
      const membershipsToUpdate = membershipsToAddAsAuditors.filter((membership) => membership.role !== OrgMembershipRole.AUDITOR)
      const inviteInputs: CreateInviteInput[] = emailsToAddAsAuditors
        .filter((auditorEmailToAdd) => !memberEmailKeys.has(normalizeEmail(auditorEmailToAdd)))
        .map((auditorEmailToAdd) => ({
          recipient: auditorEmailToAdd,
          role: InviteRole.AUDITOR,
        }))
      const ssoExemptionRecipients = getSSOExemptionRecipients(emailsToAddAsAuditors)

      await Promise.all([
        ...membershipsToUpdate.map((membership) =>
          updateUserRoleInOrg({
            updateOrgMemberId: membership.id,
            input: { role: OrgMembershipRole.AUDITOR },
          }),
        ),
        ...(inviteInputs.length > 0 ? [inviteAuditors({ input: inviteInputs })] : []),
      ])

      await update({
        updateProgramId: id,
        input: {
          auditorReady: true,
        },
      })
      queryClient.invalidateQueries({ queryKey: ['programs'] })
      queryClient.invalidateQueries({ queryKey: ['memberships'] })
      queryClient.invalidateQueries({ queryKey: ['invites'] })
      setSSOExemptionEmails(ssoExemptionRecipients.emails)
      setSSOExemptionDomains(ssoExemptionRecipients.domains)
      handleOpenChange(false)
      if (ssoExemptionRecipients.domains.length > 0) {
        setIsSSOExemptionDialogOpen(true)
      }
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
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
                <p className="text-sm text-muted-foreground">There are no auditors in your organization.</p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Invite additional auditors</p>
            <MultiEmailInput value={additionalAuditors} onChange={handleNewAuditorEmails} onValidChange={setIsAdditionalEmailsValid} />
          </div>
          {shouldShowAutoInvitationNotice && (
            <div className="flex items-start gap-2 rounded-md border border-border bg-input p-4">
              <Info className="mt-1" size={16} />
              <p className="text-sm text-muted-foreground">
                <strong>{email}</strong> will be invited to this org as an Auditor.
              </p>
            </div>
          )}
          <DialogFooter className="mt-6 flex gap-2">
            <Button onClick={handleSetReadyForAuditor} disabled={!isAdditionalEmailsValid || isLoadingMembershipsToAddAsAuditors || isLoadingOrgSetting || isSubmitting}>
              Set ready
            </Button>
            <CancelButton onClick={() => handleOpenChange(false)}></CancelButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <SSOExemptionDialog
        open={isSSOExemptionDialogOpen}
        onOpenChange={setIsSSOExemptionDialogOpen}
        emails={ssoExemptionEmails}
        domains={ssoExemptionDomains}
        organizationId={currentOrgId}
        organizationSettingId={orgSetting?.id}
        ssoExemptDomains={ssoExemptDomains}
      />
    </>
  )
}

export default SetReadyForAuditorDialog

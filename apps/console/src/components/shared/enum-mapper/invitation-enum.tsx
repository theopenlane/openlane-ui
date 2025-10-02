import { MailCheck, MailQuestion, MailX, Send } from 'lucide-react'
import { InviteInviteStatus } from '@repo/codegen/src/schema.ts'

export const InvitationIconMapper: Record<InviteInviteStatus, React.ReactNode> = {
  [InviteInviteStatus.INVITATION_SENT]: <Send height={16} width={16} className="text-invitation-sent" />,
  [InviteInviteStatus.INVITATION_EXPIRED]: <MailX height={16} width={16} className="text-invitation-expired" />,
  [InviteInviteStatus.INVITATION_ACCEPTED]: <MailCheck height={16} width={16} className="text-invitation-accepted" />,
  [InviteInviteStatus.APPROVAL_REQUIRED]: <MailQuestion height={16} width={16} className="text-needs-approval" />,
}

export const InvitationStatusMapper: Record<InviteInviteStatus, string> = {
  [InviteInviteStatus.INVITATION_SENT]: 'Outstanding',
  [InviteInviteStatus.INVITATION_EXPIRED]: 'Expired',
  [InviteInviteStatus.INVITATION_ACCEPTED]: 'Accepted',
  [InviteInviteStatus.APPROVAL_REQUIRED]: 'Approval required',
}

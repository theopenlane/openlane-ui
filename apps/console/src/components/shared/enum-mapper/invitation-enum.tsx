import { MailCheck, MailQuestion, MailX, Send } from 'lucide-react'
import { InviteInviteStatus } from '@repo/codegen/src/schema.ts'

export const InvitationIconMapper: Record<InviteInviteStatus, React.ReactNode> = {
  [InviteInviteStatus.INVITATION_SENT]: <Send height={16} width={16} className="text-invitation-sent" />,
  [InviteInviteStatus.INVITATION_EXPIRED]: <MailX height={16} width={16} className="text-invitation-expired" />,
  [InviteInviteStatus.INVITATION_ACCEPTED]: <MailCheck height={16} width={16} className="text-invitation-accepted" />,
  [InviteInviteStatus.APPROVAL_REQUIRED]: <MailQuestion height={16} width={16} className="text-needs-approval" />,
}

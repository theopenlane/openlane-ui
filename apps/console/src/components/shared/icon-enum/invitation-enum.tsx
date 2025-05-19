import { MailCheck, MailQuestion, MailX, Send } from 'lucide-react'
import { InviteInviteStatus } from '@repo/codegen/src/schema.ts'

export const InvitationIconMapper: Record<InviteInviteStatus, React.ReactNode> = {
  [InviteInviteStatus.INVITATION_SENT]: <Send height={16} width={16} />,
  [InviteInviteStatus.INVITATION_EXPIRED]: <MailX height={16} width={16} />,
  [InviteInviteStatus.INVITATION_ACCEPTED]: <MailCheck height={16} width={16} />,
  [InviteInviteStatus.APPROVAL_REQUIRED]: <MailQuestion height={16} width={16} />,
}

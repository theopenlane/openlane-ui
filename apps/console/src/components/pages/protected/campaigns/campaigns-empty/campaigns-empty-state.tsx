import React from 'react'
import { ClipboardCheck, SquarePlus } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import { Button } from '@repo/ui/button'
import { Callout } from '@/components/shared/callout/callout'

type TCampaignsEmptyStateProps = {
  onCreateCampaign: () => void
}

const CampaignsEmptyState: React.FC<TCampaignsEmptyStateProps> = ({ onCreateCampaign }) => (
  <Card className="flex flex-col items-center gap-4 px-6 py-10">
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/40">
      <ClipboardCheck size={28} className="text-[var(--color-info)]" />
    </div>
    <div className="max-w-md text-center">
      <h3 className="text-lg font-semibold">You haven&apos;t created any campaigns yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">Campaigns help you collect information, deliver training, and automate recurring outreach.</p>
    </div>
    <Button variant="primary" icon={<SquarePlus size={16} />} iconPosition="left" onClick={onCreateCampaign}>
      Create your first campaign
    </Button>
    <Callout variant="info" title="What are campaigns?" className="w-full max-w-2xl text-left">
      <p className="mb-3">
        A campaign sends a questionnaire, acknowledgement, or notification to a group of recipients and tracks who has responded. Recipients can be your own personnel or external contacts such as
        vendors, and each campaign keeps a record of what was sent, to whom, and when it was completed.
      </p>

      <p className="mb-3">Campaigns give you the evidence that outreach actually happened, so you can show auditors that training was delivered and vendor reviews were carried out on schedule.</p>

      <p className="font-medium">Common examples include:</p>
      <ul className="list-inside list-disc space-y-1">
        <li>
          <strong>Vendor security assessments</strong> – send a questionnaire to vendors and collect their answers.
        </li>
        <li>
          <strong>Employee security training</strong> – deliver training and track completion across your personnel.
        </li>
        <li>
          <strong>Policy acknowledgements</strong> – ask employees to confirm they have read a policy.
        </li>
        <li>
          <strong>Recurring outreach</strong> – repeat a campaign on a schedule, such as a quarterly vendor review.
        </li>
      </ul>
    </Callout>
  </Card>
)

export default CampaignsEmptyState

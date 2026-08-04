import React from 'react'
import { ClipboardCheck, SquarePlus } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import { Button } from '@repo/ui/button'

type TCampaignsEmptyStateProps = {
  onCreateCampaign: () => void
}

const CampaignsEmptyState: React.FC<TCampaignsEmptyStateProps> = ({ onCreateCampaign }) => (
  <Card className="flex flex-col items-center gap-6 px-6 py-16">
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
  </Card>
)

export default CampaignsEmptyState

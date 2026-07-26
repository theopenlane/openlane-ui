import React from 'react'
import Link from 'next/link'
import { ChevronRight, Users } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { formatDateUntil } from '@/utils/date'
import { pluralizeWithCount } from '@/utils/strings'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { type TUpcomingCampaign, type TUpcomingCampaignKind } from '@/lib/graphql-hooks/campaign'

const kindLabels: Record<TUpcomingCampaignKind, string> = {
  LAUNCH: 'Launches',
  RUN: 'Runs',
  DUE: 'Due',
}

type TUpcomingCampaignsProps = {
  campaigns: TUpcomingCampaign[]
}

const UpcomingCampaigns: React.FC<TUpcomingCampaignsProps> = ({ campaigns }) => (
  <Card className="px-5 py-4">
    <h3 className="text-sm font-medium">Upcoming</h3>
    <p className="text-xs text-muted-foreground">Next campaigns to launch, run, or are due.</p>
    {campaigns.length === 0 ? (
      <p className="py-6 text-center text-sm text-muted-foreground">No upcoming campaigns scheduled.</p>
    ) : (
      <ul className="mt-3 divide-y">
        {campaigns.map((campaign) => (
          <li key={campaign.id}>
            <Link href={getHrefForObjectType('campaigns', { id: campaign.id })} className="flex items-center justify-between gap-4 py-3 hover:bg-muted/40">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{campaign.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {kindLabels[campaign.kind]} {formatDateUntil(campaign.date)}
                  {campaign.campaignType ? ` • ${getEnumLabel(campaign.campaignType)}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                <Users size={16} />
                <span>{pluralizeWithCount(campaign.recipientCount ?? 0, 'recipient')}</span>
                <ChevronRight size={16} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    )}
  </Card>
)

export default UpcomingCampaigns

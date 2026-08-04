import React from 'react'
import { CircleCheck, TriangleAlert, Users } from 'lucide-react'
import CampaignSummaryCard, { type TCampaignSummaryCardAccent } from '@/components/pages/protected/campaigns/summary/campaign-summary-card'
import UpcomingCampaigns from '@/components/pages/protected/campaigns/summary/upcoming-campaigns'
import { pluralize, pluralizeWithCount } from '@/utils/strings'
import { COMPLETED_RECENTLY_WINDOW_DAYS, type TCampaignSummary, type TCampaignSummaryScope } from '@/lib/graphql-hooks/campaign'

type TCampaignsSummaryProps = {
  summary: TCampaignSummary
  activeScope: TCampaignSummaryScope | null
  onScopeChange: (scope: TCampaignSummaryScope | null) => void
}

type TSummaryCardConfig = {
  scope: TCampaignSummaryScope
  title: string
  value: number
  unit: string
  accent: TCampaignSummaryCardAccent
  icon: React.ReactNode
  detail: string
  detailDescription?: string
}

const CampaignsSummary: React.FC<TCampaignsSummaryProps> = ({ summary, activeScope, onScopeChange }) => {
  const cards: TSummaryCardConfig[] = [
    {
      scope: 'active',
      title: 'Active campaigns',
      value: summary.activeCount,
      unit: pluralize(summary.activeCount, 'campaign'),
      accent: 'success',
      icon: <Users size={16} />,
      detail: summary.activeRecipientCountIsPartial ? `${summary.activeRecipientCount}+ recipients` : pluralizeWithCount(summary.activeRecipientCount, 'recipient'),
      detailDescription: 'Across all active campaigns',
    },
    {
      scope: 'needsAttention',
      title: 'Needs attention',
      value: summary.needsAttentionCount,
      unit: pluralize(summary.needsAttentionCount, 'campaign'),
      accent: 'warning',
      icon: <TriangleAlert size={16} />,
      detail: `${summary.overdueCount} overdue • ${summary.scheduledOverdueCount} scheduled to run`,
      detailDescription: 'Require your attention',
    },
    {
      scope: 'completedRecently',
      title: 'Completed recently',
      value: summary.completedRecentlyCount,
      unit: `in the last ${COMPLETED_RECENTLY_WINDOW_DAYS} days`,
      accent: 'info',
      icon: <CircleCheck size={16} />,
      detail: 'Campaigns finished recently',
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {cards.map(({ scope, ...card }) => (
          <CampaignSummaryCard key={scope} {...card} isFilterApplied={activeScope === scope} onToggleFilter={() => onScopeChange(activeScope === scope ? null : scope)} />
        ))}
      </div>
      <UpcomingCampaigns campaigns={summary.upcoming} />
    </div>
  )
}

export default React.memo(CampaignsSummary)

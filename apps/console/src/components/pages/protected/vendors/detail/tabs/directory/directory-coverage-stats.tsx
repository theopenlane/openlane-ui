import React from 'react'
import { Card } from '@repo/ui/cardpanel'

type DirectoryCoverageStatsProps = {
  totalGroups?: number
  totalAccounts?: number
  matchedAccounts?: number
}

const StatCard: React.FC<{ label: string; value: React.ReactNode; sublabel?: string }> = ({ label, value, sublabel }) => (
  <Card className="px-5 py-4">
    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="mt-2 text-3xl font-semibold leading-none">{value}</div>
    {sublabel && <div className="mt-1 text-xs text-muted-foreground">{sublabel}</div>}
  </Card>
)

const formatCount = (value?: number) => value ?? '—'

const DirectoryCoverageStats: React.FC<DirectoryCoverageStatsProps> = ({ totalGroups, totalAccounts, matchedAccounts }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
    <StatCard label="Total groups" value={formatCount(totalGroups)} />
    <StatCard label="Total members" value={formatCount(totalAccounts)} sublabel="unique accounts across all groups" />
    <StatCard label="Personnel coverage" value={`${formatCount(matchedAccounts)} / ${formatCount(totalAccounts)}`} sublabel="members matched to personnel" />
  </div>
)

export default DirectoryCoverageStats

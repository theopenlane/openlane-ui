import React from 'react'
import { Card } from '@repo/ui/cardpanel'

type DirectoryCoverageStatsProps = {
  totalGroups: number
  totalMemberships: number
  matchedMemberships: number
}

const StatCard: React.FC<{ label: string; value: React.ReactNode; sublabel?: string }> = ({ label, value, sublabel }) => (
  <Card className="px-5 py-4">
    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="mt-2 text-3xl font-semibold leading-none">{value}</div>
    {sublabel && <div className="mt-1 text-xs text-muted-foreground">{sublabel}</div>}
  </Card>
)

const DirectoryCoverageStats: React.FC<DirectoryCoverageStatsProps> = ({ totalGroups, totalMemberships, matchedMemberships }) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard label="Total groups" value={totalGroups} />
      <StatCard label="Total members" value={totalMemberships} sublabel="across all groups" />
      <StatCard label="Personnel coverage" value={`${matchedMemberships} / ${totalMemberships}`} sublabel="members matched" />
    </div>
  )
}

export default DirectoryCoverageStats

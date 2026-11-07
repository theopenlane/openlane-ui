'use client'

import React from 'react'
import { pluralizeWithCount } from '@/utils/strings'
import { type useVulnerabilityExposure } from './use-vulnerability-exposure'
import { EnvironmentChip } from './environment-chip'

type TExposureReportCountsProps = {
  exposure: Pick<ReturnType<typeof useVulnerabilityExposure>, 'isCountsError' | 'isCountsPending' | 'totalReports' | 'openReports' | 'groups' | 'hasNextPage'>
}

export const ExposureReportCounts: React.FC<TExposureReportCountsProps> = ({ exposure }) => (
  <div className="flex flex-wrap items-center gap-2 text-sm">
    {exposure.isCountsError ? (
      <span className="text-muted-foreground">Report counts are unavailable</span>
    ) : exposure.isCountsPending ? (
      <span className="text-muted-foreground">Counting reports…</span>
    ) : (
      <span>
        Reported in <strong>{pluralizeWithCount(exposure.totalReports ?? 0, 'place')}</strong> · <strong>{exposure.openReports ?? 0} open</strong>
      </span>
    )}
    {!exposure.hasNextPage && exposure.groups.map((group) => <EnvironmentChip key={group.environment} environment={group.environment} suffix={`${group.openCount} open`} />)}
  </div>
)

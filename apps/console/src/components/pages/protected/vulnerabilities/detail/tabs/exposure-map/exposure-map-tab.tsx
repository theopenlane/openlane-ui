'use client'

import React, { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { Network, List } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { Label } from '@repo/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Callout } from '@/components/shared/callout/callout'
import EmptyTabState from '@/components/shared/crud-base/tabs/empty-tab-state'
import { SkeletonRows } from '@/components/shared/skeleton/skeleton-rows'
import { pluralizeWithCount } from '@/utils/strings'
import { getVulnerabilityTitle, type TVulnerabilityDetail } from '../../../vulnerability-display'
import { useVulnerabilityExposure } from './use-vulnerability-exposure'
import ExposureMapList from './exposure-map-list'
import ExposureBulkActions, { type TSelectedReport } from './exposure-bulk-actions'
import { EnvironmentChip } from './environment-chip'

const ExposureRowsSkeleton = () => (
  <div className="space-y-2">
    <SkeletonRows count={4} height={40} />
  </div>
)

const ExposureMapGraph = dynamic(() => import('./exposure-map-graph'), { ssr: false, loading: ExposureRowsSkeleton })

export type TExposureView = 'map' | 'list'

export type TExposureMapState = {
  openOnly: boolean
  setOpenOnly: (openOnly: boolean) => void
  view: TExposureView
  setView: (view: TExposureView) => void
}

type TExposureMapTabProps = {
  vulnerability: TVulnerabilityDetail
  canEdit: boolean
  state: TExposureMapState
}

const LEGEND = [
  { key: 'open', swatch: <span className="size-3 rounded-sm border border-destructive/60 bg-destructive/10" />, label: 'Open' },
  { key: 'closed', swatch: <span className="size-3 rounded-sm border bg-muted/40" />, label: 'Fixed or dismissed' },
  { key: 'open-path', swatch: <span className="w-5 border-t border-dashed border-muted-foreground" />, label: 'Open path (moving)' },
  { key: 'closed-path', swatch: <span className="w-5 border-t border-muted-foreground" />, label: 'Closed path' },
  { key: 'bold', swatch: <span className="text-xs font-bold">Bold</span>, label: 'This record' },
]

const ExposureMapTab: React.FC<TExposureMapTabProps> = ({ vulnerability, canEdit, state }) => {
  const { openOnly, setOpenOnly, view, setView } = state
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set())
  const exposure = useVulnerabilityExposure({ vulnerabilityId: vulnerability.id, cveID: vulnerability.cveID, isOpen: vulnerability.open !== false, openOnly })

  const reportOpenState = useMemo(() => new Map(exposure.rows.map((row) => [row.report.id, row.isOpen])), [exposure.rows])
  const visibleReportIds = useMemo(() => new Set(reportOpenState.keys()), [reportOpenState])
  const selected = useMemo<TSelectedReport[]>(
    () => [...selectedIds].filter((id) => reportOpenState.has(id)).map((id) => ({ id, isOpen: reportOpenState.get(id) === true })),
    [selectedIds, reportOpenState],
  )

  const toggle = (reportId: string, isSelected: boolean) =>
    setSelectedIds((current) => {
      const next = new Set(current)
      if (isSelected) next.add(reportId)
      else next.delete(reportId)
      return next
    })

  const cveLabel = getVulnerabilityTitle(vulnerability)
  const allSelected = visibleReportIds.size > 0 && selected.length === visibleReportIds.size

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
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
          {exposure.groups.map((group) => (
            <EnvironmentChip key={group.environment} environment={group.environment} suffix={`${group.openCount} open`} />
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox id="exposure-open-only" checked={openOnly} onCheckedChange={(checked) => setOpenOnly(checked === true)} />
            <Label htmlFor="exposure-open-only">Open only</Label>
          </div>
          <Tabs value={view} onValueChange={(value) => setView(value === 'list' ? 'list' : 'map')} variant="solid">
            <TabsList className="w-fit">
              <TabsTrigger value="map" className="inline-flex items-center justify-center gap-1.5">
                <Network size={14} />
                Map
              </TabsTrigger>
              <TabsTrigger value="list" className="inline-flex items-center justify-center gap-1.5">
                <List size={14} />
                List
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {!exposure.hasCve && (
        <Callout variant="info">This vulnerability has no CVE ID, so other reports of the same issue cannot be grouped with it. Add a CVE ID to see where else you are affected.</Callout>
      )}

      {exposure.currentIsHidden && <Callout variant="info">This record is closed, so it is hidden while Open only is selected.</Callout>}

      {view === 'list' && canEdit && selected.length > 0 && <ExposureBulkActions selected={selected} cveLabel={cveLabel} onSettled={(remainingIds) => setSelectedIds(new Set(remainingIds))} />}

      {exposure.isPending ? (
        <ExposureRowsSkeleton />
      ) : exposure.isError ? (
        <EmptyTabState description="Reports for this CVE could not be loaded." />
      ) : exposure.rows.length === 0 ? (
        <EmptyTabState description={openOnly ? 'No open reports for this CVE.' : 'No reports found for this CVE.'} />
      ) : view === 'map' ? (
        <ExposureMapGraph groups={exposure.groups} slaDefinitions={exposure.slaDefinitions} />
      ) : (
        <ExposureMapList
          groups={exposure.groups}
          slaDefinitions={exposure.slaDefinitions}
          selectedIds={selectedIds}
          allSelected={allSelected}
          onToggle={toggle}
          onToggleAll={(isSelected) => setSelectedIds(isSelected ? new Set(visibleReportIds) : new Set())}
          canSelect={canEdit}
        />
      )}

      {exposure.hasNextPage && (
        <div className="flex items-center justify-center gap-3">
          <span className="text-xs text-muted-foreground">
            Showing {exposure.loadedReports} of {exposure.listTotal} reports
          </span>
          <Button type="button" variant="secondary" disabled={exposure.isFetchingNextPage} onClick={() => exposure.fetchNextPage()}>
            {exposure.isFetchingNextPage ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}

      {view === 'map' && exposure.rows.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          {LEGEND.map((item) => (
            <span key={item.key} className="inline-flex items-center gap-1.5">
              {item.swatch}
              {item.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default ExposureMapTab

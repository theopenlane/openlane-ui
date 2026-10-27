'use client'

import React, { useCallback, useMemo, useState } from 'react'
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
import { ExposureSelectionContext } from './exposure-report-node'
import { groupExposureRows, limitRowsByReports } from './exposure-model'
import { EnvironmentChip } from './environment-chip'

const ExposureRowsSkeleton = () => (
  <div className="space-y-2">
    <SkeletonRows count={4} height={40} />
  </div>
)

const ExposureMapGraph = dynamic(() => import('./exposure-map-graph'), { ssr: false, loading: ExposureRowsSkeleton })

export type TExposureView = 'map' | 'list'

const MAP_REPORT_STEP = 10

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
  { key: 'open-path', swatch: <span className="w-5 border-t border-dashed border-muted-foreground" />, label: 'Open path' },
  { key: 'closed-path', swatch: <span className="w-5 border-t border-muted-foreground" />, label: 'Closed path' },
  { key: 'source-owner', swatch: <span className="size-3 rounded-sm border border-dashed border-muted-foreground" />, label: 'Source owner with no asset' },
]

const ExposureMapTab: React.FC<TExposureMapTabProps> = ({ vulnerability, canEdit, state }) => {
  const { openOnly, setOpenOnly, view, setView } = state
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set())
  const exposure = useVulnerabilityExposure({ vulnerabilityId: vulnerability.id, cveID: vulnerability.cveID, isOpen: vulnerability.open !== false, openOnly })

  const [mapReportLimit, setMapReportLimit] = useState(MAP_REPORT_STEP)
  const reportsById = useMemo(() => {
    const byId = new Map<string, TSelectedReport>()
    exposure.rows.forEach((row) => {
      const previous = byId.get(row.report.id)
      byId.set(row.report.id, {
        id: row.report.id,
        isOpen: row.isOpen,
        externalOwnerID: row.report.externalOwnerID,
        hasAssetEnvironment: !!previous?.hasAssetEnvironment || !!row.asset?.environmentName?.trim(),
      })
    })
    return byId
  }, [exposure.rows])
  const selected = useMemo<TSelectedReport[]>(() => [...selectedIds].flatMap((id) => reportsById.get(id) ?? []), [selectedIds, reportsById])

  const mapRows = useMemo(() => limitRowsByReports(exposure.rows, mapReportLimit), [exposure.rows, mapReportLimit])
  const mapGroups = useMemo(() => groupExposureRows(mapRows), [mapRows])
  const mapReportIds = useMemo(() => new Set(mapRows.map((row) => row.report.id)), [mapRows])
  const hiddenSelectedCount = view === 'map' ? selected.filter((report) => !mapReportIds.has(report.id)).length : 0
  const canShowMoreOnMap = reportsById.size > mapReportIds.size || exposure.hasNextPage

  const showMoreOnMap = () => {
    if (reportsById.size < mapReportLimit + MAP_REPORT_STEP && exposure.hasNextPage) void exposure.fetchNextPage()
    setMapReportLimit((limit) => limit + MAP_REPORT_STEP)
  }

  const toggle = useCallback(
    (reportId: string, isSelected: boolean) =>
      setSelectedIds((current) => {
        const next = new Set(current)
        if (isSelected) next.add(reportId)
        else next.delete(reportId)
        return next
      }),
    [],
  )
  const selectionContext = useMemo(() => ({ selectedIds, canSelect: canEdit, onToggle: toggle }), [selectedIds, canEdit, toggle])

  const cveLabel = getVulnerabilityTitle(vulnerability)
  const allSelected = reportsById.size > 0 && selected.length === reportsById.size

  const mapFooter =
    canShowMoreOnMap || mapReportLimit > MAP_REPORT_STEP ? (
      <>
        <span className="text-xs text-muted-foreground">
          Showing {mapReportIds.size} of {exposure.listTotal} reports
        </span>
        {canShowMoreOnMap && (
          <Button type="button" variant="secondary" disabled={exposure.isFetchingNextPage} onClick={showMoreOnMap}>
            {exposure.isFetchingNextPage ? 'Loading…' : `Show ${MAP_REPORT_STEP} more`}
          </Button>
        )}
        {mapReportLimit > MAP_REPORT_STEP && (
          <Button type="button" variant="secondary" onClick={() => setMapReportLimit(MAP_REPORT_STEP)}>
            Show fewer
          </Button>
        )}
        <Button type="button" variant="secondary" onClick={() => setView('list')}>
          View list
        </Button>
      </>
    ) : undefined

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
            <Checkbox
              id="exposure-open-only"
              checked={openOnly}
              onCheckedChange={(checked) => {
                setOpenOnly(checked === true)
                setSelectedIds(new Set())
                setMapReportLimit(MAP_REPORT_STEP)
              }}
            />
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

      {exposure.isPending ? (
        <ExposureRowsSkeleton />
      ) : exposure.isError ? (
        <EmptyTabState description="Reports for this CVE could not be loaded." />
      ) : exposure.rows.length === 0 ? (
        <EmptyTabState description={openOnly ? 'No open reports for this CVE.' : 'No reports found for this CVE.'} />
      ) : view === 'map' ? (
        <ExposureSelectionContext value={selectionContext}>
          <ExposureMapGraph groups={mapGroups} slaDefinitions={exposure.slaDefinitions} footer={mapFooter} />
        </ExposureSelectionContext>
      ) : (
        <ExposureMapList
          groups={exposure.groups}
          slaDefinitions={exposure.slaDefinitions}
          selectedIds={selectedIds}
          allSelected={allSelected}
          onToggle={toggle}
          onToggleAll={(isSelected) => setSelectedIds(isSelected ? new Set(reportsById.keys()) : new Set())}
          canSelect={canEdit}
        />
      )}

      {canEdit && selected.length > 0 && (
        <div className="sticky bottom-4 z-10 pr-12">
          <ExposureBulkActions selected={selected} cveLabel={cveLabel} hiddenCount={hiddenSelectedCount} onSettled={(remainingIds) => setSelectedIds(new Set(remainingIds))} />
        </div>
      )}

      {view === 'list' && exposure.hasNextPage && (
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

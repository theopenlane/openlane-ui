'use client'

import React, { use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import type { TPagination } from '@repo/ui/pagination-types'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { Callout } from '@/components/shared/callout/callout'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { hasPermission } from '@/lib/authz/utils'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { useModuleAccess } from '@/lib/subscription-plan/hooks/use-module-access'
import { useSession } from 'next-auth/react'
import { useReportExport, useReportQuery, type TReportRequest } from '@/lib/graphql-hooks/custom-report'
import { emptyReportConfig, reportConfigForEntity, type TReportQueryConfig } from '@/lib/report/report-config'
import { incompleteFilterCount, type TReportFilter } from '@/lib/report/report-filters'
import { resolveReportQueryParts } from '@/lib/report/saved-report'
import { flattenRows, nodesForPage, rowPerOptions } from '@/lib/report/report-rows'
import { entityOptions, getEntity, type TReportCombinator, type TReportSort } from '@/lib/report/report-schema'
import { SearchableSingleSelect } from '@/components/shared/searchableSingleSelect/searchable-single-select'
import { pluralizeWithCount, toHumanLabel } from '@/utils/strings'
import ReportColumnsPanel from './report-columns-panel'
import ReportFiltersPanel from './report-filters-panel'
import ReportActionsBar from './report-actions-bar'
import ReportPanel from './report-panel'
import ReportQueryTab from './report-query-tab'
import ReportRelatedPanel from './report-related-panel'
import ReportResults from './report-results'
import ReportResultsToolbar, { ROW_PER_RECORD, type TReportView } from './report-results-toolbar'
import ReportSortPanel from './report-sort-panel'
import SaveReportDialog from '../saved/save-report-dialog'
import SavedReportsSheet from '../saved/saved-reports-sheet'
import ShareReportSheet from '../saved/share-report-sheet'
import { useSavedReportSession } from './use-saved-report-session'
import { useReportHistory } from './use-report-history'

const REPORT_PAGE_SIZE = 25

const resetPagination = (pageSize: number): TPagination => ({ page: 1, pageSize, query: { first: pageSize } })

const CustomReportPage: React.FC = () => {
  const { setCrumbs } = use(BreadcrumbContext)
  const { hasObjectType } = useModuleAccess()
  const { data: session } = useSession()
  const { data: orgPermission } = useOrganizationRoles()

  const availableEntities = useMemo(() => entityOptions.filter((option) => hasObjectType(option.objectType)), [hasObjectType])
  const reportableEntityNames = useMemo(() => new Set(availableEntities.map((option) => option.value)), [availableEntities])

  const { options: historyOptions, recordRun } = useReportHistory(reportableEntityNames)

  const [config, setConfig] = useState<TReportQueryConfig>(emptyReportConfig)
  const { entityName, columnPaths, filters, combinator, sort, limit } = config
  const runIdRef = useRef(0)
  const [pagination, setPagination] = useState<TPagination>(() => resetPagination(REPORT_PAGE_SIZE))
  const [view, setView] = useState<TReportView>('table')
  const [tab, setTab] = useState('results')
  const [rowPerPath, setRowPerPath] = useState(ROW_PER_RECORD)

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Custom Report', href: '/reports/custom' },
    ])
  }, [setCrumbs])

  const entity = reportableEntityNames.has(entityName) ? getEntity(entityName) : undefined
  const selectedPaths = useMemo(() => new Set(columnPaths), [columnPaths])

  const [request, setRequest] = useState<TReportRequest | null>(null)
  const [isCancelled, setIsCancelled] = useState(false)

  const clearRequest = useCallback(() => {
    setRequest(null)
    setIsCancelled(false)
  }, [])

  const patchConfig = useCallback((patch: Partial<TReportQueryConfig>) => setConfig((current) => ({ ...current, ...patch })), [])

  const setFilters = useCallback((filters: TReportFilter[]) => patchConfig({ filters }), [patchConfig])
  const setCombinator = useCallback((combinator: TReportCombinator) => patchConfig({ combinator }), [patchConfig])
  const setSort = useCallback((sort: TReportSort) => patchConfig({ sort }), [patchConfig])
  const setLimit = useCallback((limit: number | null) => patchConfig({ limit }), [patchConfig])

  const toggleColumn = useCallback(
    (path: string) => setConfig((current) => ({ ...current, columnPaths: current.columnPaths.includes(path) ? current.columnPaths.filter((item) => item !== path) : [...current.columnPaths, path] })),
    [],
  )

  const toggleColumns = useCallback((paths: string[], selectAll: boolean) => {
    const changed = new Set(paths)

    setConfig((current) => {
      const held = new Set(current.columnPaths)
      const columnPaths = selectAll ? [...current.columnPaths, ...paths.filter((path) => !held.has(path))] : current.columnPaths.filter((path) => !changed.has(path))

      return { ...current, columnPaths }
    })
  }, [])

  const { data: result, error, isFetching, isPlaceholderData } = useReportQuery(request, pagination.query)
  const { runExport, isExporting, cancelExport } = useReportExport(request)

  const settledPageRef = useRef<{ runId: number; pagination: TPagination } | null>(null)

  useEffect(() => {
    if (request && result && !isFetching && !isPlaceholderData) settledPageRef.current = { runId: request.runId, pagination }
  }, [isFetching, isPlaceholderData, pagination, request, result])

  const handleCancel = useCallback(() => {
    const settled = settledPageRef.current

    if (request && settled?.runId === request.runId) {
      setPagination(settled.pagination)
      return
    }

    setRequest(null)
    setIsCancelled(true)
  }, [request])

  const reportResult = request ? result : undefined
  const isRunning = isFetching && (!reportResult || isPlaceholderData)

  const rowPerChoices = useMemo(() => (request ? rowPerOptions(request.columns) : []), [request])
  const selectedRowPer = rowPerChoices.find((option) => option.path === rowPerPath)
  const rowPer = selectedRowPer?.chain

  const pageRows = useMemo(() => (reportResult ? flattenRows(nodesForPage(reportResult, pagination), reportResult.columns, rowPer) : []), [pagination, reportResult, rowPer])

  const recordSummary = useMemo(() => {
    if (!reportResult) return null

    const total =
      reportResult.matchedCount > reportResult.totalCount
        ? `Showing the first ${reportResult.totalCount.toLocaleString()} of ${reportResult.matchedCount.toLocaleString()} matching records`
        : `${reportResult.totalCount.toLocaleString()} total records`

    return view === 'json' || rowPer ? `${total}, showing ${pluralizeWithCount(pageRows.length, 'row')} on this page` : total
  }, [pageRows.length, reportResult, rowPer, view])

  const incompleteFilters = useMemo(() => (entity ? incompleteFilterCount(filters, entity) : 0), [entity, filters])

  const runConfig = useCallback(
    (next: TReportQueryConfig) => {
      const parts = resolveReportQueryParts(next)
      if (!parts) return

      runIdRef.current += 1

      setRequest({ ...parts, runId: runIdRef.current, limit: next.limit })
      setPagination((current) => resetPagination(current.pageSize))
      recordRun(next)
    },
    [recordRun],
  )

  const handleRun = () => runConfig(config)

  const applySavedConfig = useCallback(
    (next: TReportQueryConfig, { run }: { run: boolean }) => {
      setConfig(next)
      setRowPerPath(ROW_PER_RECORD)

      if (run) {
        setTab('results')
        runConfig(next)
      } else {
        clearRequest()
      }
    },
    [clearRequest, runConfig],
  )

  const {
    reportId,
    report: savedReport,
    canManage: canManageSavedReport,
    loadError,
    openReport,
    attachReport,
    detachReport,
  } = useSavedReportSession({ reportableEntityNames, applyConfig: applySavedConfig })

  const handleEntityChange = (nextEntityName: string) => {
    if (nextEntityName === entityName) return

    const nextEntity = getEntity(nextEntityName)
    if (!nextEntity) return

    setConfig((current) => ({ ...reportConfigForEntity(nextEntity), limit: current.limit }))
    clearRequest()
    setRowPerPath(ROW_PER_RECORD)
    setPagination(resetPagination(pagination.pageSize))
    if (reportId) detachReport()
  }

  const handleSelectHistory = useCallback(
    (next: TReportQueryConfig) => {
      applySavedConfig(next, { run: true })
      if (reportId) detachReport()
    },
    [applySavedConfig, detachReport, reportId],
  )

  const [isSaveOpen, setIsSaveOpen] = useState(false)
  const [isSavedListOpen, setIsSavedListOpen] = useState(false)

  const canCreateReport = hasPermission(orgPermission?.roles, AccessEnum.CanCreateReport, session)
  const [shareTarget, setShareTarget] = useState<typeof savedReport>(null)

  const handleReportDeleted = useCallback(
    (id: string) => {
      if (id === reportId) detachReport()
    },
    [detachReport, reportId],
  )

  const runDisabled = !entity || columnPaths.length === 0 || incompleteFilters > 0
  const saveDisabledReason = runDisabled
    ? 'Select a data type and at least one column, and complete every filter, before saving.'
    : !canManageSavedReport && !canCreateReport
      ? 'You do not have permission to save reports.'
      : undefined

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <ReportActionsBar
          savedReport={savedReport}
          canManage={!!savedReport && canManageSavedReport}
          historyOptions={historyOptions}
          onSelectHistory={handleSelectHistory}
          saveDisabledReason={saveDisabledReason}
          runDisabled={runDisabled}
          isRunning={isRunning}
          onClose={detachReport}
          onOpenSavedReports={() => setIsSavedListOpen(true)}
          onShare={() => setShareTarget(savedReport)}
          onSave={() => setIsSaveOpen(true)}
          onRun={handleRun}
          onCancel={handleCancel}
        />
        {entity && columnPaths.length === 0 && <p className="text-xs text-muted-foreground text-right">Select at least one column to run this report.</p>}
        {incompleteFilters > 0 && <p className="text-xs text-muted-foreground text-right">Give every filter a value, or remove it, before running this report.</p>}
      </div>

      {loadError && (
        <Callout variant="warning">
          <div className="flex items-center gap-2 flex-wrap">
            <span>{loadError}</span>
            <Button type="button" variant="link" className="text-blue-500" onClick={detachReport}>
              Start a new report
            </Button>
          </div>
        </Callout>
      )}

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-4">
          <ReportPanel title="Report on" description="Choose the type of data to include in your report">
            {availableEntities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Your organization has no modules that can be reported on yet.</p>
            ) : (
              <SearchableSingleSelect ariaLabel="Report data type" value={entityName} options={availableEntities} placeholder="Select a data type" onChange={handleEntityChange} />
            )}
          </ReportPanel>

          {entity && (
            <>
              <ReportColumnsPanel key={`columns-${entityName}`} entity={entity} selected={selectedPaths} onToggle={toggleColumn} onToggleMany={toggleColumns} />
              <ReportRelatedPanel key={`related-${entityName}`} entity={entity} selected={selectedPaths} onToggle={toggleColumn} onToggleMany={toggleColumns} />
              <ReportFiltersPanel entity={entity} filters={filters} combinator={combinator} onCombinatorChange={setCombinator} onChange={setFilters} />
              <ReportSortPanel entity={entity} sort={sort} limit={limit} onSortChange={setSort} onLimitChange={setLimit} />
            </>
          )}
        </aside>

        <Card className="flex-1 min-w-0 w-full p-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="query">Query</TabsTrigger>
            </TabsList>

            <TabsContent value="results" className="mt-4 flex flex-col gap-3">
              <ReportResultsToolbar
                summary={recordSummary}
                recordLabel={request ? toHumanLabel(request.entity.typeName) : ''}
                rowPerOptions={rowPerChoices}
                rowPer={selectedRowPer?.path ?? ROW_PER_RECORD}
                onRowPerChange={setRowPerPath}
                view={view}
                onViewChange={setView}
                canExport={!!request}
                isExporting={isExporting}
                onCancelExport={cancelExport}
                onExport={(format) => runExport(format, rowPer ?? [])}
              />

              <ReportResults
                result={reportResult}
                rows={pageRows}
                error={error}
                isLoading={isFetching}
                isCancelled={isCancelled && !request}
                view={view}
                pagination={pagination}
                onPaginationChange={setPagination}
              />
            </TabsContent>

            <TabsContent value="query" className="mt-4 flex flex-col gap-3">
              <ReportQueryTab config={config} pageSize={pagination.pageSize} hasEntity={!!entity} />
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      <SaveReportDialog open={isSaveOpen} onOpenChange={setIsSaveOpen} config={config} report={canManageSavedReport ? savedReport : null} canCreate={canCreateReport} onCreated={attachReport} />
      <SavedReportsSheet open={isSavedListOpen} onOpenChange={setIsSavedListOpen} onOpenReport={openReport} onDeleted={handleReportDeleted} />
      <ShareReportSheet report={shareTarget} onClose={() => setShareTarget(null)} />
    </div>
  )
}

export default CustomReportPage

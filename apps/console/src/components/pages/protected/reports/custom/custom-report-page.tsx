'use client'

import React, { use, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Copy, Download, Play } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import { CodeBlock } from '@repo/ui/code-block'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import type { TPagination } from '@repo/ui/pagination-types'
import { useCopyToClipboard } from '@uidotdev/usehooks'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useNotification } from '@/hooks/useNotification'
import { useModuleAccess } from '@/lib/subscription-plan/hooks/use-module-access'
import { useReportExport, useReportQuery, type TReportRequest } from '@/lib/graphql-hooks/custom-report'
import { buildReportQuery } from '@/lib/report/build-report-query'
import { buildOrder, emptyReportConfig, reportConfigForEntity, type TReportQueryConfig } from '@/lib/report/report-config'
import { buildWhere, isFilterComplete, type TReportCombinator, type TReportFilter } from '@/lib/report/report-filters'
import { EXPORT_FORMAT_LABELS, EXPORT_FORMATS } from '@/lib/report/report-export'
import { rowsForPage } from '@/lib/report/report-rows'
import { entityOptions, getColumnIndex, getEntity, resolveColumns, type TReportSort } from '@/lib/report/report-schema'
import { SearchableSingleSelect } from '@/components/shared/searchableSingleSelect/searchable-single-select'
import { EXPORT_PAGE_SIZE } from '@/constants/pagination'
import ReportColumnsPanel from './report-columns-panel'
import ReportFiltersPanel from './report-filters-panel'
import ReportHistoryPanel from './report-history-panel'
import ReportPanel from './report-panel'
import ReportRelatedPanel from './report-related-panel'
import ReportResults from './report-results'
import ReportSortPanel from './report-sort-panel'
import { useReportHistory } from './use-report-history'

type TReportView = 'table' | 'json'

const REPORT_PAGE_SIZE = 25

const resetPagination = (pageSize: number): TPagination => ({ page: 1, pageSize, query: { first: pageSize } })

const CustomReportPage: React.FC = () => {
  const { setCrumbs } = use(BreadcrumbContext)
  const { hasObjectType } = useModuleAccess()
  const { successNotification } = useNotification()
  const [, copyToClipboard] = useCopyToClipboard()
  const formatLabelId = useId()

  const availableEntities = useMemo(() => entityOptions.filter((option) => hasObjectType(option.objectType)), [hasObjectType])
  const reportableEntityNames = useMemo(() => new Set(availableEntities.map((option) => option.value)), [availableEntities])

  const { options: historyOptions, recordRun } = useReportHistory(reportableEntityNames)

  const [config, setConfig] = useState<TReportQueryConfig>(emptyReportConfig)
  const { entityName, columnPaths, filters, combinator, sort, limit } = config
  const runIdRef = useRef(0)
  const [pagination, setPagination] = useState<TPagination>(() => resetPagination(REPORT_PAGE_SIZE))
  const [view, setView] = useState<TReportView>('table')
  const [tab, setTab] = useState('results')

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Custom Report', href: '/reports/custom' },
    ])
  }, [setCrumbs])

  const entity = reportableEntityNames.has(entityName) ? getEntity(entityName) : undefined
  const columnIndex = getColumnIndex(entity)
  const selectedPaths = useMemo(() => new Set(columnPaths), [columnPaths])

  const [request, setRequest] = useState<TReportRequest | null>(null)

  const patchConfig = useCallback((patch: Partial<TReportQueryConfig>) => setConfig((current) => ({ ...current, ...patch })), [])

  const setFilters = useCallback((filters: TReportFilter[]) => patchConfig({ filters }), [patchConfig])
  const setCombinator = useCallback((combinator: TReportCombinator) => patchConfig({ combinator }), [patchConfig])
  const setSort = useCallback((sort: TReportSort) => patchConfig({ sort }), [patchConfig])
  const setLimit = useCallback((limit: number | null) => patchConfig({ limit }), [patchConfig])

  const handleEntityChange = (nextEntityName: string) => {
    if (nextEntityName === entityName) return

    const nextEntity = getEntity(nextEntityName)
    if (!nextEntity) return

    setConfig((current) => ({ ...reportConfigForEntity(nextEntity), limit: current.limit }))
    setRequest(null)
    setPagination(resetPagination(pagination.pageSize))
  }

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

  const { data: result, error, isFetching } = useReportQuery(request, pagination.query)
  const { runExport, isExporting } = useReportExport(request)

  const reportResult = request ? result : undefined

  const recordSummary = useMemo(() => {
    if (!reportResult) return null

    const total =
      reportResult.matchedCount > reportResult.totalCount
        ? `Showing the first ${reportResult.totalCount.toLocaleString()} of ${reportResult.matchedCount.toLocaleString()} matching records`
        : `${reportResult.totalCount.toLocaleString()} total records`

    return view === 'json' ? `${total}, showing ${rowsForPage(reportResult, pagination).length.toLocaleString()} on this page` : total
  }, [pagination, reportResult, view])

  const incompleteFilters = useMemo(() => {
    if (!entity) return 0

    const fieldsByName = new Map(entity.fields.map((field) => [field.name, field]))

    return filters.filter((filter) => !isFilterComplete(filter, fieldsByName.get(filter.field))).length
  }, [entity, filters])

  const preview = useMemo(() => {
    if (tab !== 'query' || !entity) return null

    const columns = resolveColumns(columnIndex, columnPaths)
    if (columns.length === 0) return null

    const { query, variables } = buildReportQuery({
      entity,
      columns,
      where: buildWhere(filters, entity.fields, combinator),
      orderBy: buildOrder(sort),
      pageQuery: { first: limit ? Math.min(limit, EXPORT_PAGE_SIZE) : pagination.pageSize },
    })

    return { query, variables: Object.keys(variables).length > 0 ? JSON.stringify(variables, null, 2) : '' }
  }, [columnIndex, columnPaths, combinator, entity, filters, limit, pagination.pageSize, sort, tab])

  const runConfig = useCallback(
    (next: TReportQueryConfig) => {
      const nextEntity = getEntity(next.entityName)
      if (!nextEntity) return

      const columns = resolveColumns(getColumnIndex(nextEntity), next.columnPaths)
      if (columns.length === 0) return

      runIdRef.current += 1

      setRequest({
        runId: runIdRef.current,
        entity: nextEntity,
        columns,
        where: buildWhere(next.filters, nextEntity.fields, next.combinator),
        orderBy: buildOrder(next.sort),
        limit: next.limit,
      })
      setPagination((current) => resetPagination(current.pageSize))
      recordRun(next)
    },
    [recordRun],
  )

  const handleRun = () => runConfig(config)

  const handleSelectHistory = useCallback(
    (next: TReportQueryConfig) => {
      setConfig(next)
      runConfig(next)
    },
    [runConfig],
  )

  const handleCopyQuery = () => {
    if (!preview) return

    copyToClipboard(preview.query)
    successNotification({ title: 'Copied to clipboard', variant: 'success' })
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start">
      <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Button type="button" full icon={<Play size={14} />} iconPosition="left" loading={isFetching} disabled={!entity || columnPaths.length === 0 || incompleteFilters > 0} onClick={handleRun}>
            Run report
          </Button>
          {entity && columnPaths.length === 0 && <p className="text-xs text-muted-foreground">Select at least one column to run this report.</p>}
          {incompleteFilters > 0 && <p className="text-xs text-muted-foreground">Give every filter a value, or remove it, before running this report.</p>}
        </div>

        <ReportPanel title="Report on" description="Choose the type of data to include in your report">
          {availableEntities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Your organization has no modules that can be reported on yet.</p>
          ) : (
            <SearchableSingleSelect ariaLabel="Report data type" value={entityName} options={availableEntities} placeholder="Select a data type" onChange={handleEntityChange} />
          )}
        </ReportPanel>

        {historyOptions.length > 0 && <ReportHistoryPanel options={historyOptions} onSelect={handleSelectHistory} />}

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
            <div className="flex items-center gap-2 flex-wrap">
              {recordSummary && <p className="text-xs text-muted-foreground">{recordSummary}</p>}

              <div className="flex items-center gap-2 ml-auto">
                <span id={formatLabelId} className="text-sm text-muted-foreground">
                  Format
                </span>
                <Select value={view} onValueChange={(value) => setView(value === 'json' ? 'json' : 'table')}>
                  <SelectTrigger className="h-8 w-28 text-sm" aria-labelledby={formatLabelId}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="table">Table</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" size="md" icon={<Download size={14} />} iconPosition="left" loading={isExporting} disabled={!request || isExporting}>
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {EXPORT_FORMATS.map((format) => (
                      <DropdownMenuItem key={format} onClick={() => runExport(format)}>
                        {EXPORT_FORMAT_LABELS[format]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <ReportResults result={reportResult} error={error} isLoading={isFetching} view={view} pagination={pagination} onPaginationChange={setPagination} />
          </TabsContent>

          <TabsContent value="query" className="mt-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium">Generated query</p>

              <Button className="ml-auto" type="button" variant="outline" size="md" icon={<Copy size={14} />} iconPosition="left" disabled={!preview} onClick={handleCopyQuery}>
                Copy
              </Button>
            </div>

            {preview ? (
              <>
                <CodeBlock code={preview.query} language="graphql" />
                {preview.variables && <CodeBlock code={preview.variables} language="json" title="Variables" />}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{entity ? 'Select at least one column to see the query.' : 'Choose a data type to see the query.'}</p>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}

export default CustomReportPage

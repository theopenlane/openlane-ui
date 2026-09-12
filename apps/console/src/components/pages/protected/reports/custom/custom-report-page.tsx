'use client'

import React, { use, useCallback, useEffect, useId, useMemo, useState } from 'react'
import { Copy, Download, Play } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import { CodeBlock } from '@repo/ui/code-block'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import type { TPagination } from '@repo/ui/pagination-types'
import { useCopyToClipboard } from '@uidotdev/usehooks'
import { OrderDirection } from '@repo/codegen/src/schema'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useNotification } from '@/hooks/useNotification'
import { useModuleAccess } from '@/lib/subscription-plan/hooks/use-module-access'
import { useReportExport, useReportQuery, type TReportRequest } from '@/lib/graphql-hooks/custom-report'
import { buildReportQuery } from '@/lib/report/build-report-query'
import { buildWhere, defaultFilters, isFilterComplete, type TReportCombinator, type TReportFilter } from '@/lib/report/report-filters'
import { EXPORT_FORMAT_LABELS, EXPORT_FORMATS } from '@/lib/report/report-export'
import { rowsForPage } from '@/lib/report/report-rows'
import { buildColumnIndex, entityOptions, getEntity, resolveColumns, type TReportColumn, type TReportOrder } from '@/lib/report/report-schema'
import { SearchableSingleSelect } from '@/components/shared/searchableSingleSelect/searchable-single-select'
import { EXPORT_PAGE_SIZE } from '@/constants/pagination'
import ReportColumnsPanel from './report-columns-panel'
import ReportFiltersPanel from './report-filters-panel'
import ReportPanel from './report-panel'
import ReportRelatedPanel from './report-related-panel'
import ReportResults from './report-results'
import ReportSortPanel, { type TReportSort } from './report-sort-panel'

type TReportView = 'table' | 'json'

const REPORT_PAGE_SIZE = 25

const resetPagination = (pageSize: number): TPagination => ({ page: 1, pageSize, query: { first: pageSize } })

const DEFAULT_SORT: TReportSort = { field: null, direction: OrderDirection.ASC }

const buildOrder = ({ field, direction }: TReportSort): TReportOrder | null => (field ? { field, direction } : null)

const CustomReportPage: React.FC = () => {
  const { setCrumbs } = use(BreadcrumbContext)
  const { hasObjectType } = useModuleAccess()
  const { successNotification } = useNotification()
  const [, copyToClipboard] = useCopyToClipboard()
  const formatLabelId = useId()

  const availableEntities = useMemo(() => entityOptions.filter((option) => hasObjectType(option.objectType)), [hasObjectType])

  const [entityName, setEntityName] = useState('')
  const [columnPaths, setColumnPaths] = useState<string[]>([])
  const [filters, setFilters] = useState<TReportFilter[]>([])
  const [combinator, setCombinator] = useState<TReportCombinator>('and')
  const [sort, setSort] = useState<TReportSort>(DEFAULT_SORT)
  const [limit, setLimit] = useState<number | null>(null)
  const [runId, setRunId] = useState(0)
  const [pagination, setPagination] = useState<TPagination>(() => resetPagination(REPORT_PAGE_SIZE))
  const [view, setView] = useState<TReportView>('table')
  const [tab, setTab] = useState('results')

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Custom Report', href: '/reports/custom' },
    ])
  }, [setCrumbs])

  const entity = availableEntities.some((option) => option.value === entityName) ? getEntity(entityName) : undefined
  const columnIndex = useMemo(() => (entity ? buildColumnIndex(entity) : new Map<string, TReportColumn>()), [entity])
  const selectedPaths = useMemo(() => new Set(columnPaths), [columnPaths])

  const [request, setRequest] = useState<TReportRequest | null>(null)

  const handleEntityChange = (nextEntityName: string) => {
    if (nextEntityName === entityName) return

    const nextEntity = getEntity(nextEntityName)
    if (!nextEntity) return

    setEntityName(nextEntityName)
    setColumnPaths(nextEntity.defaultFields)
    setFilters(defaultFilters(nextEntity))
    setCombinator('and')
    setSort(DEFAULT_SORT)
    setRequest(null)
    setPagination(resetPagination(pagination.pageSize))
  }

  const toggleColumn = useCallback((path: string) => setColumnPaths((current) => (current.includes(path) ? current.filter((item) => item !== path) : [...current, path])), [])

  const toggleColumns = useCallback((paths: string[], selectAll: boolean) => {
    const changed = new Set(paths)

    setColumnPaths((current) => {
      const held = new Set(current)

      return selectAll ? [...current, ...paths.filter((path) => !held.has(path))] : current.filter((path) => !changed.has(path))
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

  const handleRun = () => {
    if (!entity) return

    const columns = resolveColumns(columnIndex, columnPaths)
    if (columns.length === 0) return

    const nextRunId = runId + 1

    setRunId(nextRunId)
    setRequest({ runId: nextRunId, entity, columns, where: buildWhere(filters, entity.fields, combinator), orderBy: buildOrder(sort), limit })
    setPagination(resetPagination(pagination.pageSize))
  }

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

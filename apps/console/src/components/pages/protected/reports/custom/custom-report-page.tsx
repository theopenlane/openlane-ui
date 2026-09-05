'use client'

import React, { use, useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Play } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import { CodeBlock } from '@repo/ui/code-block'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import type { TPagination } from '@repo/ui/pagination-types'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useModuleAccess } from '@/lib/subscription-plan/hooks/use-module-access'
import { useReportExport, useReportQuery, type TReportRequest } from '@/lib/graphql-hooks/custom-report'
import { buildReportQuery } from '@/lib/report/build-report-query'
import { buildWhere, isFilterComplete, type TReportCombinator, type TReportFilter } from '@/lib/report/report-filters'
import { EXPORT_FORMAT_LABELS, EXPORT_FORMATS } from '@/lib/report/report-export'
import { buildColumnIndex, entityOptions, getEntity, resolveColumns, type TReportColumn } from '@/lib/report/report-schema'
import ReportColumnsPanel from './report-columns-panel'
import ReportFiltersPanel from './report-filters-panel'
import ReportPanel from './report-panel'
import ReportRelatedPanel from './report-related-panel'
import ReportResults from './report-results'

type TReportView = 'table' | 'json'

const REPORT_PAGE_SIZE = 25

const resetPagination = (pageSize: number): TPagination => ({ page: 1, pageSize, query: { first: pageSize } })

const CustomReportPage: React.FC = () => {
  const { setCrumbs } = use(BreadcrumbContext)
  const { hasObjectType } = useModuleAccess()

  const availableEntities = useMemo(() => entityOptions.filter((option) => hasObjectType(option.objectType)), [hasObjectType])

  const [entityName, setEntityName] = useState('')
  const [columnPaths, setColumnPaths] = useState<string[]>([])
  const [filters, setFilters] = useState<TReportFilter[]>([])
  const [combinator, setCombinator] = useState<TReportCombinator>('and')
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

  useEffect(() => {
    const first = availableEntities[0]
    if (!entityName && first) {
      setEntityName(first.value)
      setColumnPaths(getEntity(first.value)?.defaultFields ?? [])
    }
  }, [availableEntities, entityName])

  const entity = availableEntities.some((option) => option.value === entityName) ? getEntity(entityName) : undefined
  const columnIndex = useMemo(() => (entity ? buildColumnIndex(entity) : new Map<string, TReportColumn>()), [entity])
  const selectedPaths = useMemo(() => new Set(columnPaths), [columnPaths])

  const [request, setRequest] = useState<TReportRequest | null>(null)

  const handleEntityChange = (nextEntityName: string) => {
    const nextEntity = getEntity(nextEntityName)
    if (!nextEntity) return

    setEntityName(nextEntityName)
    setColumnPaths(nextEntity.defaultFields)
    setFilters([])
    setCombinator('and')
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

  const incompleteFilters = useMemo(() => {
    if (!entity) return 0

    const fieldsByName = new Map(entity.fields.map((field) => [field.name, field]))

    return filters.filter((filter) => !isFilterComplete(filter, fieldsByName.get(filter.field))).length
  }, [entity, filters])

  const previewQuery = useMemo(() => {
    if (tab !== 'query' || !entity) return ''

    const columns = resolveColumns(columnIndex, columnPaths)
    if (columns.length === 0) return ''

    const { query, variables } = buildReportQuery({
      entity,
      columns,
      where: buildWhere(filters, entity.fields, combinator),
      pageQuery: { first: pagination.pageSize },
    })

    return Object.keys(variables).length > 0 ? `${query}\n\n# variables\n${JSON.stringify(variables, null, 2)}` : query
  }, [columnIndex, columnPaths, combinator, entity, filters, pagination.pageSize, tab])

  const handleRun = () => {
    if (!entity) return

    const columns = resolveColumns(columnIndex, columnPaths)
    if (columns.length === 0) return

    const nextRunId = runId + 1

    setRunId(nextRunId)
    setRequest({ runId: nextRunId, entity, columns, where: buildWhere(filters, entity.fields, combinator) })
    setPagination(resetPagination(pagination.pageSize))
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start">
      <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-4">
        <ReportPanel title="Report on" description="Choose the type of data to include in your report">
          {availableEntities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Your organization has no modules that can be reported on yet.</p>
          ) : (
            <Select value={entityName} onValueChange={handleEntityChange}>
              <SelectTrigger aria-label="Report data type">
                <SelectValue placeholder="Select a data type" />
              </SelectTrigger>
              <SelectContent>
                {availableEntities.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </ReportPanel>

        {entity && (
          <>
            <ReportColumnsPanel key={`columns-${entityName}`} entity={entity} selected={selectedPaths} onToggle={toggleColumn} onToggleMany={toggleColumns} />
            <ReportRelatedPanel key={`related-${entityName}`} entity={entity} selected={selectedPaths} onToggle={toggleColumn} onToggleMany={toggleColumns} />
            <ReportFiltersPanel entity={entity} filters={filters} combinator={combinator} onCombinatorChange={setCombinator} onChange={setFilters} />
          </>
        )}

        <div className="sticky bottom-0 flex flex-col gap-1 bg-background pt-2 pb-1">
          <Button type="button" full icon={<Play size={14} />} iconPosition="left" loading={isFetching} disabled={!entity || columnPaths.length === 0 || incompleteFilters > 0} onClick={handleRun}>
            Run report
          </Button>
          {columnPaths.length === 0 && <p className="text-xs text-muted-foreground">Select at least one column to run this report.</p>}
          {incompleteFilters > 0 && <p className="text-xs text-muted-foreground">Give every filter a value, or remove it, before running this report.</p>}
        </div>
      </aside>

      <Card className="flex-1 min-w-0 w-full p-4">
        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <TabsList>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="query">Query</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Select value={view} onValueChange={(value) => setView(value === 'json' ? 'json' : 'table')}>
                <SelectTrigger className="h-8 w-28 text-sm" aria-label="Results view">
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

          <TabsContent value="results" className="mt-4">
            <ReportResults result={request ? result : undefined} error={error} isLoading={isFetching} view={view} pagination={pagination} onPaginationChange={setPagination} />
          </TabsContent>

          <TabsContent value="query" className="mt-4">
            {previewQuery ? <CodeBlock code={previewQuery} language="text" /> : <p className="text-sm text-muted-foreground">Select at least one column to see the query.</p>}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}

export default CustomReportPage

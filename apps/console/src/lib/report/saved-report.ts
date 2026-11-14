import { ReportReportVisibility, type ReportWhereInput } from '@repo/codegen/src/schema'
import type { TReportEntity } from '@repo/codegen/src/report-schema.generated'
import type { TPaginationQuery } from '@repo/ui/pagination-types'
import { EXPORT_PAGE_SIZE } from '@/constants/pagination'
import { isRecord } from '@/utils/type-guards'
import { toHumanLabel } from '@/utils/strings'
import { buildReportQuery, type TReportQuery } from './build-report-query'
import { buildOrder, parseReportQueryConfig, reconcileReportConfig, type TReportQueryConfig } from './report-config'
import { buildRelatedWhere, buildWhere } from './report-filters'
import { getEntity, resolveColumns, type TReportColumn, type TReportOrder } from './report-schema'

export const CUSTOM_REPORT_HREF = '/reports/custom'
export const SAVED_REPORTS_HREF = '/reports/saved'
export const SAVED_REPORT_PARAM = 'report'
export const SAVED_REPORT_MODE_PARAM = 'mode'
export const SAVED_REPORT_EDIT_MODE = 'edit'

const REPORT_CONFIG_VARIABLE = 'reportBuilderConfig'

export const savedReportHref = (id: string, options?: { edit?: boolean }): string => {
  const params = new URLSearchParams({ [SAVED_REPORT_PARAM]: id })
  if (options?.edit) params.set(SAVED_REPORT_MODE_PARAM, SAVED_REPORT_EDIT_MODE)

  return `${CUSTOM_REPORT_HREF}?${params.toString()}`
}

export const savedReportUrl = (id: string): string => `${window.location.origin}/reports/${id}`

export const savedReportsEmptyMessage = (search: string, hasError: boolean, hasFilters = false): string => {
  if (hasError) return 'Saved reports could not be loaded. Please try again later.'
  if (hasFilters) return 'No saved reports match your filters.'

  return search ? `No saved reports match "${search}".` : 'You have no saved reports yet. Build a report and select Save to keep it here.'
}

export const savedReportOwnerId = ({ reportOwnerID, createdBy }: { reportOwnerID?: string | null; createdBy?: string | null }): string | null => reportOwnerID || createdBy || null

export const reportOwnedByWhere = (userIds: string[]): ReportWhereInput => ({ or: [{ reportOwnerIDIn: userIds }, { reportOwnerIDIsNil: true, createdByIn: userIds }] })

export const reportNotOwnedByWhere = (userId: string): ReportWhereInput => ({
  or: [{ reportOwnerIDNEQ: userId }, { reportOwnerIDIsNil: true, or: [{ createdByNEQ: userId }, { createdByIsNil: true }] }],
})

export type TReportQueryParts = {
  entity: TReportEntity
  columns: TReportColumn[]
  where: Record<string, unknown> | null
  relatedWhere: Record<string, unknown>
  orderBy: TReportOrder | null
}

export const resolveReportQueryParts = (config: TReportQueryConfig): TReportQueryParts | null => {
  const entity = getEntity(config.entityName)
  if (!entity) return null

  const columns = resolveColumns(entity, config.columnPaths)
  if (columns.length === 0) return null

  return {
    entity,
    columns,
    where: buildWhere(config.filters, entity, config.combinator),
    relatedWhere: buildRelatedWhere(config.filters, entity, config.combinator),
    orderBy: buildOrder(config.sort),
  }
}

export const buildReportQueryForConfig = (config: TReportQueryConfig, pageSize: number): TReportQuery | null => {
  const parts = resolveReportQueryParts(config)
  const pageQuery: TPaginationQuery = { first: config.limit ? Math.min(config.limit, EXPORT_PAGE_SIZE) : pageSize }

  return parts && buildReportQuery({ ...parts, pageQuery })
}

export const buildSavedReportDefinition = (config: TReportQueryConfig): TReportQuery | null => {
  const built = buildReportQueryForConfig(config, EXPORT_PAGE_SIZE)

  return built && { query: built.query, variables: { ...built.variables, [REPORT_CONFIG_VARIABLE]: config } }
}

const readSavedReportConfig = (variables: unknown): TReportQueryConfig | null => (isRecord(variables) ? parseReportQueryConfig(variables[REPORT_CONFIG_VARIABLE]) : null)

export const resolveSavedReport = (variables: unknown, reportableEntityNames: ReadonlySet<string>): { config: TReportQueryConfig; isPartial: boolean } | null => {
  const stored = readSavedReportConfig(variables)
  if (!stored || !reportableEntityNames.has(stored.entityName)) return null

  const config = reconcileReportConfig(stored)
  if (!config) return null

  return { config, isPartial: config.columnPaths.length < stored.columnPaths.length || config.filters.length < stored.filters.length || config.sort.field !== stored.sort.field }
}

export const savedReportDataLabel = (variables: unknown): string => {
  const entityName = readSavedReportConfig(variables)?.entityName

  return entityName ? toHumanLabel(entityName) : 'Custom query'
}

export const reportVisibilityOf = (visibility: ReportReportVisibility | null | undefined): ReportReportVisibility => visibility ?? ReportReportVisibility.PRIVATE

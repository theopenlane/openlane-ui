import { type VulnerabilityExposureNode } from '@/lib/graphql-hooks/vulnerability'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { formatDate } from '@/utils/date'

export const UNKNOWN_ENVIRONMENT = 'Unknown'

type TExposureAsset = NonNullable<NonNullable<NonNullable<VulnerabilityExposureNode['assets']['edges']>[number]>['node']>

export type TExposureRow = {
  key: string
  report: VulnerabilityExposureNode
  isCurrent: boolean
  isOpen: boolean
  asset: TExposureAsset | null
  environment: string
  isFirstForReport: boolean
  hiddenAssetCount: number
}

export type TEnvironmentGroup = {
  environment: string
  rows: TExposureRow[]
  reportCount: number
  openCount: number
}

const platformEnvironment = (asset: TExposureAsset): string | null => {
  const environments = new Set(
    getNodes({ edges: asset.platforms.edges })
      .map((platform) => platform.environmentName?.trim())
      .filter((name): name is string => !!name),
  )
  return environments.size === 1 ? [...environments][0] : null
}

const resolveExposureEnvironment = (report: VulnerabilityExposureNode, asset: TExposureAsset | null): string =>
  asset?.environmentName?.trim() || report.environmentName?.trim() || (asset && platformEnvironment(asset)) || UNKNOWN_ENVIRONMENT

export const exposureStatusLabel = (row: TExposureRow): string => {
  if (row.isOpen) return 'Open'
  if (row.report.fixedAt) return `Fixed ${formatDate(row.report.fixedAt)}`
  if (row.report.dismissedAt) return 'Dismissed'
  return 'Closed'
}

export const buildExposureRows = (reports: VulnerabilityExposureNode[], currentId: string): TExposureRow[] => {
  const rows = reports.flatMap((report) => {
    const assets: (TExposureAsset | null)[] = getNodes({ edges: report.assets.edges })
    const hiddenAssetCount = Math.max((report.assets.totalCount ?? 0) - assets.length, 0)
    return (assets.length ? assets : [null]).map((asset, index) => ({
      key: `${report.id}:${asset?.id ?? 'unlinked'}`,
      report,
      isCurrent: report.id === currentId,
      isOpen: report.open !== false,
      asset,
      environment: resolveExposureEnvironment(report, asset),
      isFirstForReport: index === 0,
      hiddenAssetCount: index === 0 ? hiddenAssetCount : 0,
    }))
  })

  return [...rows.filter((row) => row.isCurrent), ...rows.filter((row) => !row.isCurrent)]
}

export const groupExposureRows = (rows: TExposureRow[]): TEnvironmentGroup[] => {
  const groups = new Map<string, TExposureRow[]>()
  rows.forEach((row) => {
    const group = groups.get(row.environment)
    if (group) group.push(row)
    else groups.set(row.environment, [row])
  })

  return [...groups.entries()]
    .map(([environment, groupRows]) => {
      const reports = new Map(groupRows.map((row) => [row.report.id, row.isOpen]))
      return {
        environment,
        rows: groupRows,
        reportCount: reports.size,
        openCount: [...reports.values()].filter(Boolean).length,
      }
    })
    .sort((a, b) => {
      const aCurrent = a.rows.some((row) => row.isCurrent)
      const bCurrent = b.rows.some((row) => row.isCurrent)
      if (aCurrent !== bCurrent) return aCurrent ? -1 : 1
      if (a.environment === UNKNOWN_ENVIRONMENT) return 1
      if (b.environment === UNKNOWN_ENVIRONMENT) return -1
      return a.environment.localeCompare(b.environment)
    })
}

export const exposureAssetLabel = (asset: TExposureAsset | null) => (asset ? asset.displayName || asset.name : 'No linked asset')

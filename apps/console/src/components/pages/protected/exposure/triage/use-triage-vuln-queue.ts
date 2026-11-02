import { useMemo } from 'react'
import { OrderDirection, VulnerabilityOrderField } from '@repo/codegen/src/schema'
import { useVulnerabilitiesCount, useVulnerabilitiesInfinite } from '@/lib/graphql-hooks/vulnerability'
import { buildTriageGroups, TRIAGE_PAGE_SIZE, toRailSections, toVulnRailRow, type TriageGroups, type TriageVuln, type TTriageQueue, type TTriageQueueArgs } from './triage-utils'

const ORDER_BY = [{ field: VulnerabilityOrderField.security_level, direction: OrderDirection.ASC }]

export const useTriageVulnQueue = ({ enabled, facet, listWhere, allWhere, criticalWhere, pastDueWhere, slaDefinitions }: TTriageQueueArgs): TTriageQueue<TriageVuln> => {
  const listEnabled = enabled && listWhere !== null

  const { vulnerabilitiesNodes, isLoading, isFetching, hasNextPage, isFetchingNextPage, fetchNextPage } = useVulnerabilitiesInfinite({
    where: listWhere ?? allWhere,
    orderBy: ORDER_BY,
    pageSize: TRIAGE_PAGE_SIZE,
    enabled: listEnabled,
  })

  const { count: all } = useVulnerabilitiesCount(allWhere, enabled)
  const { count: critical } = useVulnerabilitiesCount(criticalWhere, enabled)
  const { count: pastDue } = useVulnerabilitiesCount(pastDueWhere, enabled && pastDueWhere !== null)

  const groups = useMemo<TriageGroups>(() => {
    const built = buildTriageGroups(vulnerabilitiesNodes, slaDefinitions)
    return facet === 'pastdue' ? { pastDue: built.pastDue, open: [], ordered: built.pastDue } : built
  }, [vulnerabilitiesNodes, slaDefinitions, facet])

  const sections = useMemo(() => toRailSections(groups, toVulnRailRow), [groups])

  return {
    ordered: groups.ordered,
    sections,
    counts: { all, critical, pastDue },
    isLoading: listEnabled && (isLoading || (isFetching && groups.ordered.length === 0)),
    hasMore: Boolean(hasNextPage),
    isLoadingMore: isFetchingNextPage,
    onLoadMore: () => void fetchNextPage(),
  }
}

'use client'

import React, { use, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { VulnerabilityOrderField, OrderDirection, VulnerabilitySecurityLevel, type VulnerabilityWhereInput } from '@repo/codegen/src/schema'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useVulnerabilitiesInfinite, useUpdateVulnerability, useVulnerabilitiesCount } from '@/lib/graphql-hooks/vulnerability'
import { useSlaDefinitionsWithFilter } from '@/lib/graphql-hooks/sla-definition'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { canEdit } from '@/lib/authz/utils'
import { useNotification } from '@/hooks/useNotification'
import { useDebounce } from '@uidotdev/usehooks'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { buildPastDueVulnerabilityFilter, MS_PER_DAY } from '@/utils/vulnerability-due-date'
import CreateRemediationSheet from '@/components/pages/protected/remediations/create-remediation-sheet'
import { buildTriageGroups, buildVulnerabilitySearchFilter, combineVulnerabilityWhere, getVulnerabilityName, type TriageFacet, type TriageGroups } from './triage-utils'
import TriageListRail from './triage-list-rail'
import TriageDetail from './triage-detail'
import TriageQuickActions from './triage-quick-actions'
import AcceptRiskDialog from './accept-risk-dialog'

const MS_PER_HOUR = 1000 * 60 * 60
const PAGE_SIZE = 20
const ORDER_BY = [{ field: VulnerabilityOrderField.security_level, direction: OrderDirection.ASC }]

const CRITICAL_SEVERITY_FILTER: VulnerabilityWhereInput = {
  or: [{ securityLevelIn: [VulnerabilitySecurityLevel.CRITICAL] }, { securityLevelIsNil: true, severityEqualFold: 'critical' }],
}

const TriagePage: React.FC = () => {
  const { data: session } = useSession()
  const { successNotification, errorNotification } = useNotification()
  const { setCrumbs } = use(BreadcrumbContext)

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Exposure', href: '/exposure/overview' }, { label: 'Triage Queue' }])
  }, [setCrumbs])

  const [search, setSearch] = useState('')
  const [facet, setFacet] = useState<TriageFacet>('all')
  const debouncedSearch = useDebounce(search, 300)

  const { slaDefinitionsNodes } = useSlaDefinitionsWithFilter({})

  const [anchorMs, setAnchorMs] = useState(() => Math.floor(Date.now() / MS_PER_HOUR) * MS_PER_HOUR)
  useEffect(() => {
    const id = setInterval(() => setAnchorMs(Math.floor(Date.now() / MS_PER_HOUR) * MS_PER_HOUR), MS_PER_HOUR)
    return () => clearInterval(id)
  }, [])

  const searchFilter = useMemo(() => buildVulnerabilitySearchFilter(debouncedSearch), [debouncedSearch])
  const pastDueFilter = useMemo(() => buildPastDueVulnerabilityFilter(slaDefinitionsNodes, new Date(anchorMs)), [slaDefinitionsNodes, anchorMs])

  const allWhere = useMemo(() => combineVulnerabilityWhere({ open: true }, searchFilter), [searchFilter])
  const criticalWhere = useMemo(() => combineVulnerabilityWhere({ open: true }, CRITICAL_SEVERITY_FILTER, searchFilter), [searchFilter])
  const pastDueWhere = useMemo(() => (pastDueFilter ? combineVulnerabilityWhere({ open: true }, pastDueFilter, searchFilter) : null), [pastDueFilter, searchFilter])

  const listWhere = facet === 'critical' ? criticalWhere : facet === 'pastdue' ? pastDueWhere : allWhere
  const listEnabled = !(facet === 'pastdue' && !pastDueWhere)

  const { vulnerabilitiesNodes, isLoading, isFetching, hasNextPage, isFetchingNextPage, fetchNextPage } = useVulnerabilitiesInfinite({
    where: listWhere ?? { open: true },
    orderBy: ORDER_BY,
    pageSize: PAGE_SIZE,
    enabled: listEnabled,
  })

  const { count: allCount } = useVulnerabilitiesCount(allWhere)
  const { count: criticalCount } = useVulnerabilitiesCount(criticalWhere)
  const { count: pastDueCount } = useVulnerabilitiesCount(pastDueWhere, Boolean(pastDueWhere))

  const { mutateAsync: updateVulnerability, isPending: isUpdating } = useUpdateVulnerability()

  const groups = useMemo(() => buildTriageGroups(vulnerabilitiesNodes, slaDefinitionsNodes), [vulnerabilitiesNodes, slaDefinitionsNodes])
  const displayGroups = useMemo<TriageGroups>(() => (facet === 'pastdue' ? { pastDue: groups.pastDue, open: [], ordered: groups.pastDue } : groups), [facet, groups])
  const ordered = displayGroups.ordered

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [acceptRiskOpen, setAcceptRiskOpen] = useState(false)
  const [remediateVuln, setRemediateVuln] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    if (ordered.length === 0) {
      if (selectedId !== null) setSelectedId(null)
      return
    }
    if (!selectedId || !ordered.some((v) => v.id === selectedId)) {
      setSelectedId(ordered[0].id)
    }
  }, [ordered, selectedId])

  const currentIndex = ordered.findIndex((v) => v.id === selectedId)
  const selectedVuln = currentIndex >= 0 ? ordered[currentIndex] : undefined

  const { data: selectedPermission } = useAccountRoles(ObjectTypes.VULNERABILITY, selectedVuln?.id)
  const canEditSelected = canEdit(selectedPermission?.roles, session)

  const goToNeighbor = (offset: number) => {
    if (currentIndex < 0) return
    const next = ordered[currentIndex + offset]
    if (next) setSelectedId(next.id)
  }

  const runUpdate = async (input: Parameters<typeof updateVulnerability>[0]['input'], successMessage: string, onDone?: () => void) => {
    if (!selectedVuln || !canEditSelected) return
    try {
      await updateVulnerability({ updateVulnerabilityId: selectedVuln.id, input })
      successNotification({ title: 'Vulnerability Updated', description: successMessage })
      onDone?.()
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  const handleAssign = (userId: string | null) => {
    runUpdate(userId ? { externalOwnerID: userId } : { clearExternalOwnerID: true }, userId ? 'Vulnerability assigned' : 'Assignee cleared')
  }

  const handleAcceptRisk = (reason: string, comment: string) => {
    const neighborId = ordered[currentIndex + 1]?.id ?? ordered[currentIndex - 1]?.id ?? null
    runUpdate(
      {
        dismissedAt: new Date().toISOString(),
        dismissedReason: reason,
        dismissedComment: comment || undefined,
        open: false,
        vulnerabilityStatusName: 'Dismissed',
      },
      'Risk accepted',
      () => {
        setAcceptRiskOpen(false)
        setSelectedId(neighborId)
      },
    )
  }

  const handleSnooze = () => {
    if (!selectedVuln) return
    const baseIso = selectedVuln.discoveredAt || selectedVuln.createdAt
    const baseDate = baseIso ? new Date(baseIso) : new Date()
    const daysSinceBase = Math.max(0, Math.ceil((Date.now() - baseDate.getTime()) / MS_PER_DAY))
    const currentSla = selectedVuln.dueInfo.slaDays ?? 0
    const newSla = Math.max(currentSla, daysSinceBase + 7)
    runUpdate({ remediationSLA: newSla }, 'Snoozed for 7 days')
  }

  const handleRemediate = () => {
    if (!selectedVuln) return
    setRemediateVuln({ id: selectedVuln.id, name: getVulnerabilityName(selectedVuln) })
  }

  return (
    <>
      <div className="flex h-full min-h-0 overflow-hidden rounded-lg border">
        <div className="w-[340px] shrink-0">
          <TriageListRail
            groups={displayGroups}
            counts={{ all: allCount, pastDue: pastDueCount, critical: criticalCount }}
            search={search}
            onSearchChange={setSearch}
            facet={facet}
            onFacetChange={setFacet}
            selectedId={selectedId}
            onSelect={setSelectedId}
            isLoading={listEnabled && (isLoading || (isFetching && ordered.length === 0))}
            hasMore={Boolean(hasNextPage)}
            isLoadingMore={isFetchingNextPage}
            onLoadMore={() => fetchNextPage()}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col bg-secondary">
          {selectedVuln ? (
            <>
              <TriageDetail vuln={selectedVuln} />
              <TriageQuickActions
                vuln={selectedVuln}
                onAssign={handleAssign}
                onRemediate={handleRemediate}
                onAcceptRisk={() => setAcceptRiskOpen(true)}
                onSnooze={handleSnooze}
                onPrev={() => goToNeighbor(-1)}
                onNext={() => goToNeighbor(1)}
                hasPrev={currentIndex > 0}
                hasNext={currentIndex >= 0 && currentIndex < ordered.length - 1}
                isBusy={isUpdating}
                canEdit={canEditSelected}
              />
            </>
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">No open vulnerabilities to triage. You&apos;re all caught up.</div>
          )}
        </div>
      </div>

      {selectedVuln && (
        <AcceptRiskDialog
          isOpen={acceptRiskOpen}
          vulnerabilityName={getVulnerabilityName(selectedVuln)}
          isSubmitting={isUpdating}
          onClose={() => setAcceptRiskOpen(false)}
          onConfirm={handleAcceptRisk}
        />
      )}

      <CreateRemediationSheet
        isOpen={Boolean(remediateVuln)}
        onClose={() => setRemediateVuln(null)}
        initialData={remediateVuln ? { vulnerabilityIDs: [remediateVuln.id] } : undefined}
        defaultTitle={remediateVuln ? `${remediateVuln.name} Remediation`.trim() : undefined}
        onSuccess={() => setRemediateVuln(null)}
      />
    </>
  )
}

export default TriagePage

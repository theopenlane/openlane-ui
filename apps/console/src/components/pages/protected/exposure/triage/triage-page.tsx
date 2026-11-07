'use client'

import React, { use, useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { VulnerabilityGroupByField, VulnerabilitySecurityLevel, type UpdateVulnerabilityInput, type VulnerabilityWhereInput } from '@repo/codegen/src/schema'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useUpdateVulnerability } from '@/lib/graphql-hooks/vulnerability'
import { useSlaDefinitionsWithFilter } from '@/lib/graphql-hooks/sla-definition'
import { useAccountRoles, useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { canEdit, hasPermission } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { useNotification } from '@/hooks/useNotification'
import { useDebounce } from '@uidotdev/usehooks'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { buildPastDueVulnerabilityFilter } from '@/utils/vulnerability-due-date'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import CreateRemediationSheet from '@/components/pages/protected/remediations/create-remediation-sheet'
import { buildVulnerabilitySearchFilter, combineVulnerabilityWhere, getVulnerabilityName, type TriageFacet, type TriageVuln, type TTriageQueue } from './triage-utils'
import TriageListRail from './triage-list-rail'
import TriageDetail from './triage-detail'
import TriageGroupDetail from './triage-group-detail'
import TriageQuickActions from './triage-quick-actions'
import { useTriageCveGroups } from './use-triage-cve-groups'
import { useTriageVulnQueue } from './use-triage-vuln-queue'
import { useSearchParams } from 'next/navigation'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { GROUP_BY_PARAM } from '@/components/shared/crud-base/table/group-by-select'
import AcceptRiskDialog from './accept-risk-dialog'
import { buildDismissVulnerabilityInput } from '../vulnerability-dismiss-reasons'
import { useVulnerabilityReviewer } from '../../vulnerabilities/hooks/use-vulnerability-review'
import { getVulnerabilityResponsibilities } from '../../vulnerabilities/vulnerability-responsibilities'
import SnoozeVulnerabilityDialog from '../../vulnerabilities/snooze/snooze-vulnerability-dialog'
import { buildResponsibilityInlineUpdate, type ResponsibilitySelection } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'

const MS_PER_HOUR = 1000 * 60 * 60

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
  const searchParams = useSearchParams()
  const { replace: replaceParams } = useSmartRouter()
  const groupByCve = searchParams.get(GROUP_BY_PARAM) === VulnerabilityGroupByField.CVE_ID
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
  const queueArgs = { facet, listWhere, allWhere, criticalWhere, pastDueWhere, pastDueFilter, slaDefinitions: slaDefinitionsNodes }

  const vulnQueue = useTriageVulnQueue({ ...queueArgs, enabled: !groupByCve })
  const cveQueue = useTriageCveGroups({ ...queueArgs, enabled: groupByCve })
  const { ordered, ...railState }: TTriageQueue<{ id: string }> = groupByCve ? cveQueue : vulnQueue

  const { mutateAsync: updateVulnerability, isPending: isUpdating } = useUpdateVulnerability()
  const { reviewedByInput, markReviewed } = useVulnerabilityReviewer()
  const { data: orgPermission } = useOrganizationRoles()
  const canCreateRemediation = hasPermission(orgPermission?.roles, AccessEnum.CanCreateRemediation, session)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [acceptRiskOpen, setAcceptRiskOpen] = useState(false)
  const [snoozeOpen, setSnoozeOpen] = useState(false)
  const [snoozeTarget, setSnoozeTarget] = useState<TriageVuln | null>(null)
  const [remediateVuln, setRemediateVuln] = useState<{ id: string; name: string; reviewedByUserID?: string | null } | null>(null)

  const lastSelectedIndexRef = useRef(0)

  useEffect(() => {
    if (ordered.length === 0) {
      if (selectedId !== null) setSelectedId(null)
      return
    }
    const index = ordered.findIndex((v) => v.id === selectedId)
    if (index >= 0) {
      lastSelectedIndexRef.current = index
      return
    }
    setSelectedId(ordered[Math.min(lastSelectedIndexRef.current, ordered.length - 1)].id)
  }, [ordered, selectedId])

  const restartQueue = () => {
    lastSelectedIndexRef.current = 0
    setSelectedId(null)
  }

  const currentIndex = ordered.findIndex((v) => v.id === selectedId)
  const selectedVuln = groupByCve ? undefined : vulnQueue.ordered.find((vuln) => vuln.id === selectedId)
  const selectedGroup = groupByCve ? cveQueue.ordered.find((group) => group.id === selectedId) : undefined

  const { data: selectedPermission } = useAccountRoles(ObjectTypes.VULNERABILITY, selectedVuln?.id)
  const canEditSelected = canEdit(selectedPermission?.roles, session)

  const { assignee } = useMemo(() => getVulnerabilityResponsibilities(selectedVuln), [selectedVuln])

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

  const handleAssign = (selection: ResponsibilitySelection) => {
    const input = buildResponsibilityInlineUpdate('assignedTo', selection) as UpdateVulnerabilityInput
    runUpdate(input, selection ? 'Vulnerability assigned' : 'Assignee cleared')
  }

  const handleAcceptRisk = (reason: string, comment: string) => {
    const neighborId = ordered[currentIndex + 1]?.id ?? ordered[currentIndex - 1]?.id ?? null
    runUpdate({ ...buildDismissVulnerabilityInput(reason, comment), ...reviewedByInput }, 'Risk accepted', () => {
      setAcceptRiskOpen(false)
      setSelectedId(neighborId)
    })
  }

  const handleRemediate = () => {
    if (!selectedVuln) return
    setRemediateVuln({ id: selectedVuln.id, name: getVulnerabilityName(selectedVuln), reviewedByUserID: selectedVuln.reviewedByUser?.id })
  }

  return (
    <>
      <div className="flex h-full min-h-0 overflow-hidden rounded-lg border">
        <div className="w-[340px] shrink-0">
          <TriageListRail
            {...railState}
            search={search}
            onSearchChange={setSearch}
            facet={facet}
            onFacetChange={(next) => {
              restartQueue()
              setFacet(next)
            }}
            groupByCve={groupByCve}
            onGroupByCveChange={(grouped) => {
              restartQueue()
              replaceParams({ [GROUP_BY_PARAM]: grouped ? VulnerabilityGroupByField.CVE_ID : null })
            }}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col bg-secondary">
          {selectedVuln || selectedGroup ? (
            <>
              {selectedGroup ? <TriageGroupDetail key={selectedGroup.id} group={selectedGroup} slaDefinitions={slaDefinitionsNodes} /> : selectedVuln && <TriageDetail vuln={selectedVuln} />}
              <TriageQuickActions
                actions={
                  selectedVuln && {
                    assignee,
                    onAssign: handleAssign,
                    onRemediate: handleRemediate,
                    onAcceptRisk: () => setAcceptRiskOpen(true),
                    onSnooze: () => {
                      setSnoozeTarget(selectedVuln)
                      setSnoozeOpen(true)
                    },
                    canEdit: canEditSelected,
                    canCreateRemediation,
                  }
                }
                onPrev={() => goToNeighbor(-1)}
                onNext={() => goToNeighbor(1)}
                hasPrev={currentIndex > 0}
                hasNext={currentIndex >= 0 && currentIndex < ordered.length - 1}
                isBusy={isUpdating}
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

      {snoozeTarget && <SnoozeVulnerabilityDialog isOpen={snoozeOpen} vulnerability={snoozeTarget} vulnerabilityName={getVulnerabilityName(snoozeTarget)} onClose={() => setSnoozeOpen(false)} />}

      <CreateRemediationSheet
        isOpen={Boolean(remediateVuln)}
        onClose={() => setRemediateVuln(null)}
        context={remediateVuln ? { type: ObjectAssociationNodeEnum.VULNERABILITY, id: remediateVuln.id } : undefined}
        onSuccess={() => {
          const remediated = remediateVuln
          setRemediateVuln(null)
          if (remediated) markReviewed(remediated.id, { currentReviewerUserID: remediated.reviewedByUserID, canEdit: canEditSelected })
        }}
      />
    </>
  )
}

export default TriagePage

'use client'

import React, { use, useCallback, useEffect, useMemo, useState } from 'react'
import { useOrganization } from '@/hooks/useOrganization'
import { useStandardsSelect } from '@/lib/graphql-hooks/standard'
import { type ControlGroupItem, useGetControlsGroupedByCategoryResolver } from '@/lib/graphql-hooks/control'
import { useOrgCoverageMap, useFrameworkCoverageMap } from '@/lib/graphql-hooks/mapped-control'
import { Accordion } from '@radix-ui/react-accordion'
import { ControlControlStatus, EvidenceEvidenceStatus, type ControlWhereInput } from '@repo/codegen/src/schema'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { canCreate } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { ControlReportPageSkeleton } from './skeleton/control-report-page-skeleton'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { useGetAllGroups } from '@/lib/graphql-hooks/group'
import ReportToolbar from './report-toolbar'
import ReportBulkActionBar from './report-bulk-action-bar'
import ReportCategory from './report-category'
import ReportEmptyState from './report-empty-state'
import { useReportSelection } from './use-report-selection'

type TControlReportPageProps = {
  active: 'dashboard' | 'table'
  setActive: (tab: 'dashboard' | 'table') => void
}

const REPORT_STANDARD_KEY = 'control_report_selected_standard'

const ControlReportPage: React.FC<TControlReportPageProps> = ({ active, setActive }) => {
  const { currentOrgId } = useOrganization()
  const { setCrumbs } = use(BreadcrumbContext)
  const [selectedStandard, setSelectedStandard] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem(REPORT_STANDARD_KEY) ?? ''
  })
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false)
  const [expandedControls, setExpandedControls] = useState<Record<string, boolean>>({})
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [reportFilters, setReportFilters] = useState<Set<string>>(() => new Set())

  const { data: permission } = useOrganizationRoles()
  const createAllowed = canCreate(permission?.roles, AccessEnum.CanCreateControl)

  const { standardOptions, isSuccess: isSuccessStandards } = useStandardsSelect({
    where: {
      shortNameNEQ: 'OTS',
      hasControlsWith: [
        {
          hasOwnerWith: [{ id: currentOrgId }],
        },
      ],
    },
    enabled: Boolean(currentOrgId),
  })

  const effectiveStandard = useMemo(() => {
    if (selectedStandard) return selectedStandard
    const neverSet = typeof window !== 'undefined' && localStorage.getItem(REPORT_STANDARD_KEY) === null
    if (neverSet && isSuccessStandards && standardOptions.length > 0) return standardOptions[0].value
    return ''
  }, [selectedStandard, isSuccessStandards, standardOptions])

  const isCustomView = effectiveStandard === 'CUSTOM'

  const where: ControlWhereInput | undefined = useMemo(() => {
    const base: ControlWhereInput = {
      ownerIDNEQ: '',
      statusNotIn: [ControlControlStatus.ARCHIVED, ControlControlStatus.NOT_APPLICABLE],
    }

    if (!effectiveStandard) return base
    if (effectiveStandard === 'CUSTOM') {
      base.referenceFrameworkIsNil = true
      return base
    }

    base.standardIDIn = [effectiveStandard]
    return base
  }, [effectiveStandard])

  const { data, isLoading, isFetching } = useGetControlsGroupedByCategoryResolver({
    where,
    enabled: Boolean(currentOrgId),
  })

  const sortedData = useMemo(() => {
    if (!data) return data
    const sorted = data.map((entry) => ({
      ...entry,
      controls: [...entry.controls].sort((a, b) => a.refCode.localeCompare(b.refCode, undefined, { numeric: true })),
    }))
    return sorted.sort((a, b) => {
      const minA = a.controls[0]?.refCode ?? ''
      const minB = b.controls[0]?.refCode ?? ''
      return minA.localeCompare(minB, undefined, { numeric: true })
    })
  }, [data])

  const hasNoControls = !sortedData || sortedData.length === 0 || sortedData.every((entry) => entry.controls.length === 0)

  const allControlRows = useMemo(() => (sortedData ?? []).flatMap((entry) => entry.controls.map((c) => ({ id: c.id, refCode: c.refCode, referenceFramework: c.referenceFramework }))), [sortedData])
  const allControlIds = useMemo(() => allControlRows.map((r) => r.id), [allControlRows])
  const orgCoverageMap = useOrgCoverageMap(isCustomView ? [] : allControlRows)
  const frameworkCoverageMap = useFrameworkCoverageMap(isCustomView ? allControlIds : [])

  const filteredSortedData = useMemo(() => {
    if (!sortedData || reportFilters.size === 0) return sortedData

    return sortedData
      .map((entry) => ({
        ...entry,
        controls: entry.controls.filter((control) => {
          const coverageData = orgCoverageMap.get(control.id)
          const frameworkData = frameworkCoverageMap.get(control.id)

          const mappedEvidenceRefs = isCustomView ? [...(frameworkData?.evidenceRefs ?? []), ...(coverageData?.evidenceRefs ?? [])] : (coverageData?.evidenceRefs ?? [])
          const seen = new Set<string>()
          const allEvidenceRefs = [...(control.evidenceRefs ?? []), ...mappedEvidenceRefs].filter((r) => {
            if (seen.has(r.id)) return false
            seen.add(r.id)
            return true
          })
          const evidenceTotal = allEvidenceRefs.length

          const seenPolicies = new Set<string>()
          const policies = [...(control.linkedPolicies ?? []), ...(isCustomView ? (frameworkData?.linkedPolicies ?? []) : (coverageData?.linkedPolicies ?? []))].filter((p) => {
            if (seenPolicies.has(p.id)) return false
            seenPolicies.add(p.id)
            return true
          })

          for (const filterId of reportFilters) {
            if (filterId === 'NOT_APPROVED' && control.status !== ControlControlStatus.APPROVED) return true
            if (filterId === 'NO_OWNER' && !control.controlOwner) return true
            if (filterId === 'NO_EVIDENCE' && evidenceTotal === 0) return true
            if (filterId === 'EVIDENCE_NON_APPROVED' && evidenceTotal > 0 && allEvidenceRefs.some((r) => r.status !== EvidenceEvidenceStatus.AUDITOR_APPROVED)) return true
            if (filterId === 'NO_POLICIES' && policies.length === 0) return true
            if (filterId === 'NO_ORG_CONTROLS' && !isCustomView && (!coverageData || coverageData.orgControlRefs.length === 0)) return true
            if (filterId === 'NO_FRAMEWORK_CONTROLS' && isCustomView && (!frameworkData || frameworkData.frameworkControlRefs.length === 0)) return true
          }
          return false
        }),
      }))
      .filter((entry) => entry.controls.length > 0)
  }, [sortedData, reportFilters, orgCoverageMap, frameworkCoverageMap, isCustomView])

  useEffect(() => {
    if (isSuccessStandards && standardOptions.length > 0 && localStorage.getItem(REPORT_STANDARD_KEY) === null) {
      const first = standardOptions[0].value
      setSelectedStandard(first)
      localStorage.setItem(REPORT_STANDARD_KEY, first)
    }
  }, [isSuccessStandards, standardOptions])

  useEffect(() => {
    if (sortedData && !hasAutoExpanded && sortedData.length > 0) {
      setExpandedItems(sortedData.map((item) => item.category))
      setHasAutoExpanded(true)
    }
  }, [sortedData, hasAutoExpanded])

  useEffect(() => {
    setHasAutoExpanded(false)
  }, [effectiveStandard])

  const { data: groupsData } = useGetAllGroups({ where: {}, enabled: true })
  const groups = useMemo(() => (groupsData?.groups?.edges ?? []).map((e) => e?.node).filter((g): g is NonNullable<typeof g> => !!g), [groupsData])

  const { selectedControlIds, selectedSubcontrolIds, toggleControlSelection, toggleSubcontrolSelection, batchSelectSubcontrols, setSelectionForCategory, clearSelection, handleBulkAction } =
    useReportSelection({ orgCoverageMap, frameworkCoverageMap, isCustomView })

  const toggleReportFilter = useCallback((filterId: string) => {
    setReportFilters((prev) => {
      const next = new Set(prev)
      if (next.has(filterId)) next.delete(filterId)
      else next.add(filterId)
      return next
    })
  }, [])

  const toggleControl = (id: string) => {
    setExpandedControls((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleAll = () => {
    const activeData = filteredSortedData ?? sortedData
    if (!activeData) return
    const allCategories = activeData.map((item) => item.category)
    const hasAllExpanded = allCategories.every((cat) => expandedItems.includes(cat))
    setExpandedItems(hasAllExpanded ? [] : allCategories)
  }

  const toggleCategorySubcontrols = useCallback(
    (category: string, categoryControls: ControlGroupItem[]) => {
      const withSubs = categoryControls.filter((c) => c.subcontrolCount > 0)
      const allExpanded = withSubs.every((c) => expandedControls[c.id])
      setExpandedControls((prev) => {
        const next = { ...prev }
        withSubs.forEach((c) => {
          next[c.id] = !allExpanded
        })
        return next
      })
      if (!allExpanded) {
        setExpandedItems((prev) => (prev.includes(category) ? prev : [...prev, category]))
      }
    },
    [expandedControls],
  )

  const selectFilter = (value: string) => {
    const next = value === effectiveStandard ? '' : value
    setSelectedStandard(next)
    localStorage.setItem(REPORT_STANDARD_KEY, next)
  }

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Compliance', href: '/programs' },
      { label: 'Controls', href: '/controls' },
    ])
  }, [setCrumbs])

  if (isLoading || !data) {
    return <ControlReportPageSkeleton />
  }

  const showActions = !isLoading && !isFetching && !hasNoControls
  const allExpanded = (filteredSortedData ?? sortedData ?? []).every((e) => expandedItems.includes(e.category))

  return (
    <div>
      <ReportToolbar
        active={active}
        setActive={setActive}
        showActions={showActions}
        allExpanded={allExpanded}
        onToggleExpandAll={toggleAll}
        isSelectionMode={isSelectionMode}
        onToggleSelectionMode={() => {
          if (isSelectionMode) clearSelection()
          setIsSelectionMode((prev) => !prev)
        }}
        effectiveStandard={effectiveStandard}
        standardOptions={standardOptions}
        onSelectFilter={selectFilter}
        isCustomView={isCustomView}
        reportFilters={reportFilters}
        onToggleReportFilter={toggleReportFilter}
        onClearReportFilters={() => setReportFilters(new Set())}
        createAllowed={createAllowed}
        hasNoControls={hasNoControls}
      />

      {isSelectionMode && (selectedControlIds.size > 0 || selectedSubcontrolIds.size > 0) && (
        <ReportBulkActionBar
          selectedControlCount={selectedControlIds.size}
          selectedSubcontrolCount={selectedSubcontrolIds.size}
          isCustomView={isCustomView}
          groups={groups}
          onApply={handleBulkAction}
          onClear={clearSelection}
        />
      )}

      <div className="space-y-2">
        {isLoading || isFetching ? (
          <ControlReportPageSkeleton />
        ) : hasNoControls ? (
          <ReportEmptyState />
        ) : (
          <>
            {reportFilters.size > 0 && filteredSortedData?.length === 0 && (
              <p className="mt-4 rounded-md border border-border/30 bg-muted/20 px-5 py-2.5 text-base text-muted-foreground shadow-sm">No controls match the selected report filters.</p>
            )}
            <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems}>
              {filteredSortedData?.map(({ category, controls }) => {
                if (controls.length === 0) return null
                return (
                  <ReportCategory
                    key={category}
                    category={category}
                    controls={controls}
                    isOpen={expandedItems.includes(category)}
                    isCustomView={isCustomView}
                    isSelectionMode={isSelectionMode}
                    expandedControls={expandedControls}
                    onToggleControl={toggleControl}
                    onToggleCategorySubcontrols={toggleCategorySubcontrols}
                    selectedControlIds={selectedControlIds}
                    selectedSubcontrolIds={selectedSubcontrolIds}
                    onSelectControl={toggleControlSelection}
                    onSelectAllControls={(ids) => setSelectionForCategory(ids, ids.length > 0)}
                    onSelectSubcontrol={toggleSubcontrolSelection}
                    onSelectAllSubcontrols={batchSelectSubcontrols}
                    orgCoverageMap={orgCoverageMap}
                    frameworkCoverageMap={frameworkCoverageMap}
                  />
                )
              })}
            </Accordion>
          </>
        )}
      </div>
    </div>
  )
}

export default ControlReportPage

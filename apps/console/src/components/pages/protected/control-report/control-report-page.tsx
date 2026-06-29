'use client'

import React, { use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useOrganization } from '@/hooks/useOrganization'
import { useStandardsSelect } from '@/lib/graphql-hooks/standard'
import { type ControlReportItem, useControlReports } from '@/lib/graphql-hooks/control'
import { ControlControlStatus, type ControlWhereInput } from '@repo/codegen/src/schema'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { hasPermission } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { ControlReportPageSkeleton } from './skeleton/control-report-page-skeleton'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { useGetAllGroups } from '@/lib/graphql-hooks/group'
import ReportToolbar from './report-toolbar'
import ReportBulkActionBar from './report-bulk-action-bar'
import ReportVirtualList from './report-virtual-list'
import ReportEmptyState from './report-empty-state'
import { useReportSelection } from './use-report-selection'
import { getOrgRelatedControls, getFrameworkRelatedControls } from './report-coverage'
import { type ReportFilterId } from './report-filter-options'

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
  const [reportFilters, setReportFilters] = useState<Set<ReportFilterId>>(() => new Set())
  const userSelectedStandardRef = useRef(false)

  const { data: permission } = useOrganizationRoles()
  const createAllowed = hasPermission(permission?.roles, AccessEnum.CanCreateControl)

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

  const { data, isLoading, isFetching } = useControlReports({
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

  const mappedControlIdsByControl = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const entry of sortedData ?? []) {
      for (const control of entry.controls) {
        const related = isCustomView ? getFrameworkRelatedControls(control.relatedControls) : getOrgRelatedControls(control.relatedControls)
        map.set(
          control.id,
          related.map((r) => r.id),
        )
      }
    }
    return map
  }, [sortedData, isCustomView])

  const filteredSortedData = useMemo(() => {
    if (!sortedData || reportFilters.size === 0) return sortedData

    return sortedData
      .map((entry) => ({
        ...entry,
        controls: entry.controls.filter((control) => {
          const evidenceTotal = control.evidenceStatus?.totalCount ?? 0
          const evidenceApproved = control.evidenceStatus?.approvedCount ?? 0
          const policyCount = control.linkedPolicies?.totalCount ?? 0
          const orgRelatedCount = getOrgRelatedControls(control.relatedControls).length
          const frameworkRelatedCount = getFrameworkRelatedControls(control.relatedControls).length

          for (const filterId of reportFilters) {
            if (filterId === 'NOT_APPROVED' && control.status === ControlControlStatus.APPROVED) return false
            if (filterId === 'NO_OWNER' && control.controlOwner) return false
            if (filterId === 'NO_EVIDENCE' && evidenceTotal !== 0) return false
            if (filterId === 'EVIDENCE_NON_APPROVED' && !(evidenceTotal > 0 && evidenceApproved < evidenceTotal)) return false
            if (filterId === 'NO_POLICIES' && policyCount !== 0) return false
            if (filterId === 'NO_ORG_CONTROLS' && !isCustomView && orgRelatedCount !== 0) return false
            if (filterId === 'NO_FRAMEWORK_CONTROLS' && isCustomView && frameworkRelatedCount !== 0) return false
          }
          return true
        }),
      }))
      .filter((entry) => entry.controls.length > 0)
  }, [sortedData, reportFilters, isCustomView])

  useEffect(() => {
    if (isSuccessStandards && standardOptions.length > 0 && localStorage.getItem(REPORT_STANDARD_KEY) === null) {
      const first = standardOptions[0].value
      setSelectedStandard(first)
      localStorage.setItem(REPORT_STANDARD_KEY, first)
    }
  }, [isSuccessStandards, standardOptions])

  useEffect(() => {
    if (userSelectedStandardRef.current) return
    if (effectiveStandard !== 'CUSTOM') return
    if (isFetching || !data || !hasNoControls) return
    if (!isSuccessStandards || standardOptions.length === 0) return

    const preferred = standardOptions.find((opt) => opt.label.replace(/\s+/g, '').toLowerCase() === 'soc2') ?? standardOptions[0]
    setSelectedStandard(preferred.value)
  }, [effectiveStandard, isFetching, data, hasNoControls, isSuccessStandards, standardOptions])

  useEffect(() => {
    if (sortedData && !hasAutoExpanded && sortedData.length > 0) {
      setExpandedItems(sortedData.map((item) => item.category))
      setHasAutoExpanded(true)
    }
  }, [sortedData, hasAutoExpanded])

  useEffect(() => {
    setHasAutoExpanded(false)
    setExpandedControls({})
  }, [effectiveStandard])

  const { data: groupsData } = useGetAllGroups({ where: {}, enabled: true })
  const groups = useMemo(() => (groupsData?.groups?.edges ?? []).map((e) => e?.node).filter((g): g is NonNullable<typeof g> => !!g), [groupsData])

  const { selectedControlIds, selectedSubcontrolIds, toggleControlSelection, toggleSubcontrolSelection, batchSelectSubcontrols, setSelectionForCategory, clearSelection, handleBulkAction } =
    useReportSelection({ mappedControlIdsByControl })

  const toggleReportFilter = useCallback((filterId: ReportFilterId) => {
    setReportFilters((prev) => {
      const next = new Set(prev)
      if (next.has(filterId)) next.delete(filterId)
      else next.add(filterId)
      return next
    })
  }, [])

  const toggleControl = useCallback((id: string) => {
    setExpandedControls((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const toggleCategoryOpen = useCallback((category: string) => {
    setExpandedItems((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]))
  }, [])

  const toggleAll = () => {
    const activeData = filteredSortedData ?? sortedData
    if (!activeData) return
    const allCategories = activeData.map((item) => item.category)
    const hasAllExpanded = allCategories.every((cat) => expandedItems.includes(cat))
    setExpandedItems(hasAllExpanded ? [] : allCategories)
  }

  const toggleCategorySubcontrols = useCallback(
    (category: string, categoryControls: ControlReportItem[]) => {
      const withSubs = categoryControls.filter((c) => (c.subcontrols?.length ?? 0) > 0)
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
    userSelectedStandardRef.current = true
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
            <ReportVirtualList
              categories={filteredSortedData ?? []}
              expandedItems={expandedItems}
              expandedControls={expandedControls}
              isCustomView={isCustomView}
              isSelectionMode={isSelectionMode}
              selectedControlIds={selectedControlIds}
              selectedSubcontrolIds={selectedSubcontrolIds}
              onToggleCategoryOpen={toggleCategoryOpen}
              onToggleControl={toggleControl}
              onToggleCategorySubcontrols={toggleCategorySubcontrols}
              onSelectControl={toggleControlSelection}
              onSelectAllControls={(ids) => setSelectionForCategory(ids, ids.length > 0)}
              onSelectSubcontrol={toggleSubcontrolSelection}
              onSelectAllSubcontrols={batchSelectSubcontrols}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default ControlReportPage

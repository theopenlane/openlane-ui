'use client'

import React, { use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useOrganization } from '@/hooks/useOrganization'
import { useStandardsSelect } from '@/lib/graphql-hooks/standard'
import { useProgramSelect } from '@/lib/graphql-hooks/program'
import { type ControlReportItem, useControlReports, useGetAllControls } from '@/lib/graphql-hooks/control'
import { ControlControlStatus, ProgramProgramStatus, type ControlWhereInput } from '@repo/codegen/src/schema'
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
import ReportNoFilterMatches from './report-no-filter-matches'
import ReportLoadingIndicator from './report-loading-indicator'
import { getGridMinWidth } from './control-report-grid'
import { useReportSelection } from './use-report-selection'
import { getOrgRelatedControls, getFrameworkRelatedControls } from './report-coverage'
import { type ReportFilterId } from './report-filter-options'
import { getOrganizationStorageItem, removeOrganizationStorageItem, setOrganizationStorageItem } from '@/lib/storage/organization-storage'
import { compareNatural } from '@/lib/sort'
import { useSession } from 'next-auth/react'

type TControlReportPageProps = {
  active: 'dashboard' | 'table'
  setActive: (tab: 'dashboard' | 'table') => void
}

const REPORT_STANDARD_KEY = 'control_report_selected_standard'
const REPORT_PROGRAMS_KEY = 'control_report_selected_programs'

const readStoredPrograms = (organizationId?: string): string[] => {
  try {
    const raw = getOrganizationStorageItem(REPORT_PROGRAMS_KEY, organizationId)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

const ControlReportPage: React.FC<TControlReportPageProps> = ({ active, setActive }) => {
  const { currentOrgId } = useOrganization()
  const { setCrumbs } = use(BreadcrumbContext)
  const [selectedStandard, setSelectedStandard] = useState<string>(() => getOrganizationStorageItem(REPORT_STANDARD_KEY, currentOrgId) ?? '')
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>(() => readStoredPrograms(currentOrgId))
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [expandedControls, setExpandedControls] = useState<Record<string, boolean>>({})
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [reportFilters, setReportFilters] = useState<Set<ReportFilterId>>(() => new Set())
  const userSelectedStandardRef = useRef(false)
  const userTouchedExpansionRef = useRef(false)
  const expansionScopeRef = useRef<ControlWhereInput | undefined>(undefined)

  const { data: permission } = useOrganizationRoles()
  const { data: session } = useSession()
  const createAllowed = hasPermission(permission?.roles, AccessEnum.CanCreateControl, session)

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

  const { programOptions, isSuccess: isSuccessPrograms } = useProgramSelect({
    where: { statusNEQ: ProgramProgramStatus.ARCHIVED },
  })

  const effectiveStandard = useMemo(() => {
    const selectedStandardIsAvailable = selectedStandard === 'CUSTOM' || standardOptions.some((option) => option.value === selectedStandard)
    if (selectedStandard && (!isSuccessStandards || selectedStandardIsAvailable)) return selectedStandard
    const neverSet = typeof window !== 'undefined' && getOrganizationStorageItem(REPORT_STANDARD_KEY, currentOrgId) === null
    if (neverSet && isSuccessStandards && standardOptions.length > 0) return standardOptions[0].value
    return ''
  }, [selectedStandard, isSuccessStandards, standardOptions, currentOrgId])

  const isCustomView = effectiveStandard === 'CUSTOM'

  const organizationControlsWhere: ControlWhereInput = useMemo(
    () => ({
      ownerIDNEQ: '',
    }),
    [],
  )

  const where: ControlWhereInput | undefined = useMemo(() => {
    const base: ControlWhereInput = {
      ...organizationControlsWhere,
      statusNotIn: [ControlControlStatus.ARCHIVED, ControlControlStatus.NOT_APPLICABLE],
    }

    if (selectedPrograms.length > 0) {
      base.hasProgramsWith = [{ idIn: selectedPrograms }]
    }

    if (!effectiveStandard) return base
    if (effectiveStandard === 'CUSTOM') {
      base.referenceFrameworkIsNil = true
      return base
    }

    base.standardIDIn = [effectiveStandard]
    return base
  }, [effectiveStandard, organizationControlsWhere, selectedPrograms])

  const { data: organizationControlsData, isLoading: isLoadingOrganizationControls } = useGetAllControls({
    where: organizationControlsWhere,
    pagination: { page: 1, pageSize: 1, query: { first: 1 } },
    enabled: Boolean(currentOrgId),
  })

  const { data, loadedCount, totalCount, isLoading, isLoadingMore, isRefetching } = useControlReports({
    where,
    enabled: Boolean(currentOrgId) && (Boolean(effectiveStandard) || isSuccessStandards),
  })

  const sortedData = useMemo(() => {
    if (!data) return data
    const sorted = data.map((entry) => ({
      ...entry,
      controls: [...entry.controls].sort((a, b) => compareNatural(a.refCode, b.refCode)),
    }))
    return sorted.sort((a, b) => compareNatural(a.controls[0]?.refCode ?? '', b.controls[0]?.refCode ?? ''))
  }, [data])

  const hasNoOrganizationControls = organizationControlsData?.controls.totalCount === 0
  const hasNoReportControls = !sortedData || sortedData.length === 0 || sortedData.every((entry) => entry.controls.length === 0)

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
    setSelectedStandard(getOrganizationStorageItem(REPORT_STANDARD_KEY, currentOrgId) ?? '')
    setSelectedPrograms(readStoredPrograms(currentOrgId))
    setReportFilters(new Set())
    userSelectedStandardRef.current = false
  }, [currentOrgId])

  useEffect(() => {
    if (!isSuccessStandards || !selectedStandard || selectedStandard === 'CUSTOM') return
    if (standardOptions.some((option) => option.value === selectedStandard)) return
    // On an org switch this effect can fire with the previous org's standard still in
    // state (the reset effect's update lands next render); only clean up once state
    // reflects what is actually stored for the current org.
    if (getOrganizationStorageItem(REPORT_STANDARD_KEY, currentOrgId) !== selectedStandard) return

    setSelectedStandard('')
    // Remove rather than store '' so the auto-select effect can still pick a default
    removeOrganizationStorageItem(REPORT_STANDARD_KEY, currentOrgId)
  }, [isSuccessStandards, selectedStandard, standardOptions, currentOrgId])

  useEffect(() => {
    if (!isSuccessPrograms || selectedPrograms.length === 0) return
    const availableProgramIds = new Set(programOptions.map((option) => option.value))
    const validPrograms = selectedPrograms.filter((id) => availableProgramIds.has(id))
    if (validPrograms.length === selectedPrograms.length) return

    setSelectedPrograms(validPrograms)
    setOrganizationStorageItem(REPORT_PROGRAMS_KEY, JSON.stringify(validPrograms), currentOrgId)
  }, [isSuccessPrograms, selectedPrograms, programOptions, currentOrgId])

  useEffect(() => {
    if (isSuccessStandards && standardOptions.length > 0 && getOrganizationStorageItem(REPORT_STANDARD_KEY, currentOrgId) === null) {
      const first = standardOptions[0].value
      setSelectedStandard(first)
      setOrganizationStorageItem(REPORT_STANDARD_KEY, first, currentOrgId)
    }
  }, [isSuccessStandards, standardOptions, currentOrgId])

  useEffect(() => {
    if (userSelectedStandardRef.current) return
    if (effectiveStandard !== 'CUSTOM') return
    if (isLoading || isLoadingMore || !data || !hasNoReportControls) return
    if (!isSuccessStandards || standardOptions.length === 0) return

    const preferred = standardOptions.find((opt) => opt.label.replace(/\s+/g, '').toLowerCase() === 'soc2') ?? standardOptions[0]
    setSelectedStandard(preferred.value)
  }, [effectiveStandard, isLoading, isLoadingMore, data, hasNoReportControls, isSuccessStandards, standardOptions])

  useEffect(() => {
    if (!sortedData) return
    const categories = sortedData.map((item) => item.category)

    if (expansionScopeRef.current !== where) {
      expansionScopeRef.current = where
      userTouchedExpansionRef.current = false
      setExpandedControls({})
      setExpandedItems(categories)
      return
    }

    if (userTouchedExpansionRef.current) return
    setExpandedItems((prev) => {
      const unseen = categories.filter((category) => !prev.includes(category))
      return unseen.length === 0 ? prev : [...prev, ...unseen]
    })
  }, [sortedData, where])

  const { data: groupsData } = useGetAllGroups({ where: {}, enabled: true })
  const groups = useMemo(() => (groupsData?.groups?.edges ?? []).map((e) => e?.node).filter((g): g is NonNullable<typeof g> => !!g), [groupsData])

  const { selectedControlIds, selectedSubcontrolIds, toggleControlSelection, toggleSubcontrolSelection, batchSelectSubcontrols, setSelectionForCategory, clearSelection, handleBulkAction } =
    useReportSelection({ mappedControlIdsByControl })

  useEffect(() => {
    if (!isLoadingMore || !isSelectionMode) return
    clearSelection()
    setIsSelectionMode(false)
  }, [isLoadingMore, isSelectionMode, clearSelection])

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
    userTouchedExpansionRef.current = true
    setExpandedItems((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]))
  }, [])

  const toggleAll = () => {
    const activeData = filteredSortedData ?? sortedData
    if (!activeData) return
    const allCategories = activeData.map((item) => item.category)
    const hasAllExpanded = allCategories.every((cat) => expandedItems.includes(cat))
    userTouchedExpansionRef.current = hasAllExpanded
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
    if (!value || value === effectiveStandard) return
    userSelectedStandardRef.current = true
    setSelectedStandard(value)
    setOrganizationStorageItem(REPORT_STANDARD_KEY, value, currentOrgId)
  }

  const toggleProgram = useCallback(
    (id: string) => {
      setSelectedPrograms((prev) => {
        const next = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
        setOrganizationStorageItem(REPORT_PROGRAMS_KEY, JSON.stringify(next), currentOrgId)
        return next
      })
    },
    [currentOrgId],
  )

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Compliance', href: '/programs' },
      { label: 'Controls', href: '/controls' },
    ])
  }, [setCrumbs])

  if (isLoadingOrganizationControls || !organizationControlsData) {
    return <ControlReportPageSkeleton />
  }

  const hasNoMatchingControls = !filteredSortedData || filteredSortedData.length === 0 || filteredSortedData.every((entry) => entry.controls.length === 0)
  const visibleCategories = filteredSortedData ?? sortedData ?? []
  const allExpanded = visibleCategories.length > 0 && visibleCategories.every((e) => expandedItems.includes(e.category))
  const showList = !hasNoOrganizationControls && !hasNoMatchingControls

  return (
    <div style={hasNoOrganizationControls ? undefined : { minWidth: `${getGridMinWidth(isCustomView, isSelectionMode)}px` }}>
      <ReportToolbar
        active={active}
        setActive={setActive}
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
        programOptions={programOptions}
        selectedPrograms={selectedPrograms}
        onToggleProgram={toggleProgram}
        isCustomView={isCustomView}
        reportFilters={reportFilters}
        onToggleReportFilter={toggleReportFilter}
        onClearReportFilters={() => setReportFilters(new Set())}
        createAllowed={createAllowed}
        hasNoControls={hasNoOrganizationControls}
        hasVisibleControls={!hasNoMatchingControls}
        canSelect={!isLoadingMore}
      />

      {isSelectionMode && (selectedControlIds.size > 0 || selectedSubcontrolIds.size > 0) && (
        <ReportBulkActionBar
          selectedControlCount={selectedControlIds.size}
          selectedSubcontrolCount={selectedSubcontrolIds.size}
          isCustomView={isCustomView}
          groups={groups}
          programOptions={programOptions}
          onApply={handleBulkAction}
          onClear={clearSelection}
        />
      )}

      <div className="space-y-2">
        {hasNoOrganizationControls ? (
          <ReportEmptyState />
        ) : !data ? (
          <ControlReportPageSkeleton />
        ) : showList ? (
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
        ) : isLoadingMore ? (
          <ControlReportPageSkeleton />
        ) : (
          <ReportNoFilterMatches />
        )}
        {(isLoadingMore || isRefetching) && showList && <ReportLoadingIndicator loadedCount={loadedCount} totalCount={totalCount} isRefetching={isRefetching} />}
      </div>
    </div>
  )
}

export default ControlReportPage

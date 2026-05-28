import React, { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import SubcontrolsTable from './subcontrols-table'
import { useGetMappedControls, buildLinkedControlsWhere } from '@/lib/graphql-hooks/mapped-control'
import { useGetControlsByRefCode, type ControlsByRefcodeNode } from '@/lib/graphql-hooks/control'
import { useGetSubcontrolsByRefCode, type SubcontrolsByRefcodeNode } from '@/lib/graphql-hooks/subcontrol'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import MappedControlsTable from './mapped-controls-table'
import type { MappedControlRow, SatisfiesTarget } from './mapped-controls-types'
import { getMappedControlsActionsColumn, getMappedControlsBaseColumns, getMappedControlsFrameworkColumns, getOrgControlsColumns } from './mapped-controls-config'
import type { LinkedControlDetails } from './types'
import { useGetSubcontrolsPaginated } from '@/lib/graphql-hooks/subcontrol'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { TableSkeleton } from '@/components/shared/skeleton/table-skeleton'
import EmptyTabState from '@/components/shared/crud-base/tabs/empty-tab-state'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { QuickMapControlDialog } from './quick-map-control-dialog'
import ParentControlCard from './parent-control-card'
import { MappedControlMappingSource } from '@repo/codegen/src/schema'

export type LinkedControlsTabProps = {
  controlId?: string
  subcontrolId?: string
  parentControlId?: string
  refCode: string
  sourceFramework?: string | null
}

const LinkedControlsTab: React.FC<LinkedControlsTabProps> = ({ controlId, subcontrolId, parentControlId, refCode, sourceFramework }) => {
  const isSubcontrolMode = !!subcontrolId
  const mappedControlWhere = useMemo(() => buildLinkedControlsWhere({ controlId, subcontrolId, refCode, sourceFramework }), [controlId, subcontrolId, refCode, sourceFramework])

  const { data: mappedControlsData, isLoading: isMappedControlsLoading } = useGetMappedControls({ where: mappedControlWhere, enabled: Boolean(controlId || subcontrolId) })

  const { paginationMeta: subcontrolsPaginationMeta, isLoading: isSubcontrolsLoading } = useGetSubcontrolsPaginated({
    where: controlId ? { controlID: controlId } : undefined,
    pagination: DEFAULT_PAGINATION,
    enabled: Boolean(controlId) && !isSubcontrolMode,
  })

  const mappedControls = useMemo<MappedControlRow[]>(() => {
    const rowsByCode = new Map<string, MappedControlRow>()

    const mergeSatisfiesTargets = (existing: SatisfiesTarget[] | undefined, incoming: SatisfiesTarget[] | undefined): SatisfiesTarget[] | undefined => {
      if (!existing && !incoming) return undefined
      const merged = existing ? [...existing] : []
      const seenKeys = new Set(merged.map((t) => `${t.level}:${t.id}`))
      ;(incoming ?? []).forEach((t) => {
        const key = `${t.level}:${t.id}`
        if (seenKeys.has(key)) return
        seenKeys.add(key)
        merged.push(t)
      })
      return merged.length > 0 ? merged : undefined
    }

    const mergeInherited = (existing: Array<{ id: string; refCode: string }> | undefined, incoming: Array<{ id: string; refCode: string }> | undefined) => {
      if (!existing && !incoming) return undefined
      const merged = existing ? [...existing] : []
      const seenIds = new Set(merged.map((s) => s.id))
      ;(incoming ?? []).forEach((s) => {
        if (seenIds.has(s.id)) return
        seenIds.add(s.id)
        merged.push(s)
      })
      return merged.length > 0 ? merged : undefined
    }

    const upsertRow = (key: string, candidate: MappedControlRow) => {
      const existing = rowsByCode.get(key)
      if (!existing) {
        rowsByCode.set(key, candidate)
        return
      }
      existing.satisfiesTargets = mergeSatisfiesTargets(existing.satisfiesTargets, candidate.satisfiesTargets)
      existing.inheritedFromSubcontrols = mergeInherited(existing.inheritedFromSubcontrols, candidate.inheritedFromSubcontrols)
      if (existing.isSystemOwnedMapping && !candidate.isSystemOwnedMapping) {
        existing.mappedControlId = candidate.mappedControlId
        existing.isSystemOwnedMapping = false
      }
    }

    const edges = mappedControlsData?.mappedControls?.edges ?? []
    edges.forEach((edge) => {
      const node = edge?.node
      if (!node) return

      const mappingSource = node.source ?? MappedControlMappingSource.SUGGESTED
      const fromControls = node.fromControls?.edges?.map((e) => e?.node).filter(Boolean) ?? []
      const toControls = node.toControls?.edges?.map((e) => e?.node).filter(Boolean) ?? []
      const fromSubcontrols = node.fromSubcontrols?.edges?.map((e) => e?.node).filter(Boolean) ?? []
      const toSubcontrols = node.toSubcontrols?.edges?.map((e) => e?.node).filter(Boolean) ?? []

      const controls = [...fromControls, ...toControls]
      const subcontrols = [...fromSubcontrols, ...toSubcontrols]

      // Subcontrols belonging to the current control used to derive satisfies targets
      const subcontrolsOfCurrentControl = [...fromSubcontrols, ...toSubcontrols].filter(
        (s): s is NonNullable<typeof s> & { id: string; refCode: string } => s != null && s.controlID === controlId && s.refCode != null,
      )

      controls.forEach((control) => {
        if (!control?.id || !control?.refCode) return
        if (!isSubcontrolMode && (control.id === controlId || control.refCode === refCode)) return
        const dedupeKey = `Control-${control.refCode}-${control.referenceFramework ?? 'CUSTOM'}`

        const isCustomControl = !control.referenceFramework || control.referenceFramework === 'CUSTOM'
        let satisfiesTargets: SatisfiesTarget[] | undefined
        let inheritedFromSubcontrols: Array<{ id: string; refCode: string }> | undefined
        if (isCustomControl) {
          if (!isSubcontrolMode && controlId) {
            if (subcontrolsOfCurrentControl.length > 0) {
              satisfiesTargets = subcontrolsOfCurrentControl.map((s) => ({
                id: s.id,
                refCode: s.refCode,
                level: 'subcontrol' as const,
                referenceFramework: sourceFramework,
                controlID: controlId,
              }))
              inheritedFromSubcontrols = subcontrolsOfCurrentControl.map((s) => ({ id: s.id, refCode: s.refCode }))
            } else {
              satisfiesTargets = [{ id: controlId, refCode, level: 'control' as const, referenceFramework: sourceFramework }]
            }
          } else if (isSubcontrolMode && subcontrolId) {
            satisfiesTargets = [{ id: subcontrolId, refCode, level: 'subcontrol' as const, referenceFramework: sourceFramework, controlID: parentControlId }]
          }
        }

        upsertRow(dedupeKey, {
          id: dedupeKey,
          mappedControlId: node.id,
          targetId: control.id,
          isSystemOwnedMapping: node.systemOwned ?? false,
          refCode: control.refCode,
          referenceFramework: control.referenceFramework,
          mappingType: node.mappingType,
          relation: node.relation,
          source: mappingSource,
          nodeType: ObjectTypes.CONTROL,
          satisfiesTargets,
          inheritedFromSubcontrols,
        })
      })

      subcontrols.forEach((subcontrol) => {
        if (!subcontrol?.id || !subcontrol?.refCode) return
        if (isSubcontrolMode && (subcontrol.id === subcontrolId || subcontrol.refCode === refCode)) return
        const dedupeKey = `Subcontrol-${subcontrol.refCode}-${subcontrol.referenceFramework ?? 'CUSTOM'}`
        upsertRow(dedupeKey, {
          id: dedupeKey,
          mappedControlId: node.id,
          targetId: subcontrol.id,
          isSystemOwnedMapping: node.systemOwned ?? false,
          refCode: subcontrol.refCode,
          referenceFramework: subcontrol.referenceFramework,
          mappingType: node.mappingType,
          relation: node.relation,
          source: mappingSource,
          nodeType: ObjectTypes.SUBCONTROL,
        })
      })
    })

    return Array.from(rowsByCode.values())
  }, [mappedControlsData, controlId, subcontrolId, refCode, isSubcontrolMode, parentControlId, sourceFramework])

  const { convertToReadOnly } = usePlateEditor()

  const controlRefCodes = useMemo(
    () =>
      Array.from(
        new Set(
          mappedControls
            .filter((row) => row.nodeType === ObjectTypes.CONTROL)
            .map((row) => row.refCode)
            .filter(Boolean),
        ),
      ),
    [mappedControls],
  )
  const subcontrolRefCodes = useMemo(
    () =>
      Array.from(
        new Set(
          mappedControls
            .filter((row) => row.nodeType === ObjectTypes.SUBCONTROL)
            .map((row) => row.refCode)
            .filter(Boolean),
        ),
      ),
    [mappedControls],
  )
  const { data: refcodeData } = useGetControlsByRefCode({ refCodeIn: controlRefCodes, enabled: controlRefCodes.length > 0 })
  const { data: subcontrolRefcodeData } = useGetSubcontrolsByRefCode({ refCodeIn: subcontrolRefCodes, enabled: subcontrolRefCodes.length > 0 })

  const controlLinkMap = useMemo(() => {
    const map = new Map<string, string>()
    refcodeData?.controls?.edges?.forEach((edge) => {
      const node = edge?.node
      if (!node?.refCode) return
      const href = node.systemOwned ? `/standards/${node.standardID}?controlId=${node.id}` : `/controls/${node.id}`
      if (!map.has(node.refCode) || !node.systemOwned) {
        map.set(node.refCode, href)
      }
    })
    return map
  }, [refcodeData])

  const subcontrolLinkMap = useMemo(() => {
    const map = new Map<string, string>()
    subcontrolRefcodeData?.subcontrols?.edges?.forEach((edge) => {
      const node = edge?.node
      if (!node?.refCode) return
      const href = node.systemOwned ? `/standards/${node.control?.standardID}?controlId=${node.id}` : `/controls/${node.controlID}/${node.id}`
      if (!map.has(node.refCode) || !node.systemOwned) {
        map.set(node.refCode, href)
      }
    })
    return map
  }, [subcontrolRefcodeData])

  const controlDetailsMap = useMemo(() => {
    const map = new Map<string, LinkedControlDetails>()

    refcodeData?.controls?.edges?.forEach((edge) => {
      const rawNode: ControlsByRefcodeNode | undefined = edge?.node ?? undefined
      if (!rawNode?.refCode) return

      if (map.has(rawNode.refCode) && rawNode.systemOwned) return

      const linkedPolicies = rawNode.internalPolicies?.edges?.map((e) => e?.node).filter((n): n is { id: string; name: string } => !!n?.id && !!n?.name) ?? []
      const evidenceRefs = rawNode.evidence?.edges?.map((e) => e?.node).filter((n): n is { id: string; name: string } => !!n?.id) ?? []

      map.set(rawNode.refCode, {
        description: rawNode.description,
        status: rawNode.status,
        type: rawNode.controlKindName,
        controlSource: rawNode.source,
        category: rawNode.category,
        subcategory: rawNode.subcategory,
        linkedPolicies,
        evidenceRefs,
      })
    })

    return map
  }, [refcodeData])

  // Keys of framework controls the org has adopted: "referenceFramework|refCode" for non-system-owned controls
  const orgAdoptedFrameworkKeys = useMemo(() => {
    const set = new Set<string>()
    refcodeData?.controls?.edges?.forEach((edge) => {
      const node = edge?.node
      if (node?.refCode && node.referenceFramework && !node.systemOwned) {
        set.add(`${node.referenceFramework}|${node.refCode}`)
      }
    })
    return set
  }, [refcodeData])

  const subcontrolDetailsMap = useMemo(() => {
    const map = new Map<string, LinkedControlDetails>()

    subcontrolRefcodeData?.subcontrols?.edges?.forEach((edge) => {
      const node: SubcontrolsByRefcodeNode | undefined = edge?.node ?? undefined
      if (!node?.id) return
      const href = node.systemOwned ? `/standards/${node.control?.standardID}?controlId=${node.id}` : `/controls/${node.controlID}/${node.id}`
      map.set(node.id, {
        id: node.id,
        href,
        systemOwned: node.systemOwned ?? false,
        description: node.description,
        status: node.status,
        type: node.subcontrolKindName,
        controlSource: node.source,
        category: node.category,
        subcategory: node.subcategory,
      })
    })

    return map
  }, [subcontrolRefcodeData])

  const enrichedMappedControls = useMemo(() => {
    return mappedControls.map((row) => {
      const details = row.nodeType === ObjectTypes.SUBCONTROL ? subcontrolDetailsMap.get(row.targetId) : controlDetailsMap.get(row.refCode)
      return {
        ...row,
        targetHref: details?.href,
        isEditableTarget: !!details && !details.systemOwned,
        description: details?.description ?? row.description,
        status: details?.status ?? row.status,
        type: details?.type ?? row.type,
        controlSource: details?.controlSource ?? row.controlSource,
        category: details?.category ?? row.category,
        subcategory: details?.subcategory ?? row.subcategory,
        linkedPolicies: row.linkedPolicies ?? details?.linkedPolicies,
        evidenceRefs: row.evidenceRefs ?? details?.evidenceRefs,
      }
    })
  }, [mappedControls, controlDetailsMap, subcontrolDetailsMap])

  const customMappedControls = useMemo(() => enrichedMappedControls.filter((row) => !row.referenceFramework || row.referenceFramework === 'CUSTOM'), [enrichedMappedControls])
  const implementedOrgControlsCount = useMemo(() => customMappedControls.filter((row) => row.status === 'APPROVED').length, [customMappedControls])
  const frameworkMappedControls = useMemo(
    () =>
      enrichedMappedControls.filter((row) => {
        if (!row.referenceFramework || row.referenceFramework === 'CUSTOM') return false
        return orgAdoptedFrameworkKeys.has(`${row.referenceFramework}|${row.refCode}`)
      }),
    [enrichedMappedControls, orgAdoptedFrameworkKeys],
  )

  const pathname = usePathname()
  const actionsColumn = useMemo(() => getMappedControlsActionsColumn(pathname), [pathname])

  const orgControlsColumns = useMemo(
    () => [...getOrgControlsColumns(controlLinkMap, subcontrolLinkMap, convertToReadOnly), actionsColumn],
    [controlLinkMap, subcontrolLinkMap, convertToReadOnly, actionsColumn],
  )
  const baseMappedColumns = useMemo(
    () => [...getMappedControlsBaseColumns(controlLinkMap, subcontrolLinkMap, convertToReadOnly), actionsColumn],
    [controlLinkMap, subcontrolLinkMap, convertToReadOnly, actionsColumn],
  )
  const frameworkMappedColumns = useMemo(() => [...getMappedControlsFrameworkColumns(baseMappedColumns.slice(0, -1)), actionsColumn], [baseMappedColumns, actionsColumn])
  const hasSubcontrols = (subcontrolsPaginationMeta?.totalCount ?? 0) > 0
  const hasMappedControls = customMappedControls.length > 0 || frameworkMappedControls.length > 0
  const isLoading = isMappedControlsLoading || (!isSubcontrolMode && isSubcontrolsLoading)

  if (isLoading) {
    return <TableSkeleton />
  }

  if (!hasMappedControls && !parentControlId && (isSubcontrolMode || !hasSubcontrols)) {
    return <EmptyTabState description="Link this control to related controls to show relationships or shared coverage. Linked controls will appear here." />
  }

  return (
    <div className="flex flex-col gap-4">
      {isSubcontrolMode && parentControlId ? <ParentControlCard controlId={parentControlId} /> : !isSubcontrolMode && hasSubcontrols && <SubcontrolsTable />}
      <MappedControlsTable
        title="Organization controls"
        rows={customMappedControls}
        columns={orgControlsColumns}
        searchPlaceholder="Search organization controls"
        showFrameworkFilter={false}
        countLabel={`(${customMappedControls.length} mapped)`}
        implementedCount={implementedOrgControlsCount}
        action={
          controlId && !isSubcontrolMode ? (
            <QuickMapControlDialog controlId={controlId} refCode={refCode} />
          ) : isSubcontrolMode && subcontrolId ? (
            <QuickMapControlDialog subcontrolId={subcontrolId} refCode={refCode} />
          ) : undefined
        }
      />
      {frameworkMappedControls.length > 0 && (
        <MappedControlsTable title="Framework Mappings" rows={frameworkMappedControls} columns={frameworkMappedColumns} searchPlaceholder="Search framework mappings" showFrameworkFilter />
      )}
    </div>
  )
}

export default LinkedControlsTab

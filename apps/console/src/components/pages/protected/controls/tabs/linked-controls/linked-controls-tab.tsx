import React, { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import SubcontrolsTable from './subcontrols-table'
import { useGetControlsByRefCode, useGetControlRelatedControls, type ControlsByRefcodeNode } from '@/lib/graphql-hooks/control'
import { useGetSubcontrolsByRefCode, useGetSubcontrolRelatedControls, type SubcontrolsByRefcodeNode } from '@/lib/graphql-hooks/subcontrol'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import MappedControlsTable from './mapped-controls-table'
import type { MappedControlRow } from './mapped-controls-types'
import { getMappedControlsActionsColumn, getMappedControlsBaseColumns, getMappedControlsFrameworkColumns, getOrgControlsColumns } from './mapped-controls-config'
import type { LinkedControlDetails } from './types'
import { useGetSubcontrolsPaginated } from '@/lib/graphql-hooks/subcontrol'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { TableSkeleton } from '@/components/shared/skeleton/table-skeleton'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { QuickMapControlDialog } from './quick-map-control-dialog'
import ParentControlCard from './parent-control-card'
import { ControlControlStatus } from '@repo/codegen/src/schema'

export type LinkedControlsTabProps = {
  controlId?: string
  subcontrolId?: string
  parentControlId?: string
  refCode: string
  canEdit?: boolean
}

const LinkedControlsTab: React.FC<LinkedControlsTabProps> = ({ controlId, subcontrolId, parentControlId, refCode, canEdit = false }) => {
  const isSubcontrolMode = !!subcontrolId
  const pathname = usePathname()

  const { data: controlRelatedData, isLoading: isControlRelatedLoading } = useGetControlRelatedControls(controlId, !isSubcontrolMode)
  const { data: subcontrolRelatedData, isLoading: isSubcontrolRelatedLoading } = useGetSubcontrolRelatedControls(subcontrolId, isSubcontrolMode)

  const {
    subcontrols: childSubcontrols,
    paginationMeta: subcontrolsPaginationMeta,
    isLoading: isSubcontrolsLoading,
  } = useGetSubcontrolsPaginated({
    where: controlId ? { controlID: controlId } : undefined,
    pagination: DEFAULT_PAGINATION,
    enabled: Boolean(controlId) && !isSubcontrolMode,
  })

  const relatedControlInfos = useMemo(
    () => (isSubcontrolMode ? (subcontrolRelatedData?.subcontrol?.relatedControls ?? []) : (controlRelatedData?.control?.relatedControls ?? [])),
    [isSubcontrolMode, controlRelatedData, subcontrolRelatedData],
  )

  const inheritedSubcontrolIdsByTargetId = useMemo(() => {
    const map = new Map<string, string[]>()
    controlRelatedData?.control?.relatedControls?.forEach((item) => {
      if (item?.id && item.inheritedFromSubcontrolIDs && item.inheritedFromSubcontrolIDs.length > 0) {
        map.set(item.id, item.inheritedFromSubcontrolIDs)
      }
    })
    return map
  }, [controlRelatedData])

  const childSubcontrolById = useMemo(() => {
    const map = new Map<string, { refCode: string; href: string }>()
    childSubcontrols.forEach((sub) => {
      if (sub?.id && sub?.refCode) map.set(sub.id, { refCode: sub.refCode, href: `/controls/${controlId}/${sub.id}` })
    })
    return map
  }, [childSubcontrols, controlId])

  const mappedControls = useMemo<MappedControlRow[]>(() => {
    const rowsByKey = new Map<string, MappedControlRow>()
    relatedControlInfos.forEach((item) => {
      if (!item?.id || !item?.refCode) return
      if (!isSubcontrolMode && item.id === controlId) return
      if (isSubcontrolMode && item.id === subcontrolId) return
      const nodeType = item.isSubcontrol ? ObjectTypes.SUBCONTROL : ObjectTypes.CONTROL
      const key = `${nodeType}-${item.refCode}-${item.referenceFramework ?? 'CUSTOM'}`
      if (rowsByKey.has(key)) return
      rowsByKey.set(key, {
        id: key,
        targetId: item.id,
        refCode: item.refCode,
        referenceFramework: item.referenceFramework,
        nodeType,
        status: item.status,
        description: item.description,
        category: item.category,
        subcategory: item.subcategory,
        mappedControlReferenceIDs: item.mappedControlReferenceIDs ?? [],
      })
    })
    return Array.from(rowsByKey.values())
  }, [relatedControlInfos, isSubcontrolMode, controlId, subcontrolId])

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

  const orgAdoptedFrameworkKeys = useMemo(() => {
    const set = new Set<string>()
    refcodeData?.controls?.edges?.forEach((edge) => {
      const node = edge?.node
      if (node?.refCode && node.referenceFramework && !node.systemOwned && !node.isTrustCenterControl) {
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
      map.set(node.id, {
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
      const inheritedIds = inheritedSubcontrolIdsByTargetId.get(row.targetId) ?? []
      const inheritedFromSubcontrols = inheritedIds.map((id) => childSubcontrolById.get(id) ?? { refCode: id, href: `/controls/${controlId}/${id}` })
      return {
        ...row,
        description: row.description ?? details?.description,
        status: row.status ?? details?.status,
        type: details?.type ?? row.type,
        controlSource: details?.controlSource ?? row.controlSource,
        category: row.category ?? details?.category,
        subcategory: row.subcategory ?? details?.subcategory,
        linkedPolicies: details?.linkedPolicies,
        evidenceRefs: details?.evidenceRefs,
        inheritedFromSubcontrols: inheritedFromSubcontrols.length > 0 ? inheritedFromSubcontrols : undefined,
      }
    })
  }, [mappedControls, controlDetailsMap, subcontrolDetailsMap, inheritedSubcontrolIdsByTargetId, childSubcontrolById, controlId])

  const customMappedControls = useMemo(() => enrichedMappedControls.filter((row) => !row.referenceFramework || row.referenceFramework === 'CUSTOM'), [enrichedMappedControls])
  const activeOrgControlsCount = useMemo(() => customMappedControls.filter((row) => row.status !== ControlControlStatus.ARCHIVED).length, [customMappedControls])
  const implementedOrgControlsCount = useMemo(() => customMappedControls.filter((row) => row.status === ControlControlStatus.APPROVED).length, [customMappedControls])
  const frameworkMappedControls = useMemo(
    () =>
      enrichedMappedControls.filter((row) => {
        if (!row.referenceFramework || row.referenceFramework === 'CUSTOM') return false
        return orgAdoptedFrameworkKeys.has(`${row.referenceFramework}|${row.refCode}`)
      }),
    [enrichedMappedControls, orgAdoptedFrameworkKeys],
  )

  const directlyMappedOrgControlIds = useMemo(() => new Set(customMappedControls.filter((row) => !row.inheritedFromSubcontrols?.length).map((row) => row.targetId)), [customMappedControls])
  const directlyMappedFrameworkControlIds = useMemo(() => new Set(frameworkMappedControls.filter((row) => !row.inheritedFromSubcontrols?.length).map((row) => row.targetId)), [frameworkMappedControls])

  const actionsColumn = useMemo(() => getMappedControlsActionsColumn(pathname, canEdit), [pathname, canEdit])
  const orgControlsColumns = useMemo(
    () => [...getOrgControlsColumns(controlLinkMap, subcontrolLinkMap, convertToReadOnly), actionsColumn],
    [controlLinkMap, subcontrolLinkMap, convertToReadOnly, actionsColumn],
  )
  const baseMappedColumns = useMemo(() => getMappedControlsBaseColumns(controlLinkMap, subcontrolLinkMap, convertToReadOnly), [controlLinkMap, subcontrolLinkMap, convertToReadOnly])
  const frameworkMappedColumns = useMemo(() => [...getMappedControlsFrameworkColumns(baseMappedColumns), actionsColumn], [baseMappedColumns, actionsColumn])
  const hasSubcontrols = (subcontrolsPaginationMeta?.totalCount ?? 0) > 0
  const isLoading = (isSubcontrolMode ? isSubcontrolRelatedLoading : isControlRelatedLoading) || (!isSubcontrolMode && isSubcontrolsLoading)

  if (isLoading) {
    return <TableSkeleton />
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
        countLabel={`(${activeOrgControlsCount} mapped)`}
        implementedCount={implementedOrgControlsCount}
        action={
          controlId && !isSubcontrolMode ? (
            <QuickMapControlDialog controlId={controlId} refCode={refCode} alreadyMappedControlIds={directlyMappedOrgControlIds} />
          ) : isSubcontrolMode && subcontrolId ? (
            <QuickMapControlDialog subcontrolId={subcontrolId} refCode={refCode} alreadyMappedControlIds={directlyMappedOrgControlIds} />
          ) : undefined
        }
      />
      <MappedControlsTable
        title="Framework Mappings"
        rows={frameworkMappedControls}
        columns={frameworkMappedColumns}
        searchPlaceholder="Search framework mappings"
        showFrameworkFilter
        action={
          controlId && !isSubcontrolMode ? (
            <QuickMapControlDialog variant="framework" controlId={controlId} refCode={refCode} alreadyMappedControlIds={directlyMappedFrameworkControlIds} />
          ) : isSubcontrolMode && subcontrolId ? (
            <QuickMapControlDialog variant="framework" subcontrolId={subcontrolId} refCode={refCode} alreadyMappedControlIds={directlyMappedFrameworkControlIds} />
          ) : undefined
        }
      />
    </div>
  )
}

export default LinkedControlsTab

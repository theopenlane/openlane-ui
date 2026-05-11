import React, { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import SubcontrolsTable from './subcontrols-table'
import { useGetMappedControls } from '@/lib/graphql-hooks/mapped-control'
import { useGetControlsByRefCode, type ControlsByRefcodeNode } from '@/lib/graphql-hooks/control'
import { useGetSubcontrolsByRefCode, type SubcontrolsByRefcodeNode } from '@/lib/graphql-hooks/subcontrol'
import { MappedControlMappingSource } from '@repo/codegen/src/schema'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import MappedControlsTable from './mapped-controls-table'
import type { MappedControlRow } from './mapped-controls-types'
import { getMappedControlsActionsColumn, getMappedControlsBaseColumns, getMappedControlsFrameworkColumns } from './mapped-controls-config'
import type { LinkedControlDetails } from './types'
import { useGetSubcontrolsPaginated } from '@/lib/graphql-hooks/subcontrol'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { TableSkeleton } from '@/components/shared/skeleton/table-skeleton'
import EmptyTabState from '@/components/shared/crud-base/tabs/empty-tab-state'
import { ObjectTypes } from '@repo/codegen/src/type-names'

export type LinkedControlsTabProps = {
  controlId?: string
  subcontrolId?: string
  refCode: string
  sourceFramework?: string | null
}

const LinkedControlsTab: React.FC<LinkedControlsTabProps> = ({ controlId, subcontrolId, refCode, sourceFramework }) => {
  const isSubcontrolMode = !!subcontrolId
  const mappedControlWhere = useMemo(() => {
    const withFilter = { refCode, referenceFramework: sourceFramework }
    const suggestedWhere = {
      and: [{ source: MappedControlMappingSource.SUGGESTED }, isSubcontrolMode ? { hasFromSubcontrolsWith: [withFilter] } : { hasFromControlsWith: [withFilter] }],
    }

    if (isSubcontrolMode && subcontrolId) {
      return {
        or: [suggestedWhere, { hasFromSubcontrolsWith: [{ id: subcontrolId }] }],
      }
    }

    if (controlId) {
      return {
        or: [suggestedWhere, { hasFromControlsWith: [{ id: controlId }] }],
      }
    }

    return undefined
  }, [controlId, subcontrolId, isSubcontrolMode, refCode, sourceFramework])

  const { data: mappedControlsData, isLoading: isMappedControlsLoading } = useGetMappedControls({ where: mappedControlWhere, enabled: Boolean(controlId || subcontrolId) })

  const { paginationMeta: subcontrolsPaginationMeta, isLoading: isSubcontrolsLoading } = useGetSubcontrolsPaginated({
    where: controlId ? { controlID: controlId } : undefined,
    pagination: DEFAULT_PAGINATION,
    enabled: Boolean(controlId) && !isSubcontrolMode,
  })

  const mappedControls = useMemo<MappedControlRow[]>(() => {
    const rows: MappedControlRow[] = []
    const seen = new Set<string>()

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

      controls.forEach((control) => {
        if (!control?.refCode) return
        if (!isSubcontrolMode && (control?.id === controlId || control?.refCode === refCode)) return
        const key = `Control-${control.refCode}-${control.referenceFramework ?? 'CUSTOM'}-${node.mappingType}-${mappingSource}-${node.relation ?? ''}`
        if (seen.has(key)) return
        seen.add(key)
        rows.push({
          id: key,
          mappedControlId: node.id,
          isSystemOwnedMapping: node.systemOwned ?? false,
          refCode: control.refCode,
          referenceFramework: control.referenceFramework,
          mappingType: node.mappingType,
          relation: node.relation,
          source: mappingSource,
          nodeType: ObjectTypes.CONTROL,
        })
      })

      subcontrols.forEach((subcontrol) => {
        if (!subcontrol?.refCode) return
        if (isSubcontrolMode && (subcontrol?.id === subcontrolId || subcontrol?.refCode === refCode)) return
        const key = `Subcontrol-${subcontrol.refCode}-${subcontrol.referenceFramework ?? 'CUSTOM'}-${node.mappingType}-${mappingSource}-${node.relation ?? ''}`
        if (seen.has(key)) return
        seen.add(key)
        rows.push({
          id: key,
          mappedControlId: node.id,
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

    return rows
  }, [mappedControlsData, controlId, subcontrolId, refCode, isSubcontrolMode])

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

  const buildLookupKey = (refCode: string, referenceFramework?: string | null) => `${refCode}|${referenceFramework || 'CUSTOM'}`

  const controlLinkMap = useMemo(() => {
    const map = new Map<string, string>()
    refcodeData?.controls?.edges?.forEach((edge) => {
      const node = edge?.node
      if (!node?.refCode) return
      const href = node.systemOwned ? `/standards/${node.standardID}?controlId=${node.id}` : `/controls/${node.id}`
      map.set(buildLookupKey(node.refCode, node.referenceFramework), href)
    })
    return map
  }, [refcodeData])

  const subcontrolLinkMap = useMemo(() => {
    const map = new Map<string, string>()
    subcontrolRefcodeData?.subcontrols?.edges?.forEach((edge) => {
      const node = edge?.node
      if (!node?.refCode) return
      const href = node.systemOwned ? `/standards/${node.control?.standardID}?controlId=${node.id}` : `/controls/${node.controlID}/${node.id}`
      map.set(buildLookupKey(node.refCode, node.referenceFramework), href)
    })
    return map
  }, [subcontrolRefcodeData])

  const controlDetailsMap = useMemo(() => {
    const map = new Map<string, LinkedControlDetails>()

    refcodeData?.controls?.edges?.forEach((edge) => {
      const node: ControlsByRefcodeNode | undefined = edge?.node ?? undefined

      if (!node?.refCode) return
      map.set(buildLookupKey(node.refCode, node.referenceFramework), {
        description: node.description,
        status: node.status,
        type: node.controlKindName,
        controlSource: node.source,
        category: node.category,
        subcategory: node.subcategory,
      })
    })

    return map
  }, [refcodeData])

  const subcontrolDetailsMap = useMemo(() => {
    const map = new Map<string, LinkedControlDetails>()

    subcontrolRefcodeData?.subcontrols?.edges?.forEach((edge) => {
      const node: SubcontrolsByRefcodeNode | undefined = edge?.node ?? undefined

      if (!node?.refCode) return
      map.set(buildLookupKey(node.refCode, node.referenceFramework), {
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
      const lookupKey = buildLookupKey(row.refCode, row.referenceFramework)
      const details = row.nodeType === 'Subcontrol' ? subcontrolDetailsMap.get(lookupKey) : controlDetailsMap.get(lookupKey)
      return {
        ...row,
        description: details?.description ?? row.description,
        status: details?.status ?? row.status,
        type: details?.type ?? row.type,
        controlSource: details?.controlSource ?? row.controlSource,
        category: details?.category ?? row.category,
        subcategory: details?.subcategory ?? row.subcategory,
      }
    })
  }, [mappedControls, controlDetailsMap, subcontrolDetailsMap])

  const customMappedControls = useMemo(() => enrichedMappedControls.filter((row) => !row.referenceFramework || row.referenceFramework === 'CUSTOM'), [enrichedMappedControls])
  const frameworkMappedControls = useMemo(() => enrichedMappedControls.filter((row) => row.referenceFramework && row.referenceFramework !== 'CUSTOM'), [enrichedMappedControls])

  const pathname = usePathname()
  const actionsColumn = useMemo(() => getMappedControlsActionsColumn(pathname), [pathname])
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

  if (!hasMappedControls && (isSubcontrolMode || !hasSubcontrols)) {
    return <EmptyTabState description="Link this control to related controls to show relationships or shared coverage. Linked controls will appear here." />
  }

  return (
    <div className="space-y-6">
      {!isSubcontrolMode && <SubcontrolsTable />}
      <MappedControlsTable title="Organization Controls" rows={customMappedControls} columns={baseMappedColumns} searchPlaceholder="Search organization controls" showFrameworkFilter={false} />
      <MappedControlsTable title="Framework Mappings" rows={frameworkMappedControls} columns={frameworkMappedColumns} searchPlaceholder="Search framework mappings" showFrameworkFilter />
    </div>
  )
}

export default LinkedControlsTab

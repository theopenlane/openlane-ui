import React, { useMemo } from 'react'
import SubcontrolsTable from './subcontrols-table'
import { useGetMappedControls } from '@/lib/graphql-hooks/mapped-control'
import { useGetControlsByRefCode, type ControlsByRefcodeNode } from '@/lib/graphql-hooks/controls'
import { useGetSubcontrolsByRefCode, type SubcontrolsByRefcodeNode } from '@/lib/graphql-hooks/subcontrol'
import { MappedControlMappingSource } from '@repo/codegen/src/schema'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import MappedControlsTable from './mapped-controls-table'
import type { MappedControlRow } from './mapped-controls-types'
import { getMappedControlsBaseColumns, getMappedControlsFrameworkColumns } from './mapped-controls-config'
import type { LinkedControlDetails } from './types'

export type LinkedControlsTabProps = {
  controlId?: string
  subcontrolId?: string
  refCode: string
}

const LinkedControlsTab: React.FC<LinkedControlsTabProps> = ({ controlId, subcontrolId, refCode }) => {
  const isSubcontrolMode = !!subcontrolId
  const mappedControlWhere = useMemo(() => {
    if (isSubcontrolMode && subcontrolId) {
      return {
        or: [{ hasFromSubcontrolsWith: [{ id: subcontrolId }] }, { hasToSubcontrolsWith: [{ id: subcontrolId }] }],
      }
    }

    if (controlId) {
      return {
        or: [{ hasFromControlsWith: [{ id: controlId }] }, { hasToControlsWith: [{ id: controlId }] }],
      }
    }

    return undefined
  }, [controlId, subcontrolId, isSubcontrolMode])

  const { data: mappedControlsData } = useGetMappedControls({ where: mappedControlWhere, enabled: Boolean(controlId || subcontrolId) })

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
          refCode: control.refCode,
          referenceFramework: control.referenceFramework,
          mappingType: node.mappingType,
          relation: node.relation,
          source: mappingSource,
          nodeType: 'Control',
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
          refCode: subcontrol.refCode,
          referenceFramework: subcontrol.referenceFramework,
          mappingType: node.mappingType,
          relation: node.relation,
          source: mappingSource,
          nodeType: 'Subcontrol',
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
            .filter((row) => row.nodeType === 'Control')
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
            .filter((row) => row.nodeType === 'Subcontrol')
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
      const node: ControlsByRefcodeNode | undefined = edge?.node ?? undefined

      if (!node?.refCode) return
      map.set(node.refCode, {
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
      map.set(node.refCode, {
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
      const details = row.nodeType === 'Subcontrol' ? subcontrolDetailsMap.get(row.refCode) : controlDetailsMap.get(row.refCode)
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

  const baseMappedColumns = useMemo(() => getMappedControlsBaseColumns(controlLinkMap, subcontrolLinkMap, convertToReadOnly), [controlLinkMap, subcontrolLinkMap, convertToReadOnly])
  const frameworkMappedColumns = useMemo(() => getMappedControlsFrameworkColumns(baseMappedColumns), [baseMappedColumns])

  return (
    <div className="space-y-6 mt-6">
      {!isSubcontrolMode && <SubcontrolsTable />}
      <MappedControlsTable title="Organization Controls" rows={customMappedControls} columns={baseMappedColumns} searchPlaceholder="Search organization controls" showFrameworkFilter={false} />
      <MappedControlsTable title="Framework Mappings" rows={frameworkMappedControls} columns={frameworkMappedColumns} searchPlaceholder="Search framework mappings" showFrameworkFilter />
    </div>
  )
}

export default LinkedControlsTab

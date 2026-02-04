import React, { useEffect, useMemo, useState } from 'react'
import SubcontrolsTable from '@/components/pages/protected/controls/tabs/tables/subcontrols-table'
import { DataTable } from '@repo/ui/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import type { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useGetMappedControls } from '@/lib/graphql-hooks/mapped-control'
import { useGetControlsByRefCode } from '@/lib/graphql-hooks/controls'
import { useGetSubcontrolsByRefCode } from '@/lib/graphql-hooks/subcontrol'
import { MappedControlMappingSource, MappedControlMappingType } from '@repo/codegen/src/schema'
import StandardChip from '@/components/pages/protected/standards/shared/standard-chip'
import { SearchFilterBar } from '@/components/pages/protected/controls/tabs/documentation-components/shared'
import type { FilterField, WhereCondition } from '@/types'
import { extractFilterValues } from '@/components/pages/protected/controls/table-filter/extract-filter-values'
import { FileBadge2, Layers, Link2 } from 'lucide-react'
import { useDebounce } from '@uidotdev/usehooks'
import Link from 'next/link'
import { formatEnumLabel } from '@/utils/enumToLabel'

interface SubcontrolEdge {
  node?: {
    refCode: string
    description?: string | null
    id: string
  } | null
}

interface LinkedControlsTabProps {
  subcontrols?: (SubcontrolEdge | null)[]
  controlId?: string
  subcontrolId?: string
  refCode: string
  referenceFramework?: string | null
}

type MappedControlRow = {
  id: string
  refCode: string
  referenceFramework?: string | null
  mappingType: MappedControlMappingType
  relation?: string | null
  source: MappedControlMappingSource
  nodeType: 'Control' | 'Subcontrol'
}

type MappingTypeFilter = 'all' | MappedControlMappingType
type MappingSourceFilter = 'all' | MappedControlMappingSource

const LinkedControlsTab: React.FC<LinkedControlsTabProps> = ({ subcontrols, controlId, subcontrolId, refCode, referenceFramework }) => {
  const isSubcontrolMode = !!subcontrolId
  const mappedControlWhere = useMemo(() => {
    const withFilter = { refCode, referenceFramework }
    const suggestedControlWhere = isSubcontrolMode
      ? {
          and: [
            { source: MappedControlMappingSource.SUGGESTED },
            {
              or: [{ hasFromSubcontrolsWith: [withFilter] }, { hasToSubcontrolsWith: [withFilter] }],
            },
          ],
        }
      : {
          and: [
            { source: MappedControlMappingSource.SUGGESTED },
            {
              or: [{ hasFromControlsWith: [withFilter] }, { hasToControlsWith: [withFilter] }],
            },
          ],
        }

    if (isSubcontrolMode && subcontrolId) {
      return {
        or: [
          suggestedControlWhere,
          {
            or: [{ hasFromSubcontrolsWith: [{ id: subcontrolId }] }, { hasToSubcontrolsWith: [{ id: subcontrolId }] }],
          },
        ],
      }
    }

    if (controlId) {
      return {
        or: [
          suggestedControlWhere,
          {
            or: [{ hasFromControlsWith: [{ id: controlId }] }, { hasToControlsWith: [{ id: controlId }] }],
          },
        ],
      }
    }

    return suggestedControlWhere
  }, [controlId, subcontrolId, refCode, referenceFramework, isSubcontrolMode])

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

      const isFrom = isSubcontrolMode
        ? fromSubcontrols.some((sub) => sub?.id === subcontrolId || sub?.refCode === refCode)
        : fromControls.some((control) => control?.id === controlId || control?.refCode === refCode)
      const isTo = isSubcontrolMode
        ? toSubcontrols.some((sub) => sub?.id === subcontrolId || sub?.refCode === refCode)
        : toControls.some((control) => control?.id === controlId || control?.refCode === refCode)

      if (!isFrom && !isTo) return

      if (!isSubcontrolMode) {
        const oppositeControls = isFrom ? toControls : isTo ? fromControls : []
        oppositeControls.forEach((control) => {
          if (!control?.refCode) return
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
        return
      }

      const oppositeControls = isFrom ? toControls : isTo ? fromControls : []
      const oppositeSubcontrols = isFrom ? toSubcontrols : isTo ? fromSubcontrols : []

      oppositeControls.forEach((control) => {
        if (!control?.refCode) return
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

      oppositeSubcontrols.forEach((subcontrol) => {
        if (!subcontrol?.refCode) return
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

  const customMappedControls = useMemo(() => mappedControls.filter((row) => !row.referenceFramework || row.referenceFramework === 'CUSTOM'), [mappedControls])
  const frameworkMappedControls = useMemo(() => mappedControls.filter((row) => row.referenceFramework && row.referenceFramework !== 'CUSTOM'), [mappedControls])

  const mappedColumns = useMemo<ColumnDef<MappedControlRow>[]>(
    () => [
      {
        accessorKey: 'refCode',
        header: () => <span className="whitespace-nowrap">Ref Code</span>,
        cell: ({ row }) => {
          const href = row.original.nodeType === 'Subcontrol' ? subcontrolLinkMap.get(row.original.refCode) : controlLinkMap.get(row.original.refCode)
          if (!href) return row.original.refCode
          return (
            <Link href={href} className="text-blue-500 hover:underline">
              {row.original.refCode}
            </Link>
          )
        },
      },
      {
        accessorKey: 'referenceFramework',
        header: () => <span className="whitespace-nowrap">Framework</span>,
        cell: ({ row }) => (row.original.referenceFramework ? <StandardChip referenceFramework={row.original.referenceFramework} /> : <span className="text-muted-foreground">Custom</span>),
      },
      {
        accessorKey: 'mappingType',
        header: () => <span className="whitespace-nowrap">Mapping Type</span>,
        cell: ({ row }) => formatEnumLabel(row.original.mappingType),
      },
      {
        accessorKey: 'relation',
        header: () => <span className="whitespace-nowrap">Relation</span>,
        cell: ({ row }) => row.original.relation || '-',
      },
      {
        accessorKey: 'source',
        header: () => <span className="whitespace-nowrap">Source</span>,
        cell: ({ row }) => formatEnumLabel(row.original.source),
      },
    ],
    [controlLinkMap, subcontrolLinkMap],
  )

  return (
    <div className="space-y-6 mt-6">
      {!isSubcontrolMode && subcontrols && <SubcontrolsTable subcontrols={subcontrols} />}
      <MappedControlsTable title="Mapped Controls (Non-framework)" rows={customMappedControls} columns={mappedColumns} searchPlaceholder="Search mapped controls" showFrameworkFilter={false} />
      <MappedControlsTable title="Mapped Controls (Framework)" rows={frameworkMappedControls} columns={mappedColumns} searchPlaceholder="Search framework mapped controls" showFrameworkFilter />
    </div>
  )
}

export default LinkedControlsTab

type MappedControlsTableProps = {
  title: string
  rows: MappedControlRow[]
  columns: ColumnDef<MappedControlRow>[]
  searchPlaceholder: string
  showFrameworkFilter?: boolean
  action?: React.ReactNode
}

const MappedControlsTable: React.FC<MappedControlsTableProps> = ({ title, rows, columns, searchPlaceholder, showFrameworkFilter = false, action }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [filters, setFilters] = useState<WhereCondition>({})
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)

  const normalizedSearch = debouncedSearch.trim().toLowerCase()

  const frameworkOptions = useMemo(() => {
    const options = new Set<string>()
    rows.forEach((row) => {
      if (row.referenceFramework) options.add(row.referenceFramework)
    })
    return Array.from(options).sort()
  }, [rows])

  const filterFields = useMemo<FilterField[]>(() => {
    const fields: FilterField[] = [
      {
        key: 'mappingTypeIn',
        label: 'Mapping Type',
        type: 'multiselect',
        icon: Link2,
        options: Object.values(MappedControlMappingType).map((value) => ({ value, label: formatEnumLabel(value) })),
      },
      {
        key: 'sourceIn',
        label: 'Source',
        type: 'multiselect',
        icon: Layers,
        options: Object.values(MappedControlMappingSource).map((value) => ({ value, label: formatEnumLabel(value) })),
      },
    ]

    if (showFrameworkFilter) {
      fields.push({
        key: 'referenceFrameworkIn',
        label: 'Framework',
        type: 'multiselect',
        icon: FileBadge2,
        options: frameworkOptions.map((framework) => ({ value: framework, label: framework })),
      })
    }

    return fields
  }, [frameworkOptions, showFrameworkFilter])

  const filterValues = useMemo(() => extractFilterValues(filters), [filters])
  const mappingTypeFilter = useMemo(() => (filterValues.mappingTypeIn ?? []) as MappingTypeFilter[] | MappingTypeFilter, [filterValues.mappingTypeIn])
  const sourceFilter = useMemo(() => (filterValues.sourceIn ?? []) as MappingSourceFilter[] | MappingSourceFilter, [filterValues.sourceIn])
  const frameworkFilter = useMemo(() => (filterValues.referenceFrameworkIn ?? []) as string[] | string, [filterValues.referenceFrameworkIn])

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (Array.isArray(mappingTypeFilter) && mappingTypeFilter.length > 0 && !mappingTypeFilter.includes(row.mappingType)) return false
      if (!Array.isArray(mappingTypeFilter) && mappingTypeFilter !== 'all' && row.mappingType !== mappingTypeFilter) return false

      if (Array.isArray(sourceFilter) && sourceFilter.length > 0 && !sourceFilter.includes(row.source)) return false
      if (!Array.isArray(sourceFilter) && sourceFilter !== 'all' && row.source !== sourceFilter) return false

      if (showFrameworkFilter) {
        if (Array.isArray(frameworkFilter) && frameworkFilter.length > 0 && !frameworkFilter.includes(row.referenceFramework ?? '')) return false
        if (!Array.isArray(frameworkFilter) && frameworkFilter !== 'all' && row.referenceFramework !== frameworkFilter) return false
      }

      if (!normalizedSearch) return true

      return (
        row.refCode.toLowerCase().includes(normalizedSearch) || (row.relation ?? '').toLowerCase().includes(normalizedSearch) || (row.referenceFramework ?? '').toLowerCase().includes(normalizedSearch)
      )
    })
  }, [rows, mappingTypeFilter, sourceFilter, frameworkFilter, showFrameworkFilter, normalizedSearch])

  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      page: 1,
      query: { first: prev.pageSize },
    }))
  }, [searchQuery, filters])

  const pagedRows = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize
    return filteredRows.slice(start, start + pagination.pageSize)
  }, [filteredRows, pagination.page, pagination.pageSize])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        {action}
      </div>

      <SearchFilterBar
        placeholder={searchPlaceholder}
        isSearching={searchQuery !== debouncedSearch}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filterFields={filterFields}
        onFilterChange={setFilters}
      />

      <DataTable
        columns={columns}
        data={pagedRows}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={{ totalCount: filteredRows.length }}
        noResultsText="No mapped controls found."
        tableKey={undefined}
      />
    </div>
  )
}

import React, { useEffect, useMemo, useState } from 'react'
import SubcontrolsTable from '@/components/pages/protected/controls/subcontrols-table.tsx'
import { DataTable } from '@repo/ui/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import type { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useGetMappedControls } from '@/lib/graphql-hooks/mapped-control'
import { useGetControlsByRefCode } from '@/lib/graphql-hooks/controls'
import { MappedControlMappingSource, MappedControlMappingType } from '@repo/codegen/src/schema'
import StandardChip from '@/components/pages/protected/standards/shared/standard-chip'
import { SearchFilterBar } from '@/app/(protected)/controls/[id]/components/documentation-components/shared'
import type { FilterField, WhereCondition } from '@/types'
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
  subcontrols: (SubcontrolEdge | null)[]
  controlId: string
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
}

type MappingTypeFilter = 'all' | MappedControlMappingType
type MappingSourceFilter = 'all' | MappedControlMappingSource

const extractFilterValues = (condition?: WhereCondition): Record<string, unknown> => {
  if (!condition) return {}
  if ('and' in condition && Array.isArray(condition.and)) {
    return condition.and.reduce<Record<string, unknown>>((acc, entry) => {
      Object.entries(entry as Record<string, unknown>).forEach(([key, value]) => {
        if (key !== 'and' && key !== 'or') acc[key] = value
      })
      return acc
    }, {})
  }
  return Object.entries(condition as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (key !== 'and' && key !== 'or') acc[key] = value
    return acc
  }, {})
}

const LinkedControlsTab: React.FC<LinkedControlsTabProps> = ({ subcontrols, controlId, refCode, referenceFramework }) => {
  const mappedControlWhere = useMemo(() => {
    const withFilter = { refCode, referenceFramework }
    const suggestedControlWhere = {
      and: [
        { source: MappedControlMappingSource.SUGGESTED },
        {
          or: [{ hasFromControlsWith: [withFilter] }, { hasToControlsWith: [withFilter] }],
        },
      ],
    }

    return {
      or: [
        suggestedControlWhere,
        {
          or: [{ hasFromControlsWith: [{ id: controlId }] }, { hasToControlsWith: [{ id: controlId }] }],
        },
      ],
    }
  }, [controlId, refCode, referenceFramework])

  const { data: mappedControlsData } = useGetMappedControls({ where: mappedControlWhere, enabled: !!controlId })

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

      const isFrom = fromControls.some((control) => control?.id === controlId || control?.refCode === refCode)
      const isTo = toControls.some((control) => control?.id === controlId || control?.refCode === refCode)

      const oppositeControls = isFrom ? toControls : isTo ? fromControls : []

      oppositeControls.forEach((control) => {
        if (!control?.refCode) return
        const key = `${control.refCode}-${control.referenceFramework ?? 'CUSTOM'}-${node.mappingType}-${mappingSource}-${node.relation ?? ''}`
        if (seen.has(key)) return
        seen.add(key)
        rows.push({
          id: key,
          refCode: control.refCode,
          referenceFramework: control.referenceFramework,
          mappingType: node.mappingType,
          relation: node.relation,
          source: mappingSource,
        })
      })
    })

    return rows
  }, [mappedControlsData, controlId, refCode])

  const controlRefCodes = useMemo(() => Array.from(new Set(mappedControls.map((row) => row.refCode).filter(Boolean))), [mappedControls])
  const { data: refcodeData } = useGetControlsByRefCode({ refCodeIn: controlRefCodes, enabled: controlRefCodes.length > 0 })

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

  const customMappedControls = useMemo(() => mappedControls.filter((row) => !row.referenceFramework || row.referenceFramework === 'CUSTOM'), [mappedControls])
  const frameworkMappedControls = useMemo(() => mappedControls.filter((row) => row.referenceFramework && row.referenceFramework !== 'CUSTOM'), [mappedControls])

  const mappedColumns = useMemo<ColumnDef<MappedControlRow>[]>(
    () => [
      {
        accessorKey: 'refCode',
        header: 'Ref Code',
        cell: ({ row }) => {
          const href = controlLinkMap.get(row.original.refCode)
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
        header: 'Framework',
        cell: ({ row }) => (row.original.referenceFramework ? <StandardChip referenceFramework={row.original.referenceFramework} /> : <span className="text-muted-foreground">Custom</span>),
      },
      {
        accessorKey: 'mappingType',
        header: 'Mapping Type',
        cell: ({ row }) => formatEnumLabel(row.original.mappingType),
      },
      {
        accessorKey: 'relation',
        header: 'Relation',
        cell: ({ row }) => row.original.relation || '-',
      },
      {
        accessorKey: 'source',
        header: 'Source',
        cell: ({ row }) => formatEnumLabel(row.original.source),
      },
    ],
    [controlLinkMap],
  )

  return (
    <div className="space-y-6 mt-6">
      <SubcontrolsTable subcontrols={subcontrols} />
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

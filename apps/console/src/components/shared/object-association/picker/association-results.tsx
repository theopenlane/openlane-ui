'use client'

import { Fragment, useId, useState, type ComponentType } from 'react'
import { LoaderCircle, SearchIcon } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import { useDebounce } from '@uidotdev/usehooks'
import { Checkbox } from '@repo/ui/checkbox'
import { Input } from '@repo/ui/input'
import Pagination from '@repo/ui/pagination'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { useAssociationRows } from '@/components/shared/object-association/use-association-rows'
import { buildSubcontrolWhere, getAssociationTypeLabel, getSearchPlaceholder, OBJECT_QUERY_CONFIG, ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { useModuleAccess } from '@/lib/subscription-plan/hooks/use-module-access'
import { formatList, toLowerLabel } from '@/utils/strings'
import { getAssociationColumns } from './association-columns'
import AssociationFilterButton from './association-filter-button'
import { getAssociationFilters, type TAssociationFilterValues, useAssociationFilterWheres } from './association-filters'
import AssociationRow from './association-row'
import SubcontrolRows from './subcontrol-rows'
import { toAssociationCandidate } from './to-association-candidate'
import { type TAssociationChanges } from './use-association-changes'

const PAGE_SIZE = 25
const SKELETON_ROWS = 6
const DETAILS_SHEETS: Partial<Record<ObjectTypeObjects, ComponentType<{ entityId?: string | null; onClose?: () => void }>>> = {
  [ObjectTypeObjects.CONTROL_OBJECTIVE]: dynamic(() => import('@/components/pages/protected/controls/tabs/implementation/control-objectives-components/control-objective-details-sheet')),
  [ObjectTypeObjects.CONTROL_IMPLEMENTATION]: dynamic(() => import('@/components/pages/protected/controls/tabs/implementation/control-implementation-components/control-implementation-details-sheet')),
}

export type TAssociationView = { search: string; filters: TAssociationFilterValues }

export const EMPTY_ASSOCIATION_VIEW: TAssociationView = { search: '', filters: {} }

type TAssociationResultsProps = {
  objectType: ObjectTypeObjects
  initialData: TObjectAssociationMap
  changes: TAssociationChanges
  view: TAssociationView
  onViewChange: (view: TAssociationView) => void
  hideLinked: boolean
  onHideLinkedChange: (hideLinked: boolean) => void
  canSelectSubcontrols: boolean
}

const AssociationResults = ({ objectType, initialData, changes, view, onViewChange, hideLinked, onHideLinkedChange, canSelectSubcontrols }: TAssociationResultsProps) => {
  const hideLinkedId = useId()
  const { hasObjectType } = useModuleAccess()
  const { data: session } = useSession()
  const DetailsSheet = DETAILS_SHEETS[objectType]
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [detailsId, setDetailsId] = useState<string | null>(null)

  const trimmedSearch = view.search.trim()
  const search = useDebounce(trimmedSearch, 300)
  const filters = getAssociationFilters(objectType).filter(({ requires }) => !requires || hasObjectType(requires))
  const filterWheres = useAssociationFilterWheres(filters, view.filters)

  const hasExpansionGutter = objectType === ObjectTypeObjects.CONTROL && canSelectSubcontrols
  const linkedIds = initialData[OBJECT_QUERY_CONFIG[objectType].inputName] ?? []
  const linkedSubcontrolIds = initialData[OBJECT_QUERY_CONFIG[ObjectTypeObjects.SUB_CONTROL].inputName] ?? []
  const hiddenSubcontrolIds = hideLinked ? linkedSubcontrolIds : []

  const { rows, totalCount, isLoading, isStale, isError, pagination, totalPages, handlePageChange, handlePageSizeChange } = useAssociationRows({
    objectType,
    search,
    linkedIds,
    pageSize: PAGE_SIZE,
    filterWheres,
    hideLinked,
    extraVariables: hasExpansionGutter ? { withSubcontrols: true, subcontrolWhere: buildSubcontrolWhere(session?.user.activeOrganizationId, hiddenSubcontrolIds) } : undefined,
  })

  const isSearching = trimmedSearch !== search || (isStale && !!search)
  const showSkeleton = !isError && (isLoading || isStale)
  const visibleRows = showSkeleton || isError ? [] : rows
  const candidates = visibleRows.map((row) => toAssociationCandidate(objectType, row))
  const bulkSelection = changes.getBulkSelection(candidates)

  const columns = getAssociationColumns(objectType)
  const columnCount = columns.length + 2

  const typeLabel = toLowerLabel(getAssociationTypeLabel(objectType))
  const activeFilterLabels = filters.filter(({ key }) => view.filters[key]?.length).map(({ label }) => toLowerLabel(label))
  const countLabel = totalCount === undefined || isError ? '' : `${visibleRows.length} of ${totalCount} ${typeLabel}`
  const filterLabel = activeFilterLabels.length > 0 ? `filtered by ${formatList(activeFilterLabels)}` : ''

  const toggleExpanded = (id: string) => setExpandedIds((previous) => (previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id]))

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:min-h-0">
      <Input
        value={view.search}
        onChange={(event) => onViewChange({ ...view, search: event.target.value })}
        placeholder={getSearchPlaceholder(objectType)}
        aria-label={getSearchPlaceholder(objectType)}
        icon={isSearching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
        iconPosition="left"
        className="w-full"
      />
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => (
          <AssociationFilterButton
            key={filter.key}
            filter={filter}
            selected={view.filters[filter.key] ?? []}
            onChange={(selected) => onViewChange({ ...view, filters: { ...view.filters, [filter.key]: selected } })}
          />
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Checkbox id={hideLinkedId} checked={hideLinked} onCheckedChange={(checked) => onHideLinkedChange(checked === true)} />
          <label htmlFor={hideLinkedId} className="cursor-pointer text-sm text-muted-foreground">
            Hide already linked
          </label>
        </div>
      </div>
      <Table variant="data" className="table-fixed" containerClassName="min-h-72 flex-1 overflow-hidden rounded-md border sm:min-h-0">
        <TableHeader>
          <TableRow>
            <TableHead className="h-10 w-11 pl-4 pr-0">
              <Checkbox checked={bulkSelection.checked} disabled={bulkSelection.isDisabled} onCheckedChange={bulkSelection.toggle} aria-label={`Select all ${typeLabel} on this page`} />
            </TableHead>
            <TableHead className="h-10 px-2">Name</TableHead>
            {columns.map(({ header }) => (
              <TableHead key={header} className="hidden h-10 w-36 px-2 sm:table-cell">
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {showSkeleton &&
            Array.from({ length: SKELETON_ROWS }, (_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={columnCount} className="py-3">
                  <Skeleton height={16} className="w-full rounded-md" />
                </TableCell>
              </TableRow>
            ))}
          {(isError || (!showSkeleton && visibleRows.length === 0)) && (
            <TableRow>
              <TableCell colSpan={columnCount} className="py-10 text-center text-muted-foreground">
                {isError ? `Failed to load ${typeLabel}. Please try again later.` : `No ${typeLabel} found`}
              </TableCell>
            </TableRow>
          )}
          {visibleRows.map((row, index) => {
            const candidate = candidates[index]
            const canExpand = hasExpansionGutter && (row.subcontrolCount ?? 0) > 0
            const isExpanded = canExpand && expandedIds.includes(candidate.id)
            return (
              <Fragment key={candidate.id}>
                <AssociationRow
                  row={row}
                  candidate={candidate}
                  state={changes.getState(candidate)}
                  columns={columns}
                  onToggle={(selected) => changes.setSelected([candidate], selected)}
                  onViewDetails={DetailsSheet ? () => setDetailsId(candidate.id) : undefined}
                  expansion={canExpand ? { isExpanded, onToggle: () => toggleExpanded(candidate.id) } : undefined}
                  hasExpansionGutter={hasExpansionGutter}
                />
                {isExpanded && <SubcontrolRows controlId={candidate.id} controlRefCode={candidate.label} hiddenIds={hiddenSubcontrolIds} columnCount={columnCount} changes={changes} />}
              </Fragment>
            )
          })}
        </TableBody>
      </Table>
      <div className="flex flex-wrap items-center justify-between gap-x-4">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {[countLabel, filterLabel].filter(Boolean).join(' · ')}
        </p>
        <div className="-mx-4 *:gap-4 *:py-0 sm:ml-0">
          <Pagination currentPage={pagination.page} totalPages={totalPages} pageSize={pagination.pageSize} onPageChange={handlePageChange} onPageSizeChange={handlePageSizeChange} />
        </div>
      </div>
      {detailsId && DetailsSheet && <DetailsSheet entityId={detailsId} onClose={() => setDetailsId(null)} />}
    </div>
  )
}

export default AssociationResults

'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { GET_ASSOCIATION_PICKER_SUBCONTROLS } from '@repo/codegen/query/association-picker'
import { type GetAssociationPickerSubcontrolsQuery } from '@repo/codegen/src/schema'
import { Button } from '@repo/ui/button'
import { TableCell, TableRow } from '@repo/ui/table'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { MAX_CONNECTION_RESULTS } from '@/constants/pagination'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { buildSubcontrolWhere, extractTableRows, OBJECT_QUERY_CONFIG, ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { pluralizeWithCount } from '@/utils/strings'
import { SUBCONTROL_CHILD_COLUMNS } from './association-columns'
import AssociationRow from './association-row'
import { toAssociationCandidate } from './to-association-candidate'
import { type TAssociationChanges } from './use-association-changes'

type TSubcontrolRowsProps = {
  controlId: string
  controlRefCode: string
  hiddenIds: string[]
  columnCount: number
  changes: TAssociationChanges
}

const SubcontrolRows = ({ controlId, controlRefCode, hiddenIds, columnCount, changes }: TSubcontrolRowsProps) => {
  const { client } = useGraphQLClient()
  const { data: session } = useSession()
  const { responseObjectKey, inputName } = OBJECT_QUERY_CONFIG[ObjectTypeObjects.SUB_CONTROL]
  const where = { ...buildSubcontrolWhere(session?.user.activeOrganizationId, hiddenIds), controlID: controlId }

  const { data, isPending, isPlaceholderData, isError } = useQuery<GetAssociationPickerSubcontrolsQuery>({
    queryKey: [responseObjectKey, 'objectAssociation', 'children', where],
    queryFn: () => client.request(GET_ASSOCIATION_PICKER_SUBCONTROLS, { where, first: MAX_CONNECTION_RESULTS }),
  })

  if (isError) {
    return (
      <TableRow>
        <TableCell colSpan={columnCount} className="py-2 pl-24 text-destructive">
          Failed to load subcontrols. Please try again later.
        </TableCell>
      </TableRow>
    )
  }

  if (isPending || isPlaceholderData) {
    return (
      <TableRow>
        <TableCell colSpan={columnCount} className="py-3 pl-24">
          <Skeleton height={14} className="w-full max-w-72 rounded-md" />
        </TableCell>
      </TableRow>
    )
  }

  const rows = extractTableRows(responseObjectKey, data, inputName)
  const candidates = rows.map((row) => toAssociationCandidate(ObjectTypeObjects.SUB_CONTROL, row))
  const totalCount = data.subcontrols.totalCount
  const isTruncated = totalCount > rows.length
  const bulkSelection = changes.getBulkSelection(candidates)

  return (
    <>
      {rows.map((row, index) => (
        <AssociationRow
          key={candidates[index].id}
          row={row}
          candidate={candidates[index]}
          state={changes.getState(candidates[index])}
          columns={SUBCONTROL_CHILD_COLUMNS}
          onToggle={(selected) => changes.setSelected([candidates[index]], selected)}
          hasExpansionGutter
          isChild
        />
      ))}
      <TableRow>
        <TableCell colSpan={columnCount} className="py-2 pl-24 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {!bulkSelection.isDisabled && (
              <Button type="button" variant="link" className="text-xs" onClick={bulkSelection.toggle}>
                {`${bulkSelection.isAllSelected ? 'Deselect' : 'Select'} all ${pluralizeWithCount(bulkSelection.count, 'subcontrol')}`}
              </Button>
            )}
            <span>{isTruncated ? `Showing ${rows.length} of ${totalCount}. Search under Subcontrols to find the rest.` : `Selecting ${controlRefCode} on its own does not link its subcontrols`}</span>
          </div>
        </TableCell>
      </TableRow>
    </>
  )
}

export default SubcontrolRows

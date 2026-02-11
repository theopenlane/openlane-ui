import { GetAllGroupsQuery } from '@repo/codegen/src/schema'
import { Checkbox } from '@repo/ui/checkbox'
import { ColumnDef } from '@tanstack/react-table'

type GroupEdge = NonNullable<NonNullable<GetAllGroupsQuery['groups']>['edges']>[number]

export type Group = NonNullable<GroupEdge>['node']

export const useGroupSelectionColumns = (selectedGroupIds: string[], setSelectedGroupIds: (ids: string[]) => void, allGroupIds: string[]): ColumnDef<Group>[] => [
  {
    id: 'select',
    header: () => {
      const allSelected = allGroupIds.every((id) => selectedGroupIds.includes(id))

      return (
        <Checkbox
          checked={allSelected ? true : false}
          onCheckedChange={(checked) => {
            if (checked) {
              setSelectedGroupIds(allGroupIds)
            } else {
              setSelectedGroupIds([])
            }
          }}
        />
      )
    },
    cell: ({ row }) => {
      const id = row.original?.id || ''
      const isChecked = selectedGroupIds.includes(id)

      return (
        <Checkbox
          checked={isChecked}
          onCheckedChange={(checked) => {
            if (checked) {
              setSelectedGroupIds([...selectedGroupIds, id])
            } else {
              setSelectedGroupIds(selectedGroupIds.filter((gid) => gid !== id))
            }
          }}
        />
      )
    },
    size: 50,
    maxSize: 50,
  },
  {
    accessorKey: 'name',
    header: 'Group',
    cell: ({ row }) => row?.original?.displayName,
  },
  {
    accessorKey: 'members',
    header: 'Member',
    cell: ({ row }) => row?.original?.members?.edges?.length || 0,
  },
]

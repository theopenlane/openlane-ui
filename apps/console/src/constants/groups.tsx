import { OBJECT_TYPE_PERMISSIONS_CONFIG, TypesWithPermissions } from '@repo/codegen/src/type-names'
import { Checkbox } from '@repo/ui/checkbox'
import { ColumnDef } from '@tanstack/table-core'
import { GroupPermissionWhereInput } from '@repo/codegen/src/schema'

export type TableDataItem = {
  id: string
  name: string
  checked: boolean
  togglePermission: (obj: TableDataItem) => void
  referenceFramework?: string
}

export const generateColumns = (selectedObject: TypesWithPermissions | null, items: TableDataItem[]): ColumnDef<TableDataItem>[] => {
  const allChecked = items.length > 0 && items.every((item) => item.checked)

  const baseColumns: ColumnDef<TableDataItem>[] = [
    {
      id: 'checked',
      size: 10,
      minSize: 10,
      maxSize: 10,
      enableResizing: false,
      header: () => (
        <Checkbox
          checked={allChecked}
          onCheckedChange={(checked) => {
            items.forEach((item) => {
              if (item.checked !== checked) {
                item.togglePermission(item)
              }
            })
          }}
        />
      ),
      cell: ({ row }) => <Checkbox checked={row.original.checked} onCheckedChange={() => row.original.togglePermission(row.original)} />,
    },
    {
      header: 'Name',
      accessorKey: 'name',
      size: 120,
      minSize: 60,
      maxSize: 200,
    },
  ]

  const extraColumns = selectedObject ? OBJECT_TYPE_PERMISSIONS_CONFIG[selectedObject]?.extraTableColumns || [] : []

  return [...baseColumns, ...extraColumns]
}

export const generateGroupsPermissionsWhere = ({
  debouncedSearchValue,
  selectedGroup,
  selectedObject,
}: {
  debouncedSearchValue: string
  selectedGroup: string | null
  selectedObject: TypesWithPermissions | null
}): { where: GroupPermissionWhereInput } => {
  if (!selectedObject || !selectedGroup) return { where: {} }

  const config = OBJECT_TYPE_PERMISSIONS_CONFIG[selectedObject]
  const baseWhere = {
    [config.searchAttribute]: debouncedSearchValue,
  }

  const exclusionFilter = {
    not: {
      or: [
        { hasEditorsWith: [{ id: selectedGroup }] } as GroupPermissionWhereInput,
        { hasBlockedGroupsWith: [{ id: selectedGroup }] } as GroupPermissionWhereInput,
        ...(config.excludeViewersInFilter ? [] : [{ hasViewersWith: [{ id: selectedGroup }] } as GroupPermissionWhereInput]),
      ],
    },
  }

  return {
    where: {
      and: [baseWhere, exclusionFilter],
    },
  }
}

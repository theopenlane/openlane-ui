import { ColumnDef, Row } from '@tanstack/react-table'
import { Assessment, User } from '@repo/codegen/src/schema'
import { formatDate, formatTimeSince } from '@/utils/date'
import { Avatar } from '@/components/shared/avatar/avatar'
import { Checkbox } from '@repo/ui/checkbox'

type Params = {
  userMap?: Record<string, User>
  selectedQuestionnaires: { id: string }[]
  setSelectedQuestionnaires: React.Dispatch<React.SetStateAction<{ id: string }[]>>
}

export const getQuestionnaireColumns = (params?: Params) => {
  const userMap = params?.userMap || {}
  const toggleSelection = (control: { id: string }) => {
    params?.setSelectedQuestionnaires((prev) => {
      const exists = prev.some((c) => c.id === control.id)
      return exists ? prev.filter((c) => c.id !== control.id) : [...prev, control]
    })
  }
  const columns: ColumnDef<Assessment>[] = [
    {
      id: 'select',
      header: ({ table }) => {
        const selected = params?.selectedQuestionnaires ?? []
        const setSelected = params?.setSelectedQuestionnaires
        const currentPageQuestionnaires = table.getRowModel().rows.map((row) => row.original)
        console.log(currentPageQuestionnaires)
        const allSelected = currentPageQuestionnaires.every((control) => selected.some((sc) => sc.id === control.id))
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked) => {
                if (checked === 'indeterminate' || !setSelected) return

                const newSelections = checked
                  ? [...selected.filter((sc) => !currentPageQuestionnaires.some((c) => c.id === sc.id)), ...currentPageQuestionnaires.map((c) => ({ id: c.id }))]
                  : selected.filter((sc) => !currentPageQuestionnaires.some((c) => c.id === sc.id))

                setSelected(newSelections)
              }}
            />
          </div>
        )
      },
      cell: ({ row }: { row: Row<Assessment> }) => {
        const { id } = row.original
        const isChecked = params?.selectedQuestionnaires.some((c) => c.id === id)

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={isChecked} onCheckedChange={() => toggleSelection({ id })} />
          </div>
        )
      },
      size: 50,
    },
    {
      accessorKey: 'id',
      header: 'ID',
      size: 120,
      cell: ({ row }) => <div className="text-muted-foreground">{row.original.id}</div>,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ cell }) => <div className="font-bold">{cell.getValue() as string}</div>,
      size: 100,
      minSize: 100,
      maxSize: 200,
    },
    {
      accessorKey: 'createdBy',
      header: 'Created By',
      size: 160,
      cell: ({ row }) => {
        const userId = row.original.createdBy
        const user = userMap?.[userId ?? '']
        return user ? (
          <div className="flex items-center gap-2">
            <Avatar entity={user} className="w-6 h-6" />
            {user.displayName}
          </div>
        ) : (
          <span className="text-muted-foreground italic">Deleted user</span>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ cell }) => formatDate(cell.getValue() as string),
      size: 120,
    },
    {
      accessorKey: 'updatedBy',
      header: 'Updated By',
      size: 160,
      cell: ({ row }) => {
        const userId = row.original.updatedBy
        const user = userMap?.[userId ?? '']
        return user ? (
          <div className="flex items-center gap-2">
            <Avatar entity={user} className="w-6 h-6" />
            {user.displayName}
          </div>
        ) : (
          <span className="text-muted-foreground italic">Deleted user</span>
        )
      },
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last updated',
      cell: ({ cell }) => formatTimeSince(cell.getValue() as string),
      size: 120,
    },
  ]

  const mappedColumns = columns
    .filter((column): column is { accessorKey: string; header: string } => 'accessorKey' in column && typeof column.accessorKey === 'string' && 'header' in column && typeof column.header === 'string')
    .map((column) => ({
      accessorKey: column.accessorKey,
      header: column.header,
    }))

  return { columns, mappedColumns }
}

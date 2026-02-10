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
  const toggleSelection = (questionnaire: { id: string }) => {
    params?.setSelectedQuestionnaires((prev) => {
      const exists = prev.some((c) => c.id === questionnaire.id)
      return exists ? prev.filter((c) => c.id !== questionnaire.id) : [...prev, questionnaire]
    })
  }
  const columns: ColumnDef<Assessment>[] = [
    {
      id: 'select',
      header: ({ table }) => {
        const selected = params?.selectedQuestionnaires ?? []
        const setSelected = params?.setSelectedQuestionnaires
        const currentPageQuestionnaires = table.getRowModel().rows.map((row) => row.original)
        const allSelected = currentPageQuestionnaires.every((questionnaire) => selected.some((sc) => sc.id === questionnaire.id))
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked) => {
                if (checked === 'indeterminate' || !setSelected) return

                const newSelections = checked
                  ? [...selected.filter((sq) => !currentPageQuestionnaires.some((c) => c.id === sq.id)), ...currentPageQuestionnaires.map((q) => ({ id: q.id }))]
                  : selected.filter((sq) => !currentPageQuestionnaires.some((c) => c.id === sq.id))

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
      maxSize: 50,
      meta: {
        className: 'max-w-[10%] w-[4%]',
      },
    },
    {
      accessorKey: 'id',
      header: 'ID',
      meta: {
        className: 'max-w-[10%] w-[4%]',
      },
      cell: ({ row }) => <div className="text-muted-foreground">{row.original.id}</div>,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ cell }) => <div className="font-bold">{cell.getValue() as string}</div>,
      size: 200,
      minSize: 150,
    },
    {
      accessorKey: 'createdBy',
      header: 'Created by',
      size: 200,
      cell: ({ row }) => {
        const userId = row.original.createdBy
        const user = userMap?.[userId ?? '']
        return user ? (
          <div className="flex items-center gap-2">
            <Avatar entity={user} />
            {user.displayName || '-'}
          </div>
        ) : (
          'Deleted user'
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      size: 150,
      cell: ({ cell }) => <span className="whitespace-nowrap">{formatDate(cell.getValue() as string)}</span>,
    },
    {
      accessorKey: 'updatedBy',
      header: 'Updated By',
      size: 200,
      cell: ({ row }) => {
        const userId = row.original.updatedBy
        const user = userMap?.[userId ?? '']
        return user ? (
          <div className="flex items-center gap-2">
            <Avatar entity={user} />
            {user.displayName || '-'}
          </div>
        ) : (
          'Deleted user'
        )
      },
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last Updated',
      size: 100,
      cell: ({ cell }) => <span className="whitespace-nowrap">{formatTimeSince(cell.getValue() as string)}</span>,
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

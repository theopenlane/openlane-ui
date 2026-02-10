import { ColumnDef, Row } from '@tanstack/react-table'
import { Assessment, User } from '@repo/codegen/src/schema'
import { formatDate, formatTimeSince } from '@/utils/date'
import { Avatar } from '@/components/shared/avatar/avatar'
import { Checkbox } from '@repo/ui/checkbox'
import { Button } from '@repo/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { MoreHorizontal, Send, Pencil, Eye, Trash2, FileText } from 'lucide-react'

type Params = {
  userMap?: Record<string, User>
  selectedQuestionnaires: { id: string }[]
  setSelectedQuestionnaires: React.Dispatch<React.SetStateAction<{ id: string }[]>>
  onSend?: (assessment: Assessment) => void
  onEdit?: (assessment: Assessment) => void
  onPreview?: (assessment: Assessment) => void
  onViewDetails?: (assessment: Assessment) => void
  onDelete?: (assessment: Assessment) => void
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
      size: 150,
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
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        return (
          <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary">
                  <MoreHorizontal className="h-4 w-4 text-brand" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-40">
                <DropdownMenuItem onClick={() => params?.onViewDetails?.(row.original)}>
                  <FileText className="h-4 w-4 " />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => params?.onSend?.(row.original)}>
                  <Send className="h-4 w-4 " />
                  Send
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => params?.onEdit?.(row.original)}>
                  <Pencil className="h-4 w-4 " />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => params?.onPreview?.(row.original)}>
                  <Eye className="h-4 w-4 " />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => params?.onDelete?.(row.original)}>
                  <Trash2 className="h-4 w-4 " />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
      size: 40,
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

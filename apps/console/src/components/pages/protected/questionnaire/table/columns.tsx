import { ColumnDef, Row } from '@tanstack/react-table'
import { Assessment, User } from '@repo/codegen/src/schema'
import { formatDate, formatTimeSince } from '@/utils/date'
import { Avatar } from '@/components/shared/avatar/avatar'
import { Checkbox } from '@repo/ui/checkbox'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { MoreHorizontal, Send, Pencil, Eye, Trash2, FileText } from 'lucide-react'
import TagChip from '@/components/shared/tag-chip.tsx/tag-chip'

type Params = {
  userMap?: Record<string, User>
  selectedQuestionnaires: { id: string }[]
  setSelectedQuestionnaires: React.Dispatch<React.SetStateAction<{ id: string }[]>>
  onSend?: (assessment: Assessment) => void
  onEdit?: (assessment: Assessment) => void
  onPreview?: (assessment: Assessment) => void
  onViewDetails?: (assessment: Assessment) => void
  onDelete?: (assessment: Assessment) => void
  canSend?: boolean
  canEdit?: boolean
  canDelete?: boolean
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
      size: 270,
      minSize: 270,
      maxSize: 270,
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
      accessorKey: 'title',
      header: 'Title',
      size: 200,
      accessorFn: (row) => row.jsonconfig?.title ?? '-',
      cell: ({ getValue }) => <span>{getValue() as string}</span>,
    },
    {
      accessorKey: 'assessmentType',
      header: 'Type',
      size: 120,
      cell: ({ cell }) => {
        const value = cell.getValue() as string
        return <Badge variant="outline">{value === 'INTERNAL' ? 'Internal' : 'External'}</Badge>
      },
    },
    {
      accessorKey: 'tags',
      header: 'Tags',
      size: 140,
      cell: ({ row }) => {
        const tags = row?.original?.tags
        if (!tags?.length) {
          return '-'
        }
        return (
          <div className="flex gap-2 flex-wrap">
            {tags.map((tag) => (
              <TagChip key={tag} tag={tag} />
            ))}
          </div>
        )
      },
    },
    {
      id: 'templateName',
      header: 'Template Name',
      size: 180,
      accessorFn: (row) => row.template?.name ?? '-',
      cell: ({ getValue }) => <span>{getValue() as string}</span>,
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
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const canSend = !!params?.canSend
        const canEditQuestionnaire = !!params?.canEdit
        const canDeleteQuestionnaire = !!params?.canDelete
        const hasAnyAction = canSend || canEditQuestionnaire || canDeleteQuestionnaire || !!params?.onPreview || !!params?.onViewDetails

        if (!hasAnyAction) {
          return null
        }

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
                  <FileText className="h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                {canSend && (
                  <DropdownMenuItem onClick={() => params?.onSend?.(row.original)}>
                    <Send className="h-4 w-4" />
                    Send
                  </DropdownMenuItem>
                )}
                {canEditQuestionnaire && (
                  <DropdownMenuItem onClick={() => params?.onEdit?.(row.original)}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => params?.onPreview?.(row.original)}>
                  <Eye className="h-4 w-4" />
                  Preview
                </DropdownMenuItem>
                {canDeleteQuestionnaire && (
                  <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => params?.onDelete?.(row.original)}>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
      size: 40,
    },
  ]

  const mappedColumns = columns
    .filter((column): column is ColumnDef<Assessment> & { header: string } => {
      if (typeof column.header !== 'string') return false
      return ('accessorKey' in column && typeof column.accessorKey === 'string') || ('id' in column && typeof column.id === 'string' && column.id !== 'select' && column.id !== 'actions')
    })
    .map((column) => ({
      accessorKey: 'accessorKey' in column && typeof column.accessorKey === 'string' ? column.accessorKey : (column as { id: string }).id,
      header: column.header as string,
    }))

  return { columns, mappedColumns }
}

import { type Program } from '@repo/codegen/src/schema'
import { type ColumnDef } from '@repo/ui/table-types'
import { Checkbox } from '@repo/ui/checkbox'
import { type TLinkedProgram } from './types/object-association-types'
import { toLinkedProgram } from './utils'

type TColumnOptions = {
  selectedPrograms: TLinkedProgram[]
  setSelectedPrograms: React.Dispatch<React.SetStateAction<TLinkedProgram[]>>
  convertToReadOnly: (data: string, padding?: number, style?: React.CSSProperties) => React.JSX.Element
}

export const getProgramsColumns = ({ selectedPrograms, setSelectedPrograms, convertToReadOnly }: TColumnOptions): ColumnDef<Program>[] => {
  const selectedIds = new Set(selectedPrograms.map((program) => program.id))

  const toggleSelection = (programs: TLinkedProgram[], isChecked: boolean) => {
    const toggledIds = new Set(programs.map((program) => program.id))
    setSelectedPrograms((prev) => {
      if (!isChecked) {
        return prev.filter((selected) => !toggledIds.has(selected.id))
      }

      const alreadySelected = new Set(prev.map((selected) => selected.id))
      return [...prev, ...programs.filter((program) => !alreadySelected.has(program.id))]
    })
  }

  return [
    {
      id: 'select',
      header: ({ table }) => {
        const currentPageRows = table.getRowModel().rows.map((row) => row.original)
        const allSelected = currentPageRows.length > 0 && currentPageRows.every((row) => selectedIds.has(row.id))

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={allSelected} onCheckedChange={(checked) => toggleSelection(currentPageRows.map(toLinkedProgram), checked === true)} />
          </div>
        )
      },
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox checked={selectedIds.has(row.original.id)} onCheckedChange={(val) => toggleSelection([toLinkedProgram(row.original)], val === true)} />
        </div>
      ),
      size: 50,
      maxSize: 50,
      enableResizing: false,
    },
    {
      accessorKey: 'name',
      header: 'Program',
      size: 160,
      maxSize: 160,
      enableResizing: false,
      cell: ({ row }) => <span className="block truncate whitespace-nowrap">{row.original.name}</span>,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      enableResizing: false,
      cell: ({ row }) => <div className="line-clamp-2 overflow-hidden">{convertToReadOnly(row.original.description ?? '', 0)}</div>,
    },
  ]
}

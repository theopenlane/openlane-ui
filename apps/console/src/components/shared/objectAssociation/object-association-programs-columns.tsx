import { Program } from '@repo/codegen/src/schema'
import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@repo/ui/checkbox'
import { CreateEvidenceFormData } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { UseFormReturn } from 'react-hook-form'

type TColumnOptions = {
  selectedRefCodeMap: string[]
  frameworks: string[]
  setSelectedRefCodeMap: React.Dispatch<React.SetStateAction<string[]>>
  setFrameworks: React.Dispatch<React.SetStateAction<string[]>>
  convertToReadOnly: (data: string, padding?: number, style?: React.CSSProperties) => React.JSX.Element
  form: UseFormReturn<CreateEvidenceFormData>
}

export const getProgramsColumns = ({ selectedRefCodeMap, frameworks, setSelectedRefCodeMap, setFrameworks, convertToReadOnly, form }: TColumnOptions): ColumnDef<Program>[] => {
  const toggleChecked = (id: string, refCode: string, isChecked: boolean, referenceFramework?: string) => {
    const currentIds = form.getValues('programIDs') || []
    const newIds = isChecked ? [...new Set([...currentIds, id])] : currentIds.filter((v) => v !== id)

    const newRefCodes = isChecked ? [...new Set([...(selectedRefCodeMap || []), refCode])] : selectedRefCodeMap?.filter((v) => v !== refCode)

    const newFrameworks = isChecked ? [...new Set([...frameworks, referenceFramework || ''])] : frameworks.filter((f) => f !== referenceFramework)

    setSelectedRefCodeMap(newRefCodes)
    setFrameworks(newFrameworks)
    form.setValue('programIDs', newIds, { shouldValidate: true, shouldDirty: true })
  }

  return [
    {
      id: 'select',
      header: ({ table }) => {
        const currentPageRows = table.getRowModel().rows.map((row) => row.original)
        const selectedIds = form.getValues('programIDs') || []

        const allSelected = currentPageRows.every((row) => selectedIds.includes(row.id))

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked) => {
                currentPageRows.forEach((row) => {
                  toggleChecked(row.id, row.name, checked === true)
                })
              }}
            />
          </div>
        )
      },
      cell: ({ row }) => {
        const { id, name } = row.original
        const checked = (form.getValues('programIDs') || []).includes(id)

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={checked} onCheckedChange={(val) => toggleChecked(id, name, val === true)} />
          </div>
        )
      },
      enableResizing: false,
    },
    {
      accessorKey: 'name',
      header: 'Program',
      meta: {
        className: 'max-w-[40%] w-[30%]',
      },
      enableResizing: false,
      cell: ({ row }) => <span className="block truncate whitespace-nowrap">{row.original.name}</span>,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      size: 0,
      enableResizing: false,
      cell: ({ row }) => <div className="line-clamp-2 overflow-hidden">{convertToReadOnly(row.getValue('description') as string, 0)}</div>,
    },
  ]
}

import { Program } from '@repo/codegen/src/schema'
import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@repo/ui/checkbox'
import { CreateEvidenceFormData } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { UseFormReturn } from 'react-hook-form'

type ColumnOptions = {
  selectedRefCodeMap: string[]
  frameworks: string[]
  setSelectedRefCodeMap: React.Dispatch<React.SetStateAction<string[]>>
  setFrameworks: React.Dispatch<React.SetStateAction<string[]>>
  convertToReadOnly: (data: string, padding?: number, style?: React.CSSProperties) => React.JSX.Element
  form: UseFormReturn<CreateEvidenceFormData>
}

export const getProgramsColumns = ({ selectedRefCodeMap, frameworks, setSelectedRefCodeMap, setFrameworks, convertToReadOnly, form }: ColumnOptions): ColumnDef<Program>[] => {
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
      accessorKey: 'name',
      header: 'Program',
      cell: ({ row }) => {
        const { id, name } = row.original
        const checked = (form.getValues('programIDs') || []).includes(id) ?? false

        return (
          <div className="flex items-center gap-2">
            <Checkbox checked={checked} onCheckedChange={(val) => toggleChecked(id, name, val === true)} />
            <span>{name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => <div className="line-clamp-3 text-justify">{convertToReadOnly(row.getValue('description') as string, 0)}</div>,
    },
  ]
}

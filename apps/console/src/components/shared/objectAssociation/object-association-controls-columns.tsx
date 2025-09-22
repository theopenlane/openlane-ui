import { ColumnDef } from '@tanstack/react-table'
import { ControlListFieldsFragment, Subcontrol } from '@repo/codegen/src/schema'
import { Checkbox } from '@repo/ui/checkbox'
import { CreateEvidenceFormData } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { UseFormReturn } from 'react-hook-form'

type ColumnOptions = {
  selectedObject: 'Control' | 'Subcontrol'
  selectedRefCodeMap: string[]
  frameworks: Record<string, string>
  selectedSubcontrolRefCodeMap: string[]
  subcontrolFrameworks: Record<string, string>
  setSelectedRefCodeMap: React.Dispatch<React.SetStateAction<string[]>>
  setFrameworks: React.Dispatch<React.SetStateAction<Record<string, string>>>
  setSelectedSubcontrolRefCodeMap: React.Dispatch<React.SetStateAction<string[]>>
  setSubcontrolFrameworks: React.Dispatch<React.SetStateAction<Record<string, string>>>
  convertToReadOnly: (data: string, padding?: number, style?: React.CSSProperties) => React.JSX.Element
  form: UseFormReturn<CreateEvidenceFormData>
}

export const getControlsAndSubcontrolsColumns = ({
  selectedObject,
  selectedRefCodeMap,
  frameworks,
  selectedSubcontrolRefCodeMap,
  subcontrolFrameworks,
  setSelectedRefCodeMap,
  setFrameworks,
  setSelectedSubcontrolRefCodeMap,
  setSubcontrolFrameworks,
  convertToReadOnly,
  form,
}: ColumnOptions): ColumnDef<ControlListFieldsFragment | Subcontrol>[] => {
  const toggleChecked = (id: string, refCode: string, isChecked: boolean, referenceFramework?: string) => {
    if (selectedObject === 'Control') {
      const currentIds = form.getValues('controlIDs') || []
      const newIds = isChecked ? [...new Set([...currentIds, id])] : currentIds.filter((v) => v !== id)
      const newRefCodes = isChecked ? [...new Set([...(selectedRefCodeMap || []), refCode])] : selectedRefCodeMap?.filter((v) => v !== refCode)

      const newFrameworks = isChecked ? { ...frameworks, [id]: referenceFramework ?? '' } : Object.fromEntries(Object.entries(frameworks).filter(([key]) => key !== id))
      form.setValue('controlIDs', newIds, { shouldValidate: true, shouldDirty: true })

      setSelectedRefCodeMap(newRefCodes)
      setFrameworks(newFrameworks)
    } else {
      const currentIds = form.getValues('subcontrolIDs') || []
      const newIds = isChecked ? [...new Set([...currentIds, id])] : currentIds.filter((v) => v !== id)
      const newRefCodes = isChecked ? [...new Set([...(selectedSubcontrolRefCodeMap || []), refCode])] : selectedSubcontrolRefCodeMap?.filter((v) => v !== refCode)

      const newFrameworks = isChecked ? { ...subcontrolFrameworks, [id]: referenceFramework ?? '' } : Object.fromEntries(Object.entries(subcontrolFrameworks).filter(([key]) => key !== id))
      form.setValue('subcontrolIDs', newIds, { shouldValidate: true, shouldDirty: true })
      setSelectedSubcontrolRefCodeMap(newRefCodes)
      setSubcontrolFrameworks(newFrameworks)
    }
  }
  return [
    {
      accessorKey: 'name',
      header: selectedObject === 'Control' ? 'Control' : 'Subcontrol',
      cell: ({ row }) => {
        const { id, refCode, referenceFramework } = row.original
        const checked = selectedObject === 'Control' ? (form.getValues('controlIDs') || []).includes(id) ?? false : (form.getValues('subcontrolIDs') || []).includes(id) ?? false

        return (
          <div className="flex items-center gap-2">
            <Checkbox checked={checked} onCheckedChange={(val) => toggleChecked(id, refCode, val === true, referenceFramework || undefined)} />
            <span>{refCode}</span>
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

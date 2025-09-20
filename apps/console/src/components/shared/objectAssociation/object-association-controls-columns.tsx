import { ColumnDef } from '@tanstack/react-table'
import { ControlListFieldsFragment, Subcontrol } from '@repo/codegen/src/schema'
import { Checkbox } from '@repo/ui/checkbox'
import { TObjectAssociationMap } from './types/TObjectAssociationMap'

type ColumnOptions = {
  selectedObject: 'Control' | 'Subcontrol'
  selectedIdsMap: TObjectAssociationMap
  selectedRefCodeMap: string[]
  frameworks: Record<string, string>
  selectedSubcontrolIdsMap: TObjectAssociationMap
  selectedSubcontrolRefCodeMap: string[]
  subcontrolFrameworks: Record<string, string>
  setSelectedIdsMap: React.Dispatch<React.SetStateAction<TObjectAssociationMap>>
  setSelectedRefCodeMap: React.Dispatch<React.SetStateAction<string[]>>
  setFrameworks: React.Dispatch<React.SetStateAction<Record<string, string>>>
  setSelectedSubcontrolIdsMap: React.Dispatch<React.SetStateAction<TObjectAssociationMap>>
  setSelectedSubcontrolRefCodeMap: React.Dispatch<React.SetStateAction<string[]>>
  setSubcontrolFrameworks: React.Dispatch<React.SetStateAction<Record<string, string>>>
  convertToReadOnly: (data: string, padding?: number, style?: React.CSSProperties) => React.JSX.Element
}

export const getControlsAndSubcontrolsColumns = ({
  selectedObject,
  selectedIdsMap,
  selectedRefCodeMap,
  frameworks,
  selectedSubcontrolIdsMap,
  selectedSubcontrolRefCodeMap,
  subcontrolFrameworks,
  setSelectedIdsMap,
  setSelectedRefCodeMap,
  setFrameworks,
  setSelectedSubcontrolIdsMap,
  setSelectedSubcontrolRefCodeMap,
  setSubcontrolFrameworks,
  convertToReadOnly,
}: ColumnOptions): ColumnDef<ControlListFieldsFragment | Subcontrol>[] => {
  const toggleChecked = (id: string, refCode: string, isChecked: boolean, referenceFramework?: string) => {
    if (selectedObject === 'Control') {
      const newIds = isChecked ? [...new Set([...(selectedIdsMap.controlIDs || []), id])] : selectedIdsMap.controlIDs?.filter((v) => v !== id)

      const newRefCodes = isChecked ? [...new Set([...(selectedRefCodeMap || []), refCode])] : selectedRefCodeMap?.filter((v) => v !== refCode)

      const newFrameworks = isChecked ? { ...frameworks, [id]: referenceFramework ?? '' } : Object.fromEntries(Object.entries(frameworks).filter(([key]) => key !== id))

      setSelectedIdsMap({ controlIDs: newIds })
      setSelectedRefCodeMap(newRefCodes)
      setFrameworks(newFrameworks)
    } else {
      const newIds = isChecked ? [...new Set([...(selectedSubcontrolIdsMap.subcontrolIDs || []), id])] : selectedSubcontrolIdsMap.subcontrolIDs?.filter((v) => v !== id)

      const newRefCodes = isChecked ? [...new Set([...(selectedSubcontrolRefCodeMap || []), refCode])] : selectedSubcontrolRefCodeMap?.filter((v) => v !== refCode)

      const newFrameworks = isChecked ? { ...subcontrolFrameworks, [id]: referenceFramework ?? '' } : Object.fromEntries(Object.entries(subcontrolFrameworks).filter(([key]) => key !== id))

      setSelectedSubcontrolIdsMap({ subcontrolIDs: newIds })
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
        const checked = selectedObject === 'Control' ? selectedIdsMap.controlIDs?.includes(id) ?? false : selectedSubcontrolIdsMap.subcontrolIDs?.includes(id) ?? false

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

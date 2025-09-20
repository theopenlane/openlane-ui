import { Program } from '@repo/codegen/src/schema'
import { TObjectAssociationMap } from './types/TObjectAssociationMap'
import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@repo/ui/checkbox'

type ColumnOptions = {
  selectedIdsMap: TObjectAssociationMap
  selectedRefCodeMap: string[]
  frameworks: string[]
  setSelectedIdsMap: React.Dispatch<React.SetStateAction<TObjectAssociationMap>>
  setSelectedRefCodeMap: React.Dispatch<React.SetStateAction<string[]>>
  setFrameworks: React.Dispatch<React.SetStateAction<string[]>>
  convertToReadOnly: (data: string, padding?: number, style?: React.CSSProperties) => React.JSX.Element
}

export const getProgramsColumns = ({
  selectedIdsMap,
  selectedRefCodeMap,
  frameworks,
  setSelectedIdsMap,
  setSelectedRefCodeMap,
  setFrameworks,
  convertToReadOnly,
}: ColumnOptions): ColumnDef<Program>[] => {
  const toggleChecked = (id: string, refCode: string, isChecked: boolean, referenceFramework?: string) => {
    const newIds = isChecked ? [...new Set([...(selectedIdsMap.programIDs || []), id])] : selectedIdsMap.programIDs?.filter((v) => v !== id)

    const newRefCodes = isChecked ? [...new Set([...(selectedRefCodeMap || []), refCode])] : selectedRefCodeMap?.filter((v) => v !== refCode)

    const newFrameworks = isChecked ? [...new Set([...frameworks, referenceFramework || ''])] : frameworks.filter((f) => f !== referenceFramework)

    setSelectedIdsMap({ programIDs: newIds })
    setSelectedRefCodeMap(newRefCodes)
    setFrameworks(newFrameworks)
  }
  return [
    {
      accessorKey: 'name',
      header: 'Program',
      cell: ({ row }) => {
        const { id, name } = row.original
        const checked = selectedIdsMap.programIDs?.includes(id) ?? false

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

'use client'

import { useEffect, useState } from 'react'
import { Label } from '@repo/ui/label'
import { Input } from '@repo/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { AllObjectQueriesData, OBJECT_QUERY_CONFIG, ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config'
import { useQuery } from '@tanstack/react-query'
import ObjectAssociationTable from '@/components/shared/objectAssociation/object-association-table'
import ObjectAssociationPlaceholder from '@/components/shared/object-association/object-association-placeholder'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { TObjectAssociationMap } from './types/TObjectAssociationMap'
import { useDebounce } from '@uidotdev/usehooks'

type Props = {
  onIdChange: (updatedMap: TObjectAssociationMap, refCodes?: any) => void
  excludeObjectTypes?: ObjectTypeObjects[]
  initialData?: TObjectAssociationMap
  refCodeInitialData?: TObjectAssociationMap
  defaultSelectedObject?: ObjectTypeObjects
}

const ObjectAssociation: React.FC<Props> = ({ onIdChange, excludeObjectTypes, initialData, refCodeInitialData, defaultSelectedObject }) => {
  const { client } = useGraphQLClient()
  const [selectedObject, setSelectedObject] = useState<ObjectTypeObjects | null>(defaultSelectedObject || null)
  const [searchValue, setSearchValue] = useState('')
  const [TableData, setTableData] = useState<any[]>([])
  const debouncedSearchValue = useDebounce(searchValue, 300)

  const selectedConfig = selectedObject ? OBJECT_QUERY_CONFIG[selectedObject] : null
  const selectedQuery = selectedConfig?.queryDocument
  const objectKey = selectedConfig?.responseObjectKey
  const inputName = selectedConfig?.inputName
  const inputPlaceholder = selectedConfig?.placeholder
  const searchAttribute = selectedConfig?.searchAttribute
  const objectName = selectedConfig?.objectName!

  const whereFilter = {
    ...(searchAttribute && debouncedSearchValue ? { [searchAttribute]: debouncedSearchValue } : {}),
  }

  const { data } = useQuery<AllObjectQueriesData>({
    queryKey: ['assignPermission', selectedObject, whereFilter],
    queryFn: async () => client.request(selectedQuery, { where: whereFilter }),
    enabled: !!selectedQuery,
  })

  useEffect(() => {
    if (objectKey && data) {
      const updatedData =
        data[objectKey]?.edges?.map((item: any) => ({
          id: item?.node?.id || '',
          name: item?.node?.[objectName] || '',
          description: item?.node?.description || item.node.summary || '',
          inputName: inputName || '',
          refCode: item?.node?.refCode ?? item?.node?.displayID ?? '',
          details: item?.node?.details || '',
        })) || []
      setTableData(updatedData)
    }
  }, [data, objectKey])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchValue(value)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 items-center">
        <div className="flex flex-col gap-2">
          <Label>Object Type</Label>
          <Select onValueChange={(val: ObjectTypeObjects) => setSelectedObject(val)}>
            <SelectTrigger className="w-full">{selectedObject || 'Select object'}</SelectTrigger>
            <SelectContent>
              {Object.values(ObjectTypeObjects)
                .filter((option) => !excludeObjectTypes?.includes(option))
                .map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Search</Label>
          <Input
            disabled={!selectedQuery}
            onChange={handleSearchChange}
            value={searchValue}
            placeholder={inputPlaceholder ? `Type ${inputPlaceholder} name` : 'Select object first'}
            className="h-10 w-full"
          />
        </div>
      </div>
      {selectedObject ? (
        <ObjectAssociationTable data={TableData} onIDsChange={onIdChange} initialData={initialData} refCodeInitialData={refCodeInitialData} />
      ) : (
        <div className="flex items-center justify-center w-full">
          <ObjectAssociationPlaceholder />
        </div>
      )}
    </div>
  )
}

export default ObjectAssociation

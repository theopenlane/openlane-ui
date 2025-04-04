'use client'

import { useCallback, useEffect, useState } from 'react'
import { Label } from '@repo/ui/label'
import { Input } from '@repo/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { AllObjectQueriesData, OBJECT_QUERY_CONFIG, ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config'
import { useQuery } from '@tanstack/react-query'
import debounce from 'lodash.debounce'
import EvidenceObjectAssociationTable from '@/components/pages/protected/evidence/object-association/evidence-object-association-table'
import ObjectAssociationPlaceholder from '@/components/shared/object-association/object-association-placeholder'
import { UseFormReturn } from 'react-hook-form'
import { CreateEvidenceFormData } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'

type Props = {
  form?: UseFormReturn<CreateEvidenceFormData>
  onIdChange: (objectsWithIds: { inputName: string; objectIds: string[] }[]) => void
}

const ObjectAssociation: React.FC<Props> = ({ form, onIdChange }) => {
  const { client } = useGraphQLClient()
  const [selectedObject, setSelectedObject] = useState<ObjectTypeObjects | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [debouncedSearchValue, setDebouncedSearchValue] = useState('')
  const [formData, setFormData] = useState<any[]>([])

  const debouncedSetSearchValue = useCallback(
    debounce((value) => setDebouncedSearchValue(value), 300),
    [],
  )

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
    queryKey: ['evidenceFilter', whereFilter],
    queryFn: async () => client.request(selectedQuery, { where: whereFilter }),
    enabled: !!selectedQuery,
  })

  useEffect(() => {
    if (objectKey && data) {
      const updatedData =
        data[objectKey]?.edges?.map((item: any) => ({
          id: item?.node?.id || '',
          name: item?.node?.[objectName] || '',
          description: item?.node?.description || '',
          inputName: inputName || '',
        })) || []
      setFormData(updatedData)
    }
  }, [data, objectKey])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchValue(value)
    debouncedSetSearchValue(value)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 items-center">
        <div className="flex flex-col gap-2">
          <Label>Object Type</Label>
          <Select onValueChange={(val: ObjectTypeObjects) => setSelectedObject(val)}>
            <SelectTrigger className="w-full">{selectedObject || 'Select object'}</SelectTrigger>
            <SelectContent>
              {Object.values(ObjectTypeObjects).map((option) => (
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
        <EvidenceObjectAssociationTable data={formData} onEvidenceObjectIdsChange={onIdChange} form={form} />
      ) : (
        <div className="flex items-center justify-center w-full">
          <ObjectAssociationPlaceholder />
        </div>
      )}
    </div>
  )
}

export default ObjectAssociation

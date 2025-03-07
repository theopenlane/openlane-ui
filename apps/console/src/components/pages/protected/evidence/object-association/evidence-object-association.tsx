'use client'
import { Panel, PanelHeader } from '@repo/ui/panel'
import React, { useCallback, useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { Label } from '@repo/ui/label'
import { Input } from '@repo/ui/input'
import debounce from 'lodash.debounce'
import EvidenceObjectAssociationTable from '@/components/pages/protected/evidence/object-association/evidence-object-association-table'
import { AllEvidenceQueriesData, EVIDENCE_OBJECT_CONFIG, EvidenceObjects } from '@/components/pages/protected/evidence/util/evidence'
import { GET_ALL_RISKS } from '@repo/codegen/query/risks'
import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { TFormDataResponse } from '@/components/pages/protected/evidence/object-association/types/TFormDataResponse'
import { TEvidenceObjectIds } from '@/components/pages/protected/evidence/object-association/types/TEvidenceObjectIds'

type TProps = {
  onEvidenceObjectIdsChange: (evidenceObjectiveIDs: TEvidenceObjectIds[]) => void
  resetObjectAssociation: boolean
  setResetObjectAssociation: () => void
}

const EvidenceObjectAssociation: React.FC<TProps> = (props: TProps) => {
  const { client } = useGraphQLClient()
  const [selectedObject, setSelectedObject] = useState<EvidenceObjects | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [formData, setFormData] = useState<TFormDataResponse[]>([])
  const options = Object.values(EvidenceObjects)
  const [debouncedSearchValue, setDebouncedSearchValue] = useState('')
  const debouncedSetSearchValue = useCallback(
    debounce((value) => setDebouncedSearchValue(value), 300),
    [],
  )
  const selectedConfig = selectedObject ? EVIDENCE_OBJECT_CONFIG[selectedObject] : null
  const selectedQuery = selectedConfig?.queryDocument
  const objectKey = selectedConfig?.responseObjectKey
  const inputName = selectedConfig?.inputName
  const inputPlaceholder = selectedConfig?.placeholder
  const searchAttribute = selectedConfig?.searchAttribute
  const objectName = selectedConfig?.objectName!

  const whereFilter = {
    ...(searchAttribute ? { [searchAttribute]: debouncedSearchValue } : {}),
  }

  const { data } = useQuery<AllEvidenceQueriesData>({
    queryKey: ['evidenceFilter', whereFilter],
    queryFn: async () => client.request(selectedQuery || GET_ALL_RISKS, { where: whereFilter }),
    enabled: !!selectedQuery,
  })

  useEffect(() => {
    if (objectKey && data) {
      const updatedData =
        data[objectKey]?.edges?.map((item: any) => {
          return {
            id: item?.node?.id || '',
            name: item?.node[objectName] || '',
            description: item?.node?.description || '',
            inputName: inputName || '',
          }
        }) || []

      setFormData(updatedData)
    }
  }, [data!!, objectKey])

  useEffect(() => {
    if (props.resetObjectAssociation) {
      resetState()
      props.setResetObjectAssociation()
      setFormData([])
    }
  }, [props.resetObjectAssociation])

  useEffect(() => {
    resetState()
  }, [selectedObject])

  const resetState = () => {
    setSearchValue('')
    setDebouncedSearchValue('')
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSetSearchValue(event.target.value)
    setSearchValue(event.target.value)
  }

  const handleEvidenceObjectIdsChange = (evidenceObjectIds: TEvidenceObjectIds[]) => {
    props.onEvidenceObjectIdsChange(evidenceObjectIds)
  }

  return (
    <Panel>
      <PanelHeader heading="Object association" noBorder />
      <div className="grid grid-cols-2 gap-4 items-center">
        <div className="flex flex-col gap-2">
          <Label>Select Object</Label>
          <Select
            onValueChange={(val: EvidenceObjects) => {
              setSelectedObject(val)
            }}
          >
            <SelectTrigger className=" w-full">{selectedObject || 'Select object'}</SelectTrigger>
            <SelectContent>
              {options.map((option) => (
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
      <EvidenceObjectAssociationTable data={formData} onEvidenceObjectIdsChange={handleEvidenceObjectIdsChange} />
    </Panel>
  )
}

export default EvidenceObjectAssociation

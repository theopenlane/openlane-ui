'use client'
import { Panel, PanelHeader } from '@repo/ui/panel'
import React, { Fragment, useCallback, useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { Label } from '@repo/ui/label'
import { Input } from '@repo/ui/input'
import debounce from 'lodash.debounce'
import EvidenceObjectAssociationTable from '@/components/pages/protected/evidence/object-association/evidence-object-association-table'
import { AllEvidenceQueriesData, EVIDENCE_OBJECT_CONFIG, EvidenceObjects } from '@/components/pages/protected/evidence/util/evidence'
import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { TFormDataResponse } from '@/components/pages/protected/evidence/object-association/types/TFormDataResponse'
import { TEvidenceObjectTypes } from '@/components/pages/protected/evidence/object-association/types/TEvidenceObjectTypes.ts'
import { UseFormReturn } from 'react-hook-form'
import { CreateEvidenceFormData } from '@/components/pages/protected/evidence/hooks/use-form-schema.ts'
import { ChevronDown } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { Badge } from '@repo/ui/badge'
import ObjectAssociationPlaceholder from '@/components/shared/object-association/object-association-placeholder.tsx'

type TProps = {
  onEvidenceObjectIdsChange: (evidenceObjectiveIDs: TEvidenceObjectTypes[]) => void
  resetObjectAssociation: boolean
  setResetObjectAssociation: () => void
  form?: UseFormReturn<CreateEvidenceFormData>
  preselectedObjectDisplayIDs?: string[]
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
    queryFn: async () => client.request(selectedQuery, { where: whereFilter }),
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

  const handleEvidenceObjectIdsChange = (evidenceObjectIds: TEvidenceObjectTypes[]) => {
    props.onEvidenceObjectIdsChange(evidenceObjectIds)
  }

  return (
    <Panel>
      <PanelHeader heading="Object association" noBorder />
      {props?.form && (
        <Card className="p-4 flex gap-3 bg-note">
          <div>
            <p className="font-semibold">Heads up!</p>
            <p className="text-sm ">This requested evidence you are submitting will also be used by other tasks, controls. We have pre-selected the object association below.</p>
            <div className="w-3/5 pt-3">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="objects">
                  <AccordionTrigger className="py-2 w-full flex justify-between items-center gap-2 group border p-3 bg-background-secondary">
                    <span className="text-sm">Show objects linked to this evidence</span>
                    <ChevronDown className="h-4 w-4 group-data-[state=open]:rotate-180" />
                  </AccordionTrigger>
                  <AccordionContent className="my-3">
                    {props.preselectedObjectDisplayIDs &&
                      props.preselectedObjectDisplayIDs.map((item, index) => (
                        <Fragment key={index}>
                          {item && (
                            <Badge className="bg-background-secondary mr-1" variant="outline">
                              {item}
                            </Badge>
                          )}
                        </Fragment>
                      ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </Card>
      )}
      <div className="grid grid-cols-2 gap-4 items-center">
        <div className="flex flex-col gap-2">
          <Label>Object Type</Label>
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
      {selectedObject && <EvidenceObjectAssociationTable data={formData} onEvidenceObjectIdsChange={handleEvidenceObjectIdsChange} form={props?.form} />}
      {!selectedObject && (
        <div className="flex items-center justify-center w-full">
          <ObjectAssociationPlaceholder />
        </div>
      )}
    </Panel>
  )
}

export default EvidenceObjectAssociation

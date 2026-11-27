'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import ControlObjectiveDetailsSheet from '@/components/pages/protected/controls/tabs/implementation/control-objectives-components/control-objective-details-sheet'
import ControlImplementationDetailsSheet from '@/components/pages/protected/controls/tabs/implementation/control-implementation-components/control-implementation-details-sheet'
import { Label } from '@repo/ui/label'
import { Input } from '@repo/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { getSearchPlaceholder, OBJECT_QUERY_CONFIG, ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import ObjectAssociationTable from '@/components/shared/object-association/object-association-table'
import ObjectAssociationPlaceholder from '@/components/shared/object-association/object-association-placeholder'
import { useAssociationRows } from '@/components/shared/object-association/use-association-rows'
import { type TObjectAssociationMap } from './types/TObjectAssociationMap'
import { useDebounce } from '@uidotdev/usehooks'
import Pagination from '@repo/ui/pagination'
import { useModuleAccess } from '@/lib/subscription-plan/hooks/use-module-access'

type Props = {
  onIdChange: (updatedMap: TObjectAssociationMap, refCodes: Partial<Record<string, string[]>>) => void
  allowedObjectTypes?: readonly ObjectTypeObjects[]
  initialData?: TObjectAssociationMap
  refCodeInitialData?: TObjectAssociationMap
  defaultSelectedObject?: ObjectTypeObjects
}

const ObjectAssociation = ({ onIdChange, allowedObjectTypes, initialData, refCodeInitialData, defaultSelectedObject }: Props) => {
  const { hasObjectType } = useModuleAccess()
  const objectTypeLabelId = useId()
  const [selectedObject, setSelectedObject] = useState<ObjectTypeObjects | null>(defaultSelectedObject || null)
  const [searchValue, setSearchValue] = useState('')
  const debouncedSearchValue = useDebounce(searchValue, 300)
  const [activeSheet, setActiveSheet] = useState<{ id: string; type: ObjectTypeObjects } | null>(null)

  const selectableObjectTypes = useMemo(
    () => Object.values(ObjectTypeObjects).filter((option) => (!allowedObjectTypes || allowedObjectTypes.includes(option)) && hasObjectType(OBJECT_QUERY_CONFIG[option].objectType)),
    [allowedObjectTypes, hasObjectType],
  )

  const isSelectedObjectAllowed = !!selectedObject && selectableObjectTypes.includes(selectedObject)
  const activeObject = isSelectedObjectAllowed ? selectedObject : null
  const linkedIds = activeObject ? (initialData?.[OBJECT_QUERY_CONFIG[activeObject].inputName] ?? []) : []

  const { rows, isLoading, pagination, totalPages, handlePageChange, handlePageSizeChange } = useAssociationRows({
    objectType: activeObject,
    search: debouncedSearchValue,
    linkedIds,
    pageSize: 5,
  })

  useEffect(() => {
    if (selectedObject && !isSelectedObjectAllowed) {
      setSelectedObject(null)
    }
  }, [selectedObject, isSelectedObjectAllowed])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value)
  }

  const opensDetailsSheet = selectedObject === ObjectTypeObjects.CONTROL_OBJECTIVE || selectedObject === ObjectTypeObjects.CONTROL_IMPLEMENTATION
  const handleRowClick = opensDetailsSheet && selectedObject ? (id: string) => setActiveSheet({ id, type: selectedObject }) : undefined

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 items-center">
        <div className="flex flex-col gap-2">
          <Label id={objectTypeLabelId}>Object Type</Label>
          <Select
            onValueChange={(val: ObjectTypeObjects) => {
              setSelectedObject(val)
              setSearchValue('')
            }}
          >
            <SelectTrigger className="w-full" aria-labelledby={objectTypeLabelId}>
              {isSelectedObjectAllowed ? selectedObject : 'Select object'}
            </SelectTrigger>
            <SelectContent>
              {selectableObjectTypes.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">No object types available in your plan</div>
              ) : (
                selectableObjectTypes.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Search</Label>
          <Input
            disabled={!activeObject}
            onChange={handleSearchChange}
            value={searchValue}
            placeholder={activeObject ? getSearchPlaceholder(activeObject) : 'Select object first'}
            className="h-10 w-full"
          />
        </div>
      </div>
      {isSelectedObjectAllowed ? (
        <>
          <ObjectAssociationTable isLoading={isLoading} data={rows} onIDsChange={onIdChange} initialData={initialData} refCodeInitialData={refCodeInitialData} onRowClick={handleRowClick} />
          <Pagination currentPage={pagination.page} totalPages={totalPages} pageSize={pagination.pageSize} onPageChange={handlePageChange} onPageSizeChange={handlePageSizeChange} />
        </>
      ) : (
        <div className="flex items-center justify-center w-full">
          <ObjectAssociationPlaceholder />
        </div>
      )}
      {activeSheet?.type === ObjectTypeObjects.CONTROL_OBJECTIVE && <ControlObjectiveDetailsSheet entityId={activeSheet.id} onClose={() => setActiveSheet(null)} />}
      {activeSheet?.type === ObjectTypeObjects.CONTROL_IMPLEMENTATION && <ControlImplementationDetailsSheet entityId={activeSheet.id} onClose={() => setActiveSheet(null)} />}
    </div>
  )
}

export default ObjectAssociation

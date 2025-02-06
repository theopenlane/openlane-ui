'use client'
import React, { useCallback, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Plus } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { Input } from '@repo/ui/input'
import { Checkbox } from '@repo/ui/checkbox'
import { useToast } from '@repo/ui/use-toast'
import { Label } from '@repo/ui/label'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/table-core'
import { useMyGroupsStore } from '@/hooks/useMyGroupsStore'
import {
  GetAllControlObjectivesDocument,
  GetAllControlsDocument,
  GetAllInternalPoliciesDocument,
  GetAllNarrativesDocument,
  GetAllProceduresDocument,
  GetAllProgramsDocument,
  GetAllRisksDocument,
  useGetGroupDetailsQuery,
  useUpdateGroupMutation,
} from '@repo/codegen/src/schema'
import debounce from 'lodash.debounce'
import { useQuery } from 'urql'

enum ObjectTypes {
  PROGRAM = 'Program',
  RISK = 'Risk',
  CONTROL = 'Control',
  CONTROL_OBJECTIVE = 'Control Objective',
  NARRATIVE = 'Narrative',
  INTERNAL_POLICY = 'Internal Policy',
  PROCEDURE = 'Procedure',
}

type TableDataItem = {
  id: string
  name: string
  checked: boolean
  togglePermission: (id: string) => void
  displayID: string
}

const OBJECT_TYPE_CONFIG: Record<ObjectTypes, { roleOptions: string[]; responseObjectKey: string; queryDocument: any }> = {
  [ObjectTypes.PROGRAM]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'programs',
    queryDocument: GetAllProgramsDocument,
  },
  [ObjectTypes.RISK]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'risks',
    queryDocument: GetAllRisksDocument,
  },
  [ObjectTypes.CONTROL]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'controls',
    queryDocument: GetAllControlsDocument,
  },
  [ObjectTypes.CONTROL_OBJECTIVE]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'controlObjectives',
    queryDocument: GetAllControlObjectivesDocument,
  },
  [ObjectTypes.NARRATIVE]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'narratives',
    queryDocument: GetAllNarrativesDocument,
  },
  [ObjectTypes.INTERNAL_POLICY]: {
    roleOptions: ['Edit', 'Blocked'],
    responseObjectKey: 'internalPolicies',
    queryDocument: GetAllInternalPoliciesDocument,
  },
  [ObjectTypes.PROCEDURE]: {
    roleOptions: ['Edit', 'Blocked'],
    responseObjectKey: 'procedures',
    queryDocument: GetAllProceduresDocument,
  },
}

const generateWhere = ({
  debouncedSearchValue,
  selectedGroup,
  selectedObject,
}: {
  debouncedSearchValue: string
  selectedGroup: string | null
  selectedObject: ObjectTypes | null
}): { where: Record<string, any> } => {
  const baseWhere = {
    nameContainsFold: debouncedSearchValue,
  }

  const exclusionFilter = {
    not: {
      or: [{ hasEditorsWith: [{ id: selectedGroup }] }, { hasViewersWith: [{ id: selectedGroup }] }, { hasBlockedGroupsWith: [{ id: selectedGroup }] }],
    },
  }

  const objectsWithoutViewers: ObjectTypes[] = [ObjectTypes.PROCEDURE, ObjectTypes.INTERNAL_POLICY]

  return {
    where: {
      and: objectsWithoutViewers.includes(selectedObject as ObjectTypes)
        ? [
            baseWhere,
            { not: { or: [{ hasEditorsWith: [{ id: selectedGroup }] }, { hasBlockedGroupsWith: [{ id: selectedGroup }] }] } }, // Excludes `hasViewersWith`
          ]
        : [baseWhere, exclusionFilter],
    },
  }
}

const options = Object.values(ObjectTypes)

const AssignPermissionsDialog = () => {
  const { selectedGroup } = useMyGroupsStore()
  const [{ data: groupData }] = useGetGroupDetailsQuery({ variables: { groupId: selectedGroup || '' }, pause: !selectedGroup })
  const { isManaged } = groupData?.group || {}

  const [isOpen, setIsOpen] = useState(false)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [selectedObject, setSelectedObject] = useState<ObjectTypes | null>(null)
  const [roles, setRoles] = useState<Record<string, string>>({}) // {01JK9CJCC4YJQ2SBTXXMZG45H0: 'View'} example data
  const [searchValue, setSearchValue] = useState('')
  const [debouncedSearchValue, setDebouncedSearchValue] = useState('')
  const debouncedSetSearchValue = useCallback(
    debounce((value) => setDebouncedSearchValue(value), 300),
    [],
  )

  const [{}, updateGroup] = useUpdateGroupMutation()

  const selectedQuery = selectedObject && OBJECT_TYPE_CONFIG[selectedObject].queryDocument

  const [{ data, fetching, error }] = useQuery({
    query: selectedQuery || GetAllRisksDocument,
    variables: generateWhere({
      debouncedSearchValue,
      selectedGroup,
      selectedObject,
    }),
    pause: !selectedQuery,
  })
  const handleNext = () => setStep(2)
  const handleBack = () => setStep(1)

  const togglePermission = (id: string) => {
    setSelectedPermissions((prev) => (prev.includes(id) ? prev.filter((perm) => perm !== id) : [...prev, id]))
  }

  const handleRoleChange = (id: string, role: string) => {
    setRoles((prev) => ({ ...prev, [id]: role }))
  }

  const handleSave = async () => {
    if (!selectedGroup || !selectedObject) return

    // Initialize a map to store the permission arrays
    const permissionMap: Record<string, string[]> = {
      addProgramViewerIDs: [],
      addProgramEditorIDs: [],
      addProgramBlockedGroupIDs: [],
      addRiskViewerIDs: [],
      addRiskEditorIDs: [],
      addRiskBlockedGroupIDs: [],
      addControlViewerIDs: [],
      addControlEditorIDs: [],
      addControlBlockedGroupIDs: [],
      addNarrativeViewerIDs: [],
      addNarrativeEditorIDs: [],
      addNarrativeBlockedGroupIDs: [],
      addControlObjectiveViewerIDs: [],
      addControlObjectiveEditorIDs: [],
      addControlObjectiveBlockedGroupIDs: [],
    }

    const prefix = selectedObject.replace(/\s+/g, '') // Remove spaces for the prefix

    selectedPermissions.forEach((id) => {
      const role = roles[id] || 'Edit'

      const suffix = role === 'View' ? 'ViewerIDs' : role === 'Edit' ? 'EditorIDs' : 'BlockedGroupIDs'

      const key = `add${prefix}${suffix}`

      if (permissionMap[key]) {
        permissionMap[key].push(id)
      }
    })

    const cleanedPermissionMap = Object.fromEntries(Object.entries(permissionMap).filter(([_, value]) => value.length > 0))

    try {
      await updateGroup({
        updateGroupId: selectedGroup,
        input: cleanedPermissionMap,
      })

      toast({
        title: 'Permissions updated successfully',
        variant: 'success',
      })

      handleOpenChange(false)
    } catch (error) {
      console.error('Failed to update group:', error)
      toast({
        title: 'Failed to update permissions',
        description: 'Something went wrong',
        variant: 'destructive',
      })
    }
  }

  const objectKey = selectedObject ? OBJECT_TYPE_CONFIG[selectedObject]?.responseObjectKey : null
  const objectDataList = objectKey && data?.[objectKey]?.edges ? data[objectKey].edges : []

  const tableData: TableDataItem[] =
    objectDataList.map((item: any) => ({
      id: item?.node?.id,
      name: item?.node?.name,
      checked: selectedPermissions.includes(item?.node?.id || ''),
      togglePermission,
      displayID: item?.node?.displayID || '',
    })) || []

  const step2Data = selectedPermissions.map((id) => {
    const program = tableData.find((p: any) => p.id === id)
    return {
      id,
      name: program?.name || 'Unknown',
      permission: roles[id] || 'View',
    }
  })

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSetSearchValue(event.target.value)
    setSearchValue(event.target.value)
  }

  const columnsStep2: ColumnDef<{ id: string; name: string; permission: string }>[] = [
    {
      header: 'Program',
      accessorKey: 'name',
    },
    {
      header: 'Role',
      accessorKey: 'permission',
      cell: ({ row }) => (
        <Select onValueChange={(value) => handleRoleChange(row.original.id, value)}>
          <SelectTrigger className="w-full">{row.original.permission}</SelectTrigger>
          <SelectContent>
            {selectedObject &&
              OBJECT_TYPE_CONFIG[selectedObject].roleOptions.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      ),
    },
  ]

  const resetStates = () => {
    setTimeout(() => {
      setSelectedPermissions([])
      setStep(1)
      setSelectedObject(null)
      setRoles({})
      setDebouncedSearchValue('')
    }, 300)
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      resetStates()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" icon={<Plus />} iconPosition="left" disabled={!!isManaged}>
          Assign permissions to group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Assign permissions</DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <>
            <div className="flex items-center gap-2.5">
              <div className="flex gap-2 flex-col">
                <Label>Select Object</Label>
                <Select
                  onValueChange={(val: ObjectTypes) => {
                    setSelectedObject(val)
                    setSearchValue('')
                  }}
                >
                  <SelectTrigger className="border-brand w-[150px]">{selectedObject || 'Select object'}</SelectTrigger>
                  <SelectContent>
                    {options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedObject && (
                <div className="flex gap-2 flex-col">
                  <Label>Search</Label>
                  <Input onChange={handleSearchChange} value={searchValue} placeholder="Type program name ..." className="border-brand h-10 w-[200px]" />
                </div>
              )}
            </div>

            {selectedObject && (
              <DataTable
                columns={[
                  {
                    header: '',
                    accessorKey: 'checked',
                    cell: ({ row }) => <Checkbox checked={row.original.checked} onCheckedChange={() => row.original.togglePermission(row.original.id || '')} />,
                  },
                  {
                    header: 'Display ID',
                    accessorKey: 'displayID',
                  },
                  {
                    header: 'Name',
                    accessorKey: 'name',
                  },
                ]}
                data={tableData}
              />
            )}

            <DialogFooter className="flex justify-start pt-4">
              <Button className="w-[180px]" onClick={handleNext} disabled={selectedPermissions.length === 0}>
                Next ({selectedPermissions.length})
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <p>You are about to add {selectedPermissions.length} relationship(s) to the group.</p>
            <DataTable columns={columnsStep2} data={step2Data} />
            <DialogFooter className="flex justify-between pt-4">
              <Button onClick={handleBack}>Back</Button>
              <Button className="w-[180px]" onClick={handleSave}>
                Add relationship ({selectedPermissions.length})
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default AssignPermissionsDialog

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
import { useGetAllProgramsQuery, useGetGroupDetailsQuery, useUpdateGroupMutation } from '@repo/codegen/src/schema'
import debounce from 'lodash.debounce'

const options = ['Program', 'Risk', 'Control', 'Control Objective', 'Narrative']

const roleOptions = ['View', 'Edit', 'Blocked']

const AssignPermissionsDialog = () => {
  const { selectedGroup } = useMyGroupsStore()
  const [{ data }] = useGetGroupDetailsQuery({ variables: { groupId: selectedGroup || '' }, pause: !selectedGroup })
  const { isManaged } = data?.group || {}

  const [searchValue, setSearchValue] = useState('')
  const [debouncedSearchValue, setDebouncedSearchValue] = useState('')

  const debouncedSetSearchValue = useCallback(
    debounce((value) => setDebouncedSearchValue(value), 300),
    [],
  )

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value)
    debouncedSetSearchValue(event.target.value)
  }

  const where = {
    where: {
      and: [
        { nameContainsFold: debouncedSearchValue },
        {
          not: {
            or: [{ hasEditorsWith: [{ id: selectedGroup }] }, { hasViewersWith: [{ id: selectedGroup }] }, { hasBlockedGroupsWith: [{ id: selectedGroup }] }],
          },
        },
      ],
    },
  }

  const [{ data: programsData }] = useGetAllProgramsQuery({ variables: where })

  const [isOpen, setIsOpen] = useState(false)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [selectedObject, setSelectedObject] = useState<string | null>(null)
  const [roles, setRoles] = useState<Record<string, string>>({}) // Store selected role per program

  const [{}, updateGroup] = useUpdateGroupMutation()

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

    // Initialize empty arrays for each permission type
    const addProgramViewerIDs: string[] = []
    const addProgramEditorIDs: string[] = []
    const addProgramBlockedGroupIDs: string[] = []
    const addRiskViewerIDs: string[] = []
    const addRiskEditorIDs: string[] = []
    const addRiskBlockedGroupIDs: string[] = []
    const addControlViewerIDs: string[] = []
    const addControlEditorIDs: string[] = []
    const addControlBlockedGroupIDs: string[] = []
    const addNarrativeViewerIDs: string[] = []
    const addNarrativeEditorIDs: string[] = []
    const addNarrativeBlockedGroupIDs: string[] = []
    const addControlObjectiveViewerIDs: string[] = []
    const addControlObjectiveEditorIDs: string[] = []
    const addControlObjectiveBlockedGroupIDs: string[] = []

    // Assign permissions based on the selected object type
    selectedPermissions.forEach((id) => {
      const role = roles[id] || 'View' // Default to 'View'

      if (selectedObject === 'Program') {
        if (role === 'View') addProgramViewerIDs.push(id)
        else if (role === 'Edit') addProgramEditorIDs.push(id)
        else if (role === 'Blocked') addProgramBlockedGroupIDs.push(id)
      } else if (selectedObject === 'Risk') {
        if (role === 'View') addRiskViewerIDs.push(id)
        else if (role === 'Edit') addRiskEditorIDs.push(id)
        else if (role === 'Blocked') addRiskBlockedGroupIDs.push(id)
      } else if (selectedObject === 'Control') {
        if (role === 'View') addControlViewerIDs.push(id)
        else if (role === 'Edit') addControlEditorIDs.push(id)
        else if (role === 'Blocked') addControlBlockedGroupIDs.push(id)
      } else if (selectedObject === 'Narrative') {
        if (role === 'View') addNarrativeViewerIDs.push(id)
        else if (role === 'Edit') addNarrativeEditorIDs.push(id)
        else if (role === 'Blocked') addNarrativeBlockedGroupIDs.push(id)
      } else if (selectedObject === 'Control Objective') {
        if (role === 'View') addControlObjectiveViewerIDs.push(id)
        else if (role === 'Edit') addControlObjectiveEditorIDs.push(id)
        else if (role === 'Blocked') addControlObjectiveBlockedGroupIDs.push(id)
      }
    })

    try {
      await updateGroup({
        updateGroupId: selectedGroup,
        input: {
          addProgramViewerIDs,
          addProgramEditorIDs,
          addProgramBlockedGroupIDs,
          addRiskViewerIDs,
          addRiskEditorIDs,
          addRiskBlockedGroupIDs,
          addControlViewerIDs,
          addControlEditorIDs,
          addControlBlockedGroupIDs,
          addNarrativeViewerIDs,
          addNarrativeEditorIDs,
          addNarrativeBlockedGroupIDs,
          addControlObjectiveViewerIDs,
          addControlObjectiveEditorIDs,
          addControlObjectiveBlockedGroupIDs,
        },
      })

      toast({
        title: 'Permissions updated successfully',
        variant: 'success',
      })

      setIsOpen(false)
    } catch (error) {
      console.error('Failed to update group:', error)
      toast({
        title: 'Failed to update permissions',
        description: 'Something went wrong',
        variant: 'destructive',
      })
    }
  }

  const programsTableData =
    programsData?.programs?.edges?.map((program) => ({
      id: program?.node?.id,
      name: program?.node?.name,
      checked: selectedPermissions.includes(program?.node?.id || ''),
      togglePermission,
      displayID: program?.node?.displayID,
    })) || []

  const step2Data = selectedPermissions.map((id) => {
    const program = programsTableData.find((p) => p.id === id)
    return {
      id,
      name: program?.name || 'Unknown',
      permission: roles[id] || 'View',
    }
  })

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
            {roleOptions.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                <Select onValueChange={setSelectedObject}>
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
              {selectedObject === 'Program' && (
                <div className="flex gap-2 flex-col">
                  <Label>Search</Label>
                  <Input placeholder="Type program name ..." className="border-brand h-10 w-[200px]" />
                </div>
              )}
            </div>

            {selectedObject === 'Program' && (
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
                data={programsTableData}
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

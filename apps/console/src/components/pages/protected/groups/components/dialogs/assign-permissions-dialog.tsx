'use client'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Plus } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/table-core'
import { useGroupsStore } from '@/hooks/useGroupsStore'
import { AllQueriesData, generateColumns, generateGroupsPermissionsWhere, OBJECT_TYPE_CONFIG, ObjectTypes, TableDataItem } from '@/constants/groups'
import { useUpdateGroup } from '@/lib/graphql-hooks/groups'
import { useQuery } from '@tanstack/react-query'
import { GET_ALL_RISKS } from '@repo/codegen/query/risks'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { useNotification } from '@/hooks/useNotification'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'

const options = Object.values(ObjectTypes)

const defaultPagination = {
  ...DEFAULT_PAGINATION,
  pageSize: 5,
  query: { first: 5 },
}

const AssignPermissionsDialog = () => {
  const { selectedGroup } = useGroupsStore()
  const { queryClient, client } = useGraphQLClient()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPermissions, setSelectedPermissions] = useState<{ name: string; id: string }[]>([])
  const { successNotification, errorNotification } = useNotification()
  const [step, setStep] = useState(1)
  const [selectedObject, setSelectedObject] = useState<ObjectTypes | null>(null)
  const [roles, setRoles] = useState<Record<string, string>>({})
  const [searchValue, setSearchValue] = useState('')
  const [debouncedSearchValue, setDebouncedSearchValue] = useState('')
  const [pagination, setPagination] = useState<TPagination>(defaultPagination)

  const { mutateAsync: updateGroup } = useUpdateGroup()

  const selectedConfig = selectedObject ? OBJECT_TYPE_CONFIG[selectedObject] : null
  const selectedQuery = selectedConfig?.queryDocument

  const objectName = selectedConfig?.objectName!

  const objectKey = selectedObject ? OBJECT_TYPE_CONFIG[selectedObject]?.responseObjectKey : null
  const where = generateGroupsPermissionsWhere({
    debouncedSearchValue,
    selectedGroup,
    selectedObject,
  })
  const { data, isLoading } = useQuery<AllQueriesData>({
    queryKey: [objectKey, 'group-permissions', where, pagination.page, pagination.pageSize],
    queryFn: () => client.request(selectedQuery || GET_ALL_RISKS, { ...where, ...pagination.query }),
    enabled: !!selectedQuery,
  })

  const pageInfo = objectKey ? data?.[objectKey]?.pageInfo : undefined
  const totalCount = objectKey ? data?.[objectKey]?.totalCount : undefined

  const objectDataList = useMemo(() => {
    return objectKey && data?.[objectKey]?.edges ? data[objectKey].edges : []
  }, [data, objectKey])

  const togglePermission = useCallback((obj: TableDataItem) => {
    setSelectedPermissions((prev) => {
      const exists = prev.some((perm) => perm.id === obj.id)
      if (exists) {
        return prev.filter((perm) => perm.id !== obj.id)
      } else {
        return [...prev, { id: obj.id, name: obj.name }]
      }
    })
  }, [])

  const tableData: TableDataItem[] = useMemo(() => {
    return (
      objectDataList?.map((item: any) => ({
        id: item?.node?.id,
        name: item?.node?.[objectName] || '',
        checked: selectedPermissions.some((perm) => perm.id === item?.node?.id),
        togglePermission,
        referenceFramework: item?.node?.referenceFramework || '',
      })) || []
    )
  }, [objectDataList, selectedPermissions, togglePermission, objectName])

  const columns = useMemo(() => generateColumns(selectedObject), [selectedObject])

  const step2Data = selectedPermissions.map((obj) => {
    // const program = tableData.find((p: any) => p.id === obj.id)
    return {
      id: obj.id,
      name: obj.name,
      permission: roles[obj.id] || 'View',
    }
  })

  const handleNext = () => setStep(2)
  const handleBack = () => setStep(1)

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
      addInternalPolicyEditorIDs: [],
      addInternalPolicyBlockedGroupIDs: [],
      addProcedureEditorIDs: [],
      addProcedureBlockedGroupIDs: [],
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

    const prefix = selectedObject.replace(/\s+/g, '')

    selectedPermissions.forEach((obj) => {
      const id = obj.id
      const role = roles[id] || 'View'

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
      queryClient.invalidateQueries({
        predicate: (query) => {
          const qk = query.queryKey
          return (qk.length === 1 && qk[0] === 'groups') || (qk.length > 1 && qk[0] === 'group' && qk[1] === selectedGroup)
        },
      })

      successNotification({
        title: 'Permissions updated successfully',
      })

      handleOpenChange(false)
    } catch (error) {
      console.error('Failed to update group:', error)
      errorNotification({
        title: 'Failed to update permissions',
        description: 'Something went wrong',
      })
    }
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value)
  }

  const columnsStep2: ColumnDef<{ id: string; name: string; permission: string }>[] = [
    {
      header: 'Name',
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

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchValue(searchValue)
      setPagination(defaultPagination)
    }, 300)

    return () => {
      clearTimeout(handler)
    }
  }, [searchValue])

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" icon={<Plus />} iconPosition="left">
          Assign permissions to group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px]">
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
                    setPagination(defaultPagination)
                    setDebouncedSearchValue('')
                  }}
                >
                  <SelectTrigger className="w-[180px]">{selectedObject || 'Select object'}</SelectTrigger>
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
                  <Input onChange={handleSearchChange} value={searchValue} placeholder="Type program name ..." className="h-10 w-[200px]" />
                </div>
              )}
            </div>

            {selectedObject && <DataTable columns={columns} data={tableData} onPaginationChange={setPagination} pagination={pagination} paginationMeta={{ totalCount, pageInfo, isLoading }} />}

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

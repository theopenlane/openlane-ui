'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { Label } from '@repo/ui/label'
import { ChevronDown, ChevronUp, Copy } from 'lucide-react'
import { DataTable } from '@repo/ui/data-table'
import { Input } from '@repo/ui/input'
import { useGroupsStore } from '@/hooks/useGroupsStore'
import { useGetAllGroups, useGetGroupDetails, useGetGroupPermissions, useUpdateGroup } from '@/lib/graphql-hooks/group'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/hooks/useNotification'
import { canEdit } from '@/lib/authz/utils'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { Permission } from '@repo/codegen/src/schema'
import { TableKeyEnum } from '@repo/ui/table-key'
import { ObjectTypes } from '@repo/codegen/src/type-names'

const PERMISSION_LABELS: Record<Permission, string> = {
  [Permission.VIEWER]: 'View',
  [Permission.EDITOR]: 'Edit',
  [Permission.BLOCKED]: 'Blocked',
  [Permission.CREATOR]: 'Create',
}

const columns = [
  { accessorKey: 'object', header: 'Name' },
  { accessorKey: 'type', header: 'Object Type' },
  { accessorKey: 'permission', header: 'Permission' },
]

const InheritPermissionDialog = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [group, setGroup] = useState('')
  const [step, setStep] = useState(1)
  const [isExpanded, setIsExpanded] = useState(false)
  const { errorNotification, successNotification } = useNotification()
  const { selectedGroup } = useGroupsStore()
  const { data: permission } = useAccountRoles(ObjectTypes.GROUP, selectedGroup)
  const queryClient = useQueryClient()

  const { data } = useGetGroupDetails(selectedGroup)
  const { isManaged } = data?.group || {}
  const { data: permissionsResponse } = useGetGroupPermissions(group || null)

  const where = selectedGroup ? { idNEQ: selectedGroup } : undefined
  const { data: TableData } = useGetAllGroups({ where })

  const { mutateAsync: updateGroup } = useUpdateGroup()

  const inheritPermissions = async () => {
    if (!selectedGroup) {
      errorNotification({
        title: 'Error',
        description: 'No selected group found.',
      })
      return
    }

    try {
      await updateGroup({
        updateGroupId: selectedGroup,
        input: {
          inheritGroupPermissions: group,
        },
      })

      queryClient.invalidateQueries({ queryKey: ['groups', selectedGroup] })

      successNotification({
        description: `Permissions successfully inherited from ${groups.find((g) => g.id === group)?.name || 'selected group'}.`,
      })

      setIsOpen(false)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const groups =
    TableData?.groups?.edges?.map((edge) => ({
      id: edge?.node?.id,
      name: edge?.node?.name,
    })) || []

  const permissionsData =
    permissionsResponse?.group?.permissions?.edges?.map((edge) => ({
      object: edge?.node?.name || 'Unknown',
      type: edge?.node?.objectType || 'Unknown',
      permission: PERMISSION_LABELS[edge?.node?.permissions as Permission] || edge?.node?.permissions || 'Unknown',
    })) || []

  const handleNextStep = () => {
    if (!group) {
      errorNotification({ title: 'Please select a group.' })
      return
    }
    setStep(2)
  }

  const handleBack = () => {
    setStep(1)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" icon={<Copy />} iconPosition="left" disabled={!!isManaged || !canEdit(permission?.roles)}>
          Inherit permission
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Inherit permission</DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <div className="flex flex-col gap-2">
            <Label>Select Group</Label>
            <Select value={group} onValueChange={setGroup}>
              <SelectTrigger className="w-full">{group ? groups.find((g) => g.id === group)?.name : 'Choose...'}</SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id ?? ''}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm ">All permissions and associations will be inherited.</p>
          </div>
        ) : (
          <div>
            <p className="">
              You are about to inherit permission from group <strong>{groups.find((g) => g.id === group)?.name}</strong>. This will give all users in this group access to the same objects as users in
              that group.
            </p>

            <button className="flex items-center  hover:underline my-4" onClick={() => setIsExpanded(!isExpanded)}>
              {'Expand to see permission'}
              {isExpanded ? <ChevronUp className="ml-1" size={16} /> : <ChevronDown className="ml-1" size={16} />}
            </button>

            {isExpanded && (
              <>
                <div className="flex items-center gap-2.5 my-5">
                  <div className="flex gap-2 flex-col">
                    <Label>Select Object</Label>
                    <Select>
                      <SelectTrigger className=" w-[150px]">Control</SelectTrigger>
                      <SelectContent>
                        <SelectItem value="control">Control</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 flex-col">
                    <Label>Search</Label>
                    <Input placeholder="Type object name ..." className=" h-10 w-[200px]" />
                  </div>
                </div>

                <DataTable columns={columns} data={permissionsData} tableKey={TableKeyEnum.GROUP_INHERIT_PERMISSION} />
              </>
            )}
          </div>
        )}

        <DialogFooter className="justify-between">
          {step === 1 ? (
            <Button variant="secondary" className="w-full" onClick={handleNextStep} disabled={!group}>
              Next
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={handleBack}>
                Back
              </Button>
              <Button
                variant="secondary"
                className=""
                onClick={() => {
                  inheritPermissions()
                  setIsOpen(false)
                }}
              >
                Inherit
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default InheritPermissionDialog

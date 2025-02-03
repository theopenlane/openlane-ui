'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { useToast } from '@repo/ui/use-toast'
import { Label } from '@repo/ui/label'
import { Copy, ChevronDown, ChevronUp } from 'lucide-react'
import { useGetAllGroupsQuery } from '@repo/codegen/src/schema'
import { DataTable } from '@repo/ui/data-table'
import { Input } from '@repo/ui/input'
import { useMyGroupsStore } from '@/hooks/useMyGroupsStore'

const columns = [
  { accessorKey: 'object', header: 'Object' },
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'permission', header: 'Permission' },
]

const InheritPermissionDialog = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [group, setGroup] = useState('')
  const [step, setStep] = useState(1)
  const [isExpanded, setIsExpanded] = useState(false)
  const { toast } = useToast()
  const { selectedGroup } = useMyGroupsStore()

  const [{ data: TableData }] = useGetAllGroupsQuery()

  const groups =
    TableData?.groups?.edges?.map((edge) => ({
      id: edge?.node?.id,
      name: edge?.node?.displayName,
    })) || []

  // Replace this with real API data
  const permissionsData = [
    { object: 'CC1.2', type: 'Control', permission: 'Editor' },
    { object: 'CC2.2', type: 'Risk', permission: 'Blocked' },
  ]

  const handleNextStep = () => {
    if (!group) {
      toast({ title: 'Please select a group.', variant: 'destructive' })
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
        <Button variant="outline" icon={<Copy />} iconPosition="left" disabled={selectedGroup?.isManaged}>
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

                <DataTable columns={columns} data={permissionsData} />
              </>
            )}
          </div>
        )}

        <DialogFooter className="justify-start">
          {step === 1 ? (
            <Button className="w-full" onClick={handleNextStep}>
              Next
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => setIsOpen(false)}>
                Inherit
              </Button>
              <Button className="flex-1" onClick={handleBack}>
                Back
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default InheritPermissionDialog

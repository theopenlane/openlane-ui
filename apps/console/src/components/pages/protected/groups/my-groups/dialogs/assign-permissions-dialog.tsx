'use client'
import React, { useState } from 'react'
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

const permissions = [
  { id: 'CC1.2', description: 'The board of directors demonstrates independence from management and exercises oversight of the development and performance of internal control. (COSO Principle 2)' },
  { id: 'CC2.2', description: 'Eu that pot iced americano crema roast wings pot a press panna.' },
]

const columns: ColumnDef<{ id: string; description: string; checked: boolean; togglePermission: (id: string) => void }>[] = [
  {
    header: '',
    accessorKey: 'checked',
    cell: ({ row }) => <Checkbox checked={row.original.checked} onCheckedChange={() => row.original.togglePermission(row.original.id)} />,
  },
  {
    header: 'Object',
    accessorKey: 'id',
  },
  {
    header: 'Description',
    accessorKey: 'description',
  },
]

const columnsStep2: ColumnDef<{ id: string; permission: string }>[] = [
  {
    header: 'Object',
    accessorKey: 'id',
  },
  {
    header: 'Permission',
    accessorKey: 'permission',
    cell: ({ row }) => (
      <Select>
        <SelectTrigger className="w-full">{row.original.permission}</SelectTrigger>
        <SelectContent>
          <SelectItem value="Viewer">Viewer</SelectItem>
          <SelectItem value="Editor">Editor</SelectItem>
          <SelectItem value="Admin">Admin</SelectItem>
        </SelectContent>
      </Select>
    ),
  },
]

const AssignPermissionsDialog = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const { toast } = useToast()
  const [step, setStep] = useState(1)

  const handleNext = () => {
    setStep(2)
  }

  const handleBack = () => {
    setStep(1)
  }
  const togglePermission = (id: string) => {
    setSelectedPermissions((prev) => (prev.includes(id) ? prev.filter((perm) => perm !== id) : [...prev, id]))
  }

  const handleSave = () => {
    toast({ title: `Assigned ${selectedPermissions.length} permission(s)`, variant: 'success' })
    setIsOpen(false)
  }

  const permissionData = permissions.map((perm) => ({
    ...perm,
    checked: selectedPermissions.includes(perm.id),
    togglePermission,
  }))

  const step2Data = permissions.filter((perm) => selectedPermissions.includes(perm.id)).map((perm) => ({ id: perm.id, permission: 'Viewer' }))

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" icon={<Plus />} iconPosition="left">
          Assign permissions to group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Assign permissions</DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <>
            {' '}
            <div className="flex items-center gap-2.5">
              <div className="flex gap-2 flex-col">
                <Label>Select Object</Label>
                <Select>
                  <SelectTrigger className="border-brand w-[150px]">Control</SelectTrigger>
                  <SelectContent>
                    <SelectItem value="control">Control</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 flex-col">
                <Label>Search</Label>
                <Input placeholder="Type object name ..." className="border-brand h-10 w-[200px]" />
              </div>
            </div>
            <DataTable columns={columns} data={permissionData} />
            <DialogFooter className="flex justify-start pt-4">
              <Button className="w-[180px]" onClick={handleNext}>
                Next ({selectedPermissions.length})
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <p>You are about to add {selectedPermissions.length} relationship(s) to the group. Black cappuccino foam decaffeinated robust wings cappuccino spoon dripper grinder doppio espresso go.</p>
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

'use client'

import { Button } from '@repo/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Info } from 'lucide-react'
import { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger } from '@repo/ui/dialog'
import { Label } from '@repo/ui/label'

// Dummy users for now; replace with real data later
const users = [
  { id: '1', name: 'Sally Roberts' },
  { id: '2', name: 'Sandy Ross' },
]

export const ProgramSettingsAssignUserDialog = () => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<'Admin' | 'Member'>('Admin')

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="h-8 !px-2">Assign</Button>
      </DialogTrigger>

      <DialogContent className=" max-w-sm p-6 rounded-xl">
        <h2 className="text-2xl font-semibold mb-4">Assign User</h2>

        <div className="space-y-4">
          <div>
            <Label className="text-sm mb-1 block">Choose a user</Label>
            <Select value={selectedUser ?? ''} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="-" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm mb-1 block flex items-center gap-1">
              Role <Info size={16} />
            </Label>
            <Select value={selectedRole} onValueChange={(val) => setSelectedRole(val as 'Admin' | 'Member')}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 mt-4">
            <Button>Assign</Button>
            <DialogTrigger asChild>
              <Button variant="back">Cancel</Button>
            </DialogTrigger>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

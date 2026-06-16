'use client'

import React from 'react'
import { Button } from '@repo/ui/button'
import { Plus, ShieldCheck } from 'lucide-react'
import { ManageAdditionalRolesDialog } from '@/components/shared/organization-roles/manage-additional-roles-dialog'
import { AdditionalRolesCell } from '@/components/shared/organization-roles/additional-roles-cell'
import { useGroupRoleDialog } from './dialogs/use-group-role-dialog'

const GroupRolesTable = () => {
  const { open, setOpen, selectedGroup, groupName, currentRoleNames, disabled, onSaved } = useGroupRoleDialog()

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck width={16} height={16} className="text-brand" />
          <div>
            <p className="font-semibold">Roles</p>
            <p className="text-xs text-text-light">Functional roles this group has.</p>
          </div>
        </div>
        <Button type="button" variant="secondary" icon={<Plus />} iconPosition="left" disabled={disabled} onClick={() => setOpen(true)}>
          Add role
        </Button>
      </div>

      <div className="flex items-center gap-2 rounded-md border border-dashed p-3">
        <AdditionalRolesCell roles={currentRoleNames} />
      </div>

      {selectedGroup && (
        <ManageAdditionalRolesDialog
          open={open}
          onOpenChange={setOpen}
          subjectType="group"
          subjectIds={[selectedGroup]}
          subjectName={groupName}
          currentRoleNames={currentRoleNames}
          onSaved={onSaved}
        />
      )}
    </div>
  )
}

export default GroupRolesTable

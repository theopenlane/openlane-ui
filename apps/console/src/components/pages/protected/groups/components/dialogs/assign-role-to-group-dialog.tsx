'use client'

import React from 'react'
import { Button } from '@repo/ui/button'
import { Plus } from 'lucide-react'
import { ManageAdditionalRolesDialog } from '@/components/shared/organization-roles/manage-additional-roles-dialog'
import { useGroupRoleDialog } from './use-group-role-dialog'

const AssignRoleToGroupDialog = () => {
  const { open, setOpen, selectedGroup, groupName, currentRoleNames, disabled } = useGroupRoleDialog()

  return (
    <>
      <Button type="button" variant="secondary" icon={<Plus />} iconPosition="left" disabled={disabled} onClick={() => setOpen(true)}>
        Assign role to group
      </Button>
      {selectedGroup && <ManageAdditionalRolesDialog open={open} onOpenChange={setOpen} subjectType="group" subjectIds={[selectedGroup]} subjectName={groupName} currentRoleNames={currentRoleNames} />}
    </>
  )
}

export default AssignRoleToGroupDialog

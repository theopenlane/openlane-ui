'use client'
import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Lightbulb } from 'lucide-react'
import MultipleSelector from '@repo/ui/multiple-selector'

const AdvancedSetupStep4 = () => {
  const { setValue, watch } = useFormContext()

  const admins = watch('programAdmins') || []
  const members = watch('programMembers') || []
  const editGroups = watch('editAccessGroups') || []
  const readOnlyGroups = watch('readOnlyGroups') || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium">Add Team Members</h2>
        <p className="text-sm text-muted-foreground">Assign program admins and members, or bring in groups with edit or view access. This keeps ownership clear and collaboration easy.</p>
      </div>

      {/* Tips card */}
      <div className="p-4 rounded-md border border-tip-border bg-tip-background">
        <div className="flex gap-2 items-start mb-3">
          <Lightbulb className="text-tip-text" size={18} />
          <span className="text-sm text-tip-text">Tips</span>
        </div>
        <p className="text-sm text-tip-text">
          Admins have complete control to manage program data, while members can only edit their assigned sections. Groups with Edit Access can both read and write, whereas those with Read-Only Access
          can only view the information.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-5">
        {/* Program Admins */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm">Program Admins</label>
          <MultipleSelector placeholder="Search users..." value={admins} onChange={(val) => setValue('programAdmins', val)} />
        </div>

        {/* Program Members */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm">Program Members</label>
          <MultipleSelector placeholder="Search users..." value={members} onChange={(val) => setValue('programMembers', val)} />
        </div>

        {/* Groups with Edit Access */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm">Groups with Edit Access</label>
          <MultipleSelector placeholder="Search groups..." value={editGroups} onChange={(val) => setValue('editAccessGroups', val)} />
        </div>

        {/* Groups with Read Only Access */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm">Groups with Read Only Access</label>
          <MultipleSelector placeholder="Search groups..." value={readOnlyGroups} onChange={(val) => setValue('readOnlyGroups', val)} />
        </div>
      </div>
    </div>
  )
}

export default AdvancedSetupStep4

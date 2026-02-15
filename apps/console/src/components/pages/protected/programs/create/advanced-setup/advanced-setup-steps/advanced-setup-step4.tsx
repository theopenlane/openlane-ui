'use client'
import React from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Lightbulb } from 'lucide-react'
import MultipleSelector from '@repo/ui/multiple-selector'
import { useUserSelect } from '@/lib/graphql-hooks/members'
import { useGroupSelect } from '@/lib/graphql-hooks/groups'
import { WizardValues } from '../advanced-setup-wizard-config'
import { useSession } from 'next-auth/react'
import MembersInviteSheet from '@/components/pages/protected/user-management/members/sidebar/members-invite-sheet'

type AdvancedSetupStep4Props = {
  isMemberSheetOpen: boolean
  setIsMemberSheetOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const AdvancedSetupStep4: React.FC<AdvancedSetupStep4Props> = ({ isMemberSheetOpen, setIsMemberSheetOpen }: AdvancedSetupStep4Props) => {
  const { control } = useFormContext<WizardValues>()
  const { data } = useSession()
  const { groups, groupOptions } = useGroupSelect()
  const whereNotCurrentUser = { not: { userID: data?.user?.userId } }
  const { members, userOptions } = useUserSelect({ where: whereNotCurrentUser })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium">Add Team Members</h2>
        <p className="text-sm text-muted-foreground">Assign program admins and members, or bring in groups with edit or view access. This keeps ownership clear and collaboration easy.</p>
      </div>
      <MembersInviteSheet isMemberSheetOpen={isMemberSheetOpen} setIsMemberSheetOpen={setIsMemberSheetOpen} />
      {/* Tips card */}
      <div className="p-4 rounded-md border border-tip-border bg-tip-background">
        <div className="flex gap-2 items-start mb-3">
          <Lightbulb className="text-tip-text" size={18} />
          <span className="text-sm text-tip-text">Tips</span>
        </div>
        <p className="text-sm text-tip-text">
          Admins have complete control to manage program data, while members can only view information within the program. Groups with edit access can both read and write, whereas those with read-only
          access can only view the information.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-5">
        {/* Program Admins */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm">Program Admins</label>
          <Controller
            control={control}
            name="programAdmins"
            render={({ field }) => (
              <MultipleSelector
                placeholder="Search users..."
                options={userOptions}
                value={
                  field.value?.map((m) => ({
                    label: m.user.displayName,
                    value: m.user.id,
                  })) ?? []
                }
                onChange={(selected) => field.onChange(members.filter((m) => selected.some((s) => s.value === m.user.id)))}
              />
            )}
          />
        </div>

        {/* Program Members */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm">Program Members</label>
          <Controller
            control={control}
            name="programMembers"
            render={({ field }) => (
              <MultipleSelector
                placeholder="Search users..."
                options={userOptions}
                value={
                  field.value?.map((m) => ({
                    label: m.user.displayName,
                    value: m.user.id,
                  })) ?? []
                }
                onChange={(selected) => field.onChange(members.filter((m) => selected.some((s) => s.value === m.user.id)))}
              />
            )}
          />
        </div>

        {/* Groups with Edit Access */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm">Groups with Edit Access</label>
          <Controller
            control={control}
            name="editAccessGroups"
            render={({ field }) => (
              <MultipleSelector
                placeholder="Search groups..."
                options={groupOptions}
                value={
                  field.value?.map((g) => ({
                    label: g.displayName || g.name,
                    value: g.id,
                  })) ?? []
                }
                onChange={(selected) => field.onChange(groups.filter((g) => selected.some((s) => s.value === g.id)))}
              />
            )}
          />
        </div>

        {/* Groups with Read Only Access */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm">Groups with Read Only Access</label>
          <Controller
            control={control}
            name="readOnlyGroups"
            render={({ field }) => (
              <MultipleSelector
                placeholder="Search groups..."
                options={groupOptions}
                value={
                  field.value?.map((g) => ({
                    label: g.displayName || g.name,
                    value: g.id,
                  })) ?? []
                }
                onChange={(selected) => field.onChange(groups.filter((g) => selected.some((s) => s.value === g.id)))}
              />
            )}
          />
        </div>
      </div>
    </div>
  )
}

export default AdvancedSetupStep4

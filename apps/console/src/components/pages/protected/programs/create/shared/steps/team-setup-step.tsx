'use client'
import React, { useState } from 'react'
import { Button } from '@repo/ui/button'
import { UserPlus, Clock, Lightbulb } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import { FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import MultipleSelector from '@repo/ui/multiple-selector'
import { useFormContext } from 'react-hook-form'
import { useUserSelect } from '@/lib/graphql-hooks/member'
import { useGroupSelect } from '@/lib/graphql-hooks/group'
import { useSession } from 'next-auth/react'
import MembersInviteSheet from '@/components/pages/protected/organization-settings/members/sidebar/members-invite-sheet'

export default function TeamSetupStep() {
  const [showInviteForm, setShowInviteForm] = useState(false)
  const { data } = useSession()
  const { groupOptions } = useGroupSelect()
  const whereNotCurrentUser = { not: { userID: data?.user?.userId } }
  const { userOptions } = useUserSelect({ where: whereNotCurrentUser })
  const [isMemberSheetOpen, setIsMemberSheetOpen] = useState(false)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Team setup</h2>
          <p className="text-sm text-muted-foreground">Want to invite team members now?</p>
        </div>
        {showInviteForm && (
          <>
            <Button type="button" variant="secondary" size="md" iconPosition="left" onClick={() => setIsMemberSheetOpen(true)}>
              Invite member
            </Button>
            <MembersInviteSheet isMemberSheetOpen={isMemberSheetOpen} setIsMemberSheetOpen={setIsMemberSheetOpen} />
          </>
        )}
      </div>

      {!showInviteForm ? (
        <div className="grid grid-cols-2 gap-3">
          <Button type="button" variant="secondary" className="h-28" onClick={() => setShowInviteForm(true)}>
            <div className="flex flex-col items-center justify-center gap-1">
              <UserPlus className="!h-5 !w-5" size={20} />
              <span>Add teammates now</span>
            </div>
          </Button>
          <Button type="submit" variant="secondary" className="h-28">
            <div className="flex flex-col items-center justify-center gap-1">
              <Clock className="!h-5 !w-5" size={20} />
              <span>I&apos;ll do this later</span>
            </div>
          </Button>
        </div>
      ) : (
        <>
          <Card className="p-4 flex flex-col items-start gap-3 border-tip-border bg-tip-background">
            <div className="flex gap-2 items-center mb-3">
              <Lightbulb className="text-tip-text" size={20} />
              <span className="text-sm text-tip-text">Tips</span>
            </div>
            <p className="text-sm text-tip-text">
              Admins have complete control to manage program data, while members can only edit their assigned sections. Groups with Edit Access can both read and write, whereas those with Read-Only
              Access can only view the information.
            </p>
          </Card>

          <div className="space-y-6">
            <AddSelectDropdown fieldName="programAdmins" formLabel="Program Admins" placeholder="Search users..." options={userOptions} />
            <AddSelectDropdown fieldName="programMembers" formLabel="Program Members" placeholder="Search users..." options={userOptions} />
            <AddSelectDropdown fieldName="editorIDs" formLabel="Groups with Edit Access" placeholder="Search groups..." options={groupOptions} />
            <AddSelectDropdown fieldName="viewerIDs" formLabel="Groups with Read Only Access" placeholder="Search groups..." options={groupOptions} />
          </div>
        </>
      )}
    </div>
  )
}

type AddSelectDropdownProps = {
  fieldName: string
  formLabel: string
  placeholder: string
  options: { label: string; value: string }[]
}

export const AddSelectDropdown = ({ fieldName, formLabel, placeholder, options }: AddSelectDropdownProps) => {
  const { register, control } = useFormContext()

  return (
    <FormField
      control={control}
      name={register(fieldName).name}
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor={field.name}>{formLabel}</FormLabel>
          <FormControl>
            <MultipleSelector
              placeholder={placeholder}
              options={options}
              value={options.filter((option) => field.value?.includes(option.value))}
              onChange={(selected) => field.onChange(selected.map((o) => o.value))}
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
}

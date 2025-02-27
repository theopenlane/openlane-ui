'use client'

import React, { useMemo } from 'react'
import { InternalPolicyByIdFragment } from '@repo/codegen/src/schema'
import { Binoculars, FileStack, ScrollText, Tag, CalendarCheck2, CalendarClock } from 'lucide-react'
import { MetaPanel, formatTime } from '@/components/shared/meta-panel/meta-panel'
import { Panel } from '@repo/ui/panel'
import { Button } from '@repo/ui/button'
import { UseFormReturn } from 'react-hook-form'
import { EditPolicyFormData } from './policy-edit-form-types'

type PolicyEditSidebarProps = {
  policy: InternalPolicyByIdFragment
  form: UseFormReturn<EditPolicyFormData>
  handleSave: () => void
}

// export const PolicyEditSidebar: React.FC<PolicyEditSidebarProps> = function ({ policy, form, handleSave }) {
export const PolicyEditSidebar = ({ policy, form, handleSave }: PolicyEditSidebarProps) => {
  if (!policy) return null

  const sidebarItems = useMemo(() => {
    return {
      status: [
        { icon: Binoculars, label: 'Status', value: policy.status },
        { icon: FileStack, label: 'Version', value: policy.version },
        { icon: ScrollText, label: 'Policy Type', value: policy.policyType },
        { icon: CalendarCheck2, label: 'Created At', value: formatTime(policy.createdAt) },
        { icon: CalendarClock, label: 'Updated At', value: formatTime(policy.updatedAt) },
      ],
    }
  }, [policy])

  const submittabled = form.formState.isDirty && form.formState.isValid && !form.formState.disabled

  return (
    <div className="w-full flex flex-col gap-5">
      <Button onClick={handleSave} disabled={!submittabled}>
        Save policy
      </Button>
      <MetaPanel entries={sidebarItems.status} />
      <Panel>
        <h1>
          <Tag />
          Tags
        </h1>
        <input placeholder="Choose existing or add tag..."></input>
      </Panel>
    </div>
  )
}

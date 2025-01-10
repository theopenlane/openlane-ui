'use client'

import React from 'react'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { Button } from '@repo/ui/button'
import { EditableTextarea } from '@repo/ui/textarea'
import { EditableField, Policy } from './policy-page'

type PolicySidebarProps = {
  policy: Policy
  onFieldChange: (field: EditableField, value: string) => void
  saveField: (field: EditableField, value: string) => void
  onSave: () => void
  onDelete: () => void
}

export const PolicySidebar: React.FC<PolicySidebarProps> = function ({
  policy,
  onFieldChange,
  onSave,
  onDelete,
  saveField,
}) {
  console.log('PolicySidebar: render')

  return (
    <div className="flex flex-col gap-5 w-full">
      <Panel className="p-0 border-0 gap-0">
        <PanelHeader heading="Description" className="p-4 text-base" noBorder />

        <div className="divide-y divide-oxford-blue-100 dark:divide-oxford-blue-900 *:px-4 *:py-2">
          <div>
            <h3 className="text-oxford-blue-500 text-sm mb-1">Description</h3>
            <EditableTextarea
              rows={7}
              onSave={(v: string) => saveField('description', v)}
              onChange={(e) => onFieldChange('description', e.target.value)}
              value={policy.description ?? ''}
              placeholder="provide a description"
            />
          </div>
          <div>
            <h3 className="text-oxford-blue-500 text-sm mb-1">Background</h3>
            <EditableTextarea
              rows={7}
              onChange={(e) => onFieldChange('background', e.target.value)}
              value={policy.background ?? ''}
              onSave={(v: string) => saveField('background', v)}
              placeholder="provide a background"
            />
          </div>
          <div>
            <h3 className="text-oxford-blue-500 text-sm mb-1">Purpose and Scope</h3>
            <EditableTextarea
              rows={7}
              onChange={(e) => onFieldChange('purposeAndScope', e.target.value)}
              value={policy.purposeAndScope ?? ''}
              onSave={(v: string) => saveField('purposeAndScope', v)}
              placeholder="provide a purpose and scope"
            />
          </div>
        </div>
      </Panel>

      <Panel className="p-0 border-0 gap-0">
        <PanelHeader heading="Actions" className="p-4 text-base" noBorder />
        <div className="divide-y divide-oxford-blue-100 dark:divide-oxford-blue-900 *:px-4 *:py-2">
          <div className="mb-4">
            {policy.id ? (
              <Button variant="redOutline" size="sm" onClick={onDelete} full>
                Delete
              </Button>
            ) : (
              <Button variant="filled" onClick={onSave} size="sm" full>
                Save
              </Button>
            )}
          </div>
        </div>
      </Panel>
    </div>
  )
}

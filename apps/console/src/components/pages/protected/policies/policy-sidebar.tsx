'use client'

import React, { useContext, Suspense } from 'react'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { Button } from '@repo/ui/button'
import { EditableTextarea } from '@repo/ui/textarea'
import { PolicyContext } from './context'

export type UpdateableFields = 'description' | 'background' | 'purposeAndScope'

export const PolicySidebar: React.FC = function () {
  const { policy, onFieldChange, saveField, create } = useContext(PolicyContext)

  if (!policy || !onFieldChange || !saveField) {
    return
  }

  return (
    <div className="flex flex-col gap-5 w-full">
      <Panel className="p-0 border-0 gap-0">
        <PanelHeader heading="Description" className="p-4 text-base" noBorder />

        <div className="divide-y divide-oxford-blue-100 dark:divide-oxford-blue-900 *:px-4 *:py-2">
          <div>
            <h3 className="text-oxford-blue-500 text-sm mb-1">Description</h3>
            <Suspense fallback="Loading">
              <EditableTextarea
                rows={7}
                onBlur={(e) => saveField('description', e.target.value)}
                onChange={(e) => onFieldChange('description', e.target.value)}
                value={policy.description ?? ''}
                placeholder="provide a description"
              />
            </Suspense>
          </div>
          <div>
            <h3 className="text-oxford-blue-500 text-sm mb-1">Background</h3>
            <EditableTextarea
              rows={7}
              onBlur={(e) => saveField('background', e.target.value)}
              onChange={(e) => onFieldChange('background', e.target.value)}
              value={policy.background ?? ''}
              placeholder="provide a background"
            />
          </div>
          <div>
            <h3 className="text-oxford-blue-500 text-sm mb-1">Purpose and Scope</h3>
            <EditableTextarea
              rows={7}
              onBlur={(e) => saveField('purposeAndScope', e.target.value)}
              onChange={(e) => onFieldChange('purposeAndScope', e.target.value)}
              value={policy.purposeAndScope ?? ''}
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
              <Button variant="redOutline" size="sm" full>
                Delete
              </Button>
            ) : (
              <Button variant="filled" onClick={create} size="sm" full>
                Create
              </Button>
            )}
          </div>
        </div>
      </Panel>
      <pre>{JSON.stringify(policy, null, 2)}</pre>
    </div>
  )
}

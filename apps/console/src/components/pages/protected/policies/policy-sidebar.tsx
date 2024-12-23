'use client'

import React from 'react'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { Button } from '@repo/ui/button'
import { EditableTextarea } from '@repo/ui/textarea'
import { usePolicyPageActions, usePolicyPageStore } from '@/hooks/usePolicyPage'
import { useShallow } from 'zustand/react/shallow'

export type UpdateableFields = 'description' | 'background' | 'purposeAndScope' | 'name'

export const PolicySidebar: React.FC = function () {
  const { saveField, setField, delete: deletePolicy, save } = usePolicyPageActions()
  const { id, description, background, purposeAndScope } = usePolicyPageStore(
    useShallow((state) => {
      const { id, description, background, purposeAndScope } = state.policy
      return { id, description, background, purposeAndScope }
    }),
  )

  return (
    <div className="flex flex-col gap-5 w-full">
      <Panel className="p-0 border-0 gap-0">
        <PanelHeader heading="Description" className="p-4 text-base" noBorder />

        <div className="divide-y divide-oxford-blue-100 dark:divide-oxford-blue-900 *:px-4 *:py-2">
          <div>
            <h3 className="text-oxford-blue-500 text-sm mb-1">Description</h3>
            <EditableTextarea
              rows={7}
              onBlur={(e) => saveField('description', e.target.value)}
              onChange={(e) => setField('description', e.target.value)}
              value={description ?? ''}
              placeholder="provide a description"
            />
          </div>
          <div>
            <h3 className="text-oxford-blue-500 text-sm mb-1">Background</h3>
            <EditableTextarea
              rows={7}
              onBlur={(e) => saveField('background', e.target.value)}
              onChange={(e) => setField('background', e.target.value)}
              value={background ?? ''}
              placeholder="provide a background"
            />
          </div>
          <div>
            <h3 className="text-oxford-blue-500 text-sm mb-1">Purpose and Scope</h3>
            <EditableTextarea
              rows={7}
              onBlur={(e) => saveField('purposeAndScope', e.target.value)}
              onChange={(e) => setField('purposeAndScope', e.target.value)}
              value={purposeAndScope ?? ''}
              placeholder="provide a purpose and scope"
            />
          </div>
        </div>
      </Panel>

      <Panel className="p-0 border-0 gap-0">
        <PanelHeader heading="Actions" className="p-4 text-base" noBorder />
        <div className="divide-y divide-oxford-blue-100 dark:divide-oxford-blue-900 *:px-4 *:py-2">
          <div className="mb-4">
            {id ? (
              <Button variant="redOutline" size="sm" onClick={deletePolicy} full>
                Delete
              </Button>
            ) : (
              <Button variant="filled" onClick={save} size="sm" full>
                Create
              </Button>
            )}
          </div>
        </div>
      </Panel>
    </div>
  )
}

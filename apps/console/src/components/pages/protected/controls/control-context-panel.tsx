'use client'

import React from 'react'
import { Panel } from '@repo/ui/panel'
import { cn } from '@repo/ui/lib/utils'
import { type Group } from '@repo/codegen/src/schema'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { Avatar } from '@/components/shared/avatar/avatar'
import StandardChip from '@/components/pages/protected/standards/shared/standard-chip'

// structural so both control and subcontrol records fit
export type TControlContextRecord = {
  refCode?: string | null
  title?: string | null
  description?: string | null
  referenceFramework?: string | null
  auditorReferenceID?: string | null
  controlOwner?: { displayName?: string | null } | null
}

type TControlContextPanelProps = {
  control?: TControlContextRecord | null
  descriptionClassName?: string
  hideHeader?: boolean
  hideRefCode?: boolean
  children?: React.ReactNode
}

const ControlContextPanel: React.FC<TControlContextPanelProps> = ({ control, descriptionClassName, hideHeader, hideRefCode, children }) => {
  const { convertToReadOnly } = usePlateEditor()

  return (
    <Panel className="p-4 flex flex-col gap-3">
      {!hideHeader && <p className="text-lg font-medium">Control Context</p>}
      {(!hideRefCode || control?.title || control?.auditorReferenceID) && (
        <div className="flex items-center gap-2 flex-wrap">
          {!hideRefCode && <span className="font-medium">{control?.refCode ?? '—'}</span>}
          {control?.title ? <span className="text-muted-foreground">{control.title}</span> : null}
          {control?.auditorReferenceID ? <span className="text-xs text-muted-foreground">({control.auditorReferenceID})</span> : null}
        </div>
      )}
      {control?.description ? <div className={cn('text-sm text-muted-foreground', descriptionClassName)}>{convertToReadOnly(control.description)}</div> : null}
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Framework</span>
          <StandardChip referenceFramework={control?.referenceFramework ?? undefined} />
        </div>
        {control?.controlOwner ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Control Owner</span>
            <div className="flex items-center gap-2">
              <Avatar entity={control.controlOwner as Group} className="h-6 w-6" />
              <span>{control.controlOwner.displayName || '-'}</span>
            </div>
          </div>
        ) : null}
      </div>
      {children}
    </Panel>
  )
}

export default ControlContextPanel

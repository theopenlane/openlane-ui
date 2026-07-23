'use client'

import React, { useMemo } from 'react'
import { Panel } from '@repo/ui/panel'
import { type Group } from '@repo/codegen/src/schema'
import { type ControlByIdNode } from '@/lib/graphql-hooks/control'
import { HTML_SANITIZE_CONFIG, useHtmlPurifier } from '@/lib/html/sanitize-html'
import { Avatar } from '@/components/shared/avatar/avatar'
import StandardChip from '@/components/pages/protected/standards/shared/standard-chip'

type TControlContextPanelProps = {
  control?: ControlByIdNode
  children?: React.ReactNode
}

const ControlContextPanel: React.FC<TControlContextPanelProps> = ({ control, children }) => {
  const purifier = useHtmlPurifier()
  const description = control?.description
  const descriptionHtml = useMemo(() => (description ? purifier.sanitize(description, HTML_SANITIZE_CONFIG) : ''), [purifier, description])

  return (
    <Panel className="p-4 flex flex-col gap-3">
      <p className="text-lg font-medium">Control Context</p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-medium">{control?.refCode ?? '—'}</span>
        {control?.title ? <span className="text-muted-foreground">{control.title}</span> : null}
        {control?.auditorReferenceID ? <span className="text-xs text-muted-foreground">({control.auditorReferenceID})</span> : null}
      </div>
      {descriptionHtml ? <div className="rich-text text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: descriptionHtml }} /> : null}
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

'use client'

import React from 'react'
import { type InternalPolicyByIdFragment } from '@repo/codegen/src/schema'

type Props = {
  policy: InternalPolicyByIdFragment
}

const IntegrationDocumentView: React.FC<Props> = ({ policy }) => {
  if (!policy.liveExternalContents) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <p>No document contents available. The integration may still be syncing.</p>
      </div>
    )
  }

  return <iframe srcDoc={policy.liveExternalContents} sandbox="" className="w-full border-0 min-h-[800px]" title="Policy document" />
}

export default IntegrationDocumentView

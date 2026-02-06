'use client'

import React from 'react'
import PoliciesTable from './policies-table'
import ProceduresTable from './procedures-table'

type DocumentationTabProps = {
  controlId?: string
  subcontrolIds: string[]
}

const DocumentationTab: React.FC<DocumentationTabProps> = ({ controlId, subcontrolIds }) => {
  if (!controlId && subcontrolIds.length === 0) {
    return null
  }

  return (
    <div className="space-y-6 mt-6">
      <ProceduresTable controlId={controlId} subcontrolIds={subcontrolIds} />
      <PoliciesTable controlId={controlId} subcontrolIds={subcontrolIds} />
    </div>
  )
}

export default DocumentationTab

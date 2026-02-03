'use client'

import React from 'react'
import PoliciesTable from '../documentation-components/policies-table'
import ProceduresTable from '../documentation-components/procedures-table'
import TasksTable from '../documentation-components/tasks-table'
import ProgramsTable from '../documentation-components/programs-table'
import RisksTable from '../documentation-components/risks-table'

type DocumentationTabProps = {
  controlId: string
  subcontrolIds: string[]
}

const DocumentationTab: React.FC<DocumentationTabProps> = ({ controlId, subcontrolIds }) => {
  return (
    <div className="space-y-6 mt-6">
      <ProceduresTable controlId={controlId} subcontrolIds={subcontrolIds} />
      <PoliciesTable controlId={controlId} subcontrolIds={subcontrolIds} />
      <TasksTable controlId={controlId} subcontrolIds={subcontrolIds} />
      <ProgramsTable controlId={controlId} subcontrolIds={subcontrolIds} />
      <RisksTable controlId={controlId} subcontrolIds={subcontrolIds} />
    </div>
  )
}

export default DocumentationTab

import React from 'react'
import SubcontrolsTable from '@/components/pages/protected/controls/subcontrols-table.tsx'
import RelatedControls from '@/components/pages/protected/controls/related-controls.tsx'

interface SubcontrolEdge {
  node?: {
    refCode: string
    description?: string | null
    id: string
  } | null
}

interface LinkedControlsTabProps {
  subcontrols: (SubcontrolEdge | null)[]
  totalCount: number
  refCode: string
  referenceFramework?: string | null
  canCreateMappedControl: boolean
}

const LinkedControlsTab: React.FC<LinkedControlsTabProps> = ({ subcontrols, totalCount, refCode, referenceFramework, canCreateMappedControl }) => {
  return (
    <div className="space-y-6">
      <SubcontrolsTable subcontrols={subcontrols} totalCount={totalCount} />
      <RelatedControls
        canCreate={canCreateMappedControl}
        refCode={refCode}
        sourceFramework={referenceFramework}
        title="Organization Controls"
        filterFramework="custom"
        includeSubcontrols={false}
        showActions={false}
      />
      <RelatedControls canCreate={canCreateMappedControl} refCode={refCode} sourceFramework={referenceFramework} title="Framework mappings" filterFramework="non-custom" showActions={false} />
    </div>
  )
}

export default LinkedControlsTab

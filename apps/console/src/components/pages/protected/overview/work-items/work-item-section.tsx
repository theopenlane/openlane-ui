import React from 'react'
import type { WorkItem } from './types'
import SectionHeader from './section-header'
import WorkItemRow from './work-item-row'

type WorkItemSectionProps = {
  label: string
  items: WorkItem[]
  showHeader: boolean
  showKindLabel?: boolean
}

const WorkItemSection = ({ label, items, showHeader, showKindLabel = false }: WorkItemSectionProps) => {
  if (items.length === 0) return null

  return (
    <div className="space-y-3">
      {showHeader && <SectionHeader label={label} count={items.length} />}
      {items.map((item) => (
        <WorkItemRow key={item.key} item={item} showKindLabel={showKindLabel} />
      ))}
    </div>
  )
}

export default WorkItemSection
